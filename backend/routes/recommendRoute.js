import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ✅ For resolving backend/ml/recommend.py path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", (req, res) => {
  const songName = req.query.song;

  if (!songName) {
    return res.status(400).json({ error: "Missing 'song' query parameter" });
  }

  // ✅ Path to your recommend.py file
  const scriptPath = path.join(__dirname, "../ml/recommend.py");

  // ✅ Run the Python script with the song name
  const pythonProcess = spawn("python", [scriptPath, songName]);

  let dataString = "";
  let errorString = "";

  // ✅ Listen for output
  pythonProcess.stdout.on("data", (data) => {
    dataString += data.toString();
  });

  // ✅ Listen for errors
  pythonProcess.stderr.on("data", (data) => {
    errorString += data.toString();
  });

  // ✅ When Python script finishes
  pythonProcess.on("close", (code) => {
    if (errorString) {
      console.error("Python Error:", errorString);
      return res.status(500).json({ error: errorString });
    }

    try {
      // Parse the JSON returned by Python
      const parsed = JSON.parse(dataString);
      res.json(parsed);
    } catch (e) {
      console.error("JSON Parse Error:", e.message, dataString);
      res.status(500).json({ error: "Failed to parse Python output" });
    }
  });
});

export default router;
