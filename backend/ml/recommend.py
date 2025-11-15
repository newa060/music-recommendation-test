import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import joblib
import os
from pymongo import MongoClient
import sys
import json

# -------------------------------------------------------------------
# 📂 Base paths
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "song_recommender.joblib")

# -------------------------------------------------------------------
# 🔧 MongoDB Connection (Compass / Local)
# -------------------------------------------------------------------
def get_mongo_connection():
    """Connect to MongoDB Compass (local MongoDB server)"""
    try:
        # Local MongoDB Compass connection URI
        MONGO_URI = "mongodb://localhost:27017"

        # Connect to the local MongoDB instance
        client = MongoClient(MONGO_URI)
        client.admin.command("ping")
        print("✅ Connected to MongoDB Compass successfully!")
        return client
    except Exception as e:
        print(f"❌ MongoDB Compass connection failed: {e}")
        return None

# -------------------------------------------------------------------
# 🧩 Load Songs from MongoDB
# -------------------------------------------------------------------
def load_songs_from_mongodb(db_name="musicDB", collection_name="songs"):
    """Load songs data from MongoDB collection"""
    client = get_mongo_connection()
    if not client:
        raise Exception("Could not connect to MongoDB")

    try:
        # Use your local database name (change if needed)
        db = client[db_name]
        collection = db[collection_name]

        cursor = collection.find({})
        songs_df = pd.DataFrame(list(cursor))

        if songs_df.empty:
            print("⚠️ No songs found in MongoDB collection.")
        else:
            print(f"✅ Loaded {len(songs_df)} songs from MongoDB")

        if "_id" in songs_df.columns:
            songs_df["_id"] = songs_df["_id"].astype(str)

        return songs_df

    except Exception as e:
        print(f"❌ Error loading data from MongoDB: {e}")
        return None
    finally:
        client.close()

# -------------------------------------------------------------------
# 💾 Train Recommendation Model
# -------------------------------------------------------------------
def train_recommendation_model(use_mongodb=True):
    """Train song recommendation model using MongoDB or CSV data"""

    if use_mongodb:
        songs_df = load_songs_from_mongodb()
        if songs_df is None or songs_df.empty:
            print("❌ MongoDB empty or failed, using CSV fallback.")
            songs_df = pd.read_csv("musicDB.audio2.csv")
    else:
        songs_df = pd.read_csv("musicDB.audio2.csv")

    features = [
        "tempo", "energy", "danceability", "acousticness",
        "instrumentalness", "liveness", "valence", "beats", "rmse"
    ]

    missing_features = [f for f in features if f not in songs_df.columns]
    if missing_features:
        print(f"⚠️ Missing features: {missing_features}")
        features = [f for f in features if f in songs_df.columns]

    print(f"🔧 Using features: {features}")
    X = songs_df[features].fillna(songs_df[features].mean())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    nn = NearestNeighbors(n_neighbors=min(11, len(songs_df)), metric="cosine")
    nn.fit(X_scaled)

    model_package = {
        "scaler": scaler,
        "nn": nn,
        "songs_df": songs_df,
        "features": features,
        "data_source": "mongodb" if use_mongodb else "csv"
    }

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model_package, MODEL_PATH)

    print("✅ Model trained and saved successfully!")
    print(f"📊 Dataset size: {len(songs_df)} songs")
    print(f"🎯 Features used: {features}")
    print(f"💾 Source: {'MongoDB' if use_mongodb else 'CSV'}")

# -------------------------------------------------------------------
# 🎧 Recommend Songs
# -------------------------------------------------------------------
def recommend_songs(song_title, n_recommendations=5):
    """Recommend similar songs based on title"""
    try:
        if not os.path.exists(MODEL_PATH):
            return {"error": f"Model not found at {MODEL_PATH}. Please train it first."}

        model_package = joblib.load(MODEL_PATH)
        scaler = model_package["scaler"]
        nn = model_package["nn"]
        songs_df = model_package["songs_df"]
        features = model_package["features"]

        if "title" not in songs_df.columns:
            return {"error": "The dataset has no 'title' column."}

        mask = songs_df["title"].str.contains(song_title, case=False, na=False)
        matches = songs_df[mask]
        if matches.empty:
            return {"error": f"No song found with title: '{song_title}'"}

        song_idx = matches.index[0]
        song_features = songs_df.loc[song_idx, features].values.reshape(1, -1)
        song_features_df = pd.DataFrame(song_features, columns=features)
        song_scaled = scaler.transform(song_features_df)

        distances, indices = nn.kneighbors(song_scaled, n_neighbors=n_recommendations + 5)
        similar_indices = indices[0]
        similar_distances = distances[0]

        base_song = {
            "title": songs_df.loc[song_idx, "title"],
            "filename": songs_df.loc[song_idx, "filename"],
            "language": songs_df.loc[song_idx, "language"]
        }

        recs = []
        for i, d in zip(similar_indices, similar_distances):
            if i == song_idx:
                continue
            song = songs_df.iloc[i]
            recs.append({
                "title": song["title"],
                "filename": song["filename"],
                "language": song.get("language", ""),
                "similarity": float(1 - d)
            })

        recs = recs[:n_recommendations]

        return {"searched_song": base_song, "recommendations": recs}

    except Exception as e:
        return {"error": str(e)}

# -------------------------------------------------------------------
# 🧪 Test Mode
# -------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1:
        song_name = sys.argv[1]
        result = recommend_songs(song_name, n_recommendations=5)
        print(json.dumps(result, indent=2))
    else:
        print("🧪 Testing MongoDB Compass + Training Model...")
        songs_df = load_songs_from_mongodb()
        if songs_df is not None and not songs_df.empty:
            train_recommendation_model(use_mongodb=True)
            result = recommend_songs("Bholi", 3)
            print(json.dumps(result, indent=2))
        else:
            train_recommendation_model(use_mongodb=False)
