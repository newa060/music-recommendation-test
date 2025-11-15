import express from "express";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const router = express.Router();

let gfsBucket = null;

// Ensure GridFS is ready before responding
mongoose.connection.once("open", () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: "audio" });
  console.log("🎵 GridFS Bucket ready (audio)");
});

// List all audio files
router.get("/files", async (req, res) => {
  if (!gfsBucket) return res.status(503).json({ message: "GridFS not ready yet" });

  try {
    const files = await gfsBucket.find().toArray();
    if (!files || files.length === 0) return res.status(404).json({ message: "No audio files found" });

    const formatted = files.map(f => ({
      filename: f.filename,
      length: f.length,
      uploadDate: f.uploadDate,
      contentType: f.contentType
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Stream audio by filename
router.get("/play/:filename", async (req, res) => {
  if (!gfsBucket) return res.status(503).json({ message: "GridFS not ready yet" });

  try {
    const { filename } = req.params;
    const files = await gfsBucket.find({ filename }).toArray();
    if (!files.length) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", files[0].contentType || "audio/mpeg");
    gfsBucket.openDownloadStreamByName(filename).pipe(res);
  } catch (err) {
    console.error("Error streaming file:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
