from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import Image
import numpy as np
import tensorflow as tf
import base64
import json
import cv2
import os
import joblib
from pymongo import MongoClient

# ---------------- Flask setup ----------------
app = Flask(__name__)
CORS(app)

# ---------------- Paths ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

EMOTION_MODEL_PATH = os.path.join(MODEL_DIR, "emotion_cnn.keras")
LABELS_PATH = os.path.join(MODEL_DIR, "emotion_cnn.labels.json")
RECOMMENDER_PATH = os.path.join(MODEL_DIR, "song_recommender.joblib")
ENCODER_PATH = os.path.join(MODEL_DIR, "emotion_encoder.joblib")
CASCADE_PATH = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")

# ---------------- Load emotion CNN ----------------
emotion_model = tf.keras.models.load_model(EMOTION_MODEL_PATH)

with open(LABELS_PATH, "r") as f:
    emotion_labels = json.load(f)

print("✅ Emotion CNN loaded")

# ---------------- Load recommender ----------------
song_recommender = joblib.load(RECOMMENDER_PATH)
emotion_encoder = joblib.load(ENCODER_PATH)

print("✅ Song recommender loaded")

# ---------------- Load face detector ----------------
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
if face_cascade.empty():
    raise RuntimeError("❌ Haar Cascade not loaded")

# ---------------- MongoDB ----------------
client = MongoClient("mongodb://localhost:27017/")
db = client["musicDB"]
songs_collection = db["songs"]

# ---------------- Helpers ----------------
def decode_base64_image(b64_string):
    b64_string = b64_string.split(",")[-1]
    missing_padding = len(b64_string) % 4
    if missing_padding:
        b64_string += "=" * (4 - missing_padding)
    return base64.b64decode(b64_string)

def extract_face(pil_image):
    img = np.array(pil_image.convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        return None

    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return img[y:y+h, x:x+w]

def preprocess_face(face_img):
    face_img = cv2.resize(face_img, (224, 224))
    face_img = face_img.astype(np.float32)
    face_img = tf.keras.applications.mobilenet_v2.preprocess_input(face_img)
    return np.expand_dims(face_img, axis=0)

# ---------------- API ----------------
@app.route("/api/scan-face", methods=["POST"])
def scan_face():
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "Image not provided"}), 400

    try:
        image_bytes = decode_base64_image(data["image"])
        image = Image.open(BytesIO(image_bytes))
    except:
        return jsonify({"error": "Invalid image"}), 400

    face = extract_face(image)
    if face is None:
        return jsonify({
            "emotion": "neutral",
            "songs": []
        }), 200

    # -------- Emotion prediction --------
    face_tensor = preprocess_face(face)
    preds = emotion_model.predict(face_tensor)
    emotion = emotion_labels[int(np.argmax(preds))]

    print("😊 Detected emotion:", emotion)

    # -------- Fetch songs from MongoDB --------
    songs = list(songs_collection.find())
    if not songs:
        return jsonify({"emotion": emotion, "songs": []}), 200

    features = []
    valid_songs = []

    for s in songs:
        # Use .get() for required fields, ignore extra fields
        try:
            features.append([
                float(s.get("danceability", 0.5)),
                float(s.get("tempo", 120.0)),
                float(s.get("acousticness", 0.5)),
                float(s.get("energy", 0.5)),
                float(s.get("valence", 0.5))
            ])
            valid_songs.append(s)
        except Exception as e:
            print("Skipping song:", s.get("title", "Unknown"), "reason:", e)

    if not features:
        return jsonify({"emotion": emotion, "songs": []}), 200

    X = np.array(features)

    # -------- Rank songs using recommender --------
    probabilities = song_recommender.predict_proba(X)
    emotion_index = emotion_encoder.transform([emotion])[0]
    scores = probabilities[:, emotion_index]

    ranked = sorted(
        zip(valid_songs, scores),
        key=lambda x: x[1],
        reverse=True
    )

    recommended_songs = [
        {
            "title": song.get("title", "Unknown"),
            "score": round(float(score), 3)
        }
        for song, score in ranked[:5]  # top 5
    ]

    print("Top recommended songs:", [s["title"] for s in recommended_songs])

    return jsonify({
        "emotion": emotion,
        "songs": recommended_songs
    }), 200

# ---------------- Run ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
