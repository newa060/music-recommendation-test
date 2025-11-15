from pymongo import MongoClient
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import joblib

def train_model():
    try:
        # ✅ Your MongoDB Atlas connection string
        uri = "mongodb+srv://binodstha060:tribalrain060@newaapi.m9cgmkj.mongodb.net/?appName=NewaAPI"
        client = MongoClient(uri)

        # ✅ Make sure these names match exactly
        db = client["test"]
        collection = db["songs"]

        # ✅ Fetch data
        data = list(collection.find({}, {'_id': 0}))
        if not data:
            print("⚠️ No data found in MongoDB collection!")
            return

        df = pd.DataFrame(data)
        print("📄 Columns:", df.columns.tolist())
        print("✅ Loaded", len(df), "records from MongoDB")

        # ✅ Define your features and label
        features = [
            "acousticness", "beats", "bitrate_kbps_est", "danceability",
            "duration_sec_est", "energy", "instrumentalness", "liveness",
            "rmse", "tempo", "valence"
        ]

        for f in features:
            if f not in df.columns:
                print(f"⚠️ Missing column: {f}")
                return

        X = df[features].fillna(0)
        y = df["valence"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
        model = LinearRegression()
        model.fit(X_train, y_train)

        # ✅ Save trained model
        joblib.dump(model, "backend/ml/models/song_recommender.joblib")
        print("✅ Model trained and saved successfully!")

    except Exception as e:
        print("❌ Error while training:", e)

if __name__ == "__main__":
    train_model()
