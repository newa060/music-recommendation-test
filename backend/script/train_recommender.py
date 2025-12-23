import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from pymongo import MongoClient

# ---------------- DB CONNECTION ----------------
client = MongoClient("mongodb://localhost:27017/")
db = client["musicDB"]
songs_collection = db["songs"]

# ---------------- FETCH SONG DATA ----------------
songs = list(songs_collection.find())

if len(songs) == 0:
    raise Exception("❌ No songs found in database")

X = []
y = []

# ---------------- AUTO EMOTION LABELING ----------------
def infer_emotion(danceability, tempo, acousticness, energy, valence):
    """
    Emotion labeling based on:
    - Universal MIR standards
    - Adapted to real CSV distribution
    """

    # HAPPY: positive + energetic + rhythmic
    if (
        valence >= 0.50 and
        energy >= 0.60 and
        danceability >= 0.55 and
        tempo >= 105 and
        acousticness <= 0.45
    ):
        return "happy"

    # SAD: low positivity + low energy + acoustic
    elif (
        valence <= 0.35 and
        energy <= 0.45 and
        acousticness >= 0.55 and
        tempo <= 100
    ):
        return "sad"

    # NEUTRAL: everything else
    else:
        return "neutral"


for song in songs:
    try:
        danceability = float(song["danceability"])
        tempo = float(song["tempo"])
        acousticness = float(song["acousticness"])
        energy = float(song["energy"])
        valence = float(song["valence"])

        X.append([
            danceability,
            tempo,
            acousticness,
            energy,
            valence
        ])

        emotion = infer_emotion(
            danceability, tempo, acousticness, energy, valence
        )
        y.append(emotion)

    except KeyError:
        continue

X = np.array(X)

if len(X) == 0:
    raise Exception("❌ Required audio features missing in DB")

# ---------------- ENCODE LABELS ----------------
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# ---------------- TRAIN MODEL ----------------
model = RandomForestClassifier(
    n_estimators=150,
    random_state=42
)
model.fit(X, y_encoded)

# ---------------- SAVE MODEL ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model, os.path.join(MODEL_DIR, "song_recommender.joblib"))
joblib.dump(label_encoder, os.path.join(MODEL_DIR, "emotion_encoder.joblib"))

print("✅ Song recommender trained successfully")
print("📁 Saved:")
print("   - song_recommender.joblib")
print("   - emotion_encoder.joblib")
