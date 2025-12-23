from pymongo import MongoClient
import gridfs
import os

# -----------------------------
# MongoDB Connection
# -----------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["musicDB"]

# GridFS with collection name "image"
fs = gridfs.GridFS(db, collection="image")

# -----------------------------
# FER-2013 Dataset Path
# -----------------------------
dataset_path = r"C:\Users\predator\Desktop\demo_gg\image\faces"  # use raw string

# -----------------------------
# Upload Images
# -----------------------------
for emotion in os.listdir(dataset_path):
    emotion_path = os.path.join(dataset_path, emotion)

    if os.path.isdir(emotion_path):
        for img_name in os.listdir(emotion_path):
            img_path = os.path.join(emotion_path, img_name)

            with open(img_path, "rb") as img:
                fs.put(
                    img,
                    filename=img_name,
                    emotion=emotion,
                    dataset="FER-2013"
                )

print("✅ FER-2013 images successfully stored in musicDB.image (GridFS)")
