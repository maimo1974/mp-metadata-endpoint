import express from "express";
import formidable from "formidable";
import { parseFile } from "music-metadata";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS ---
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("Metadata API is running");
});

// --- METADATA ROUTE ---
app.post("/metadata", (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Upload error" });
    }

    const uploadedFile = files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const metadata = await parseFile(uploadedFile.filepath);
      return res.json({ metadata });
    } catch (error) {
      console.error("Error extracting metadata:", error);
      return res.status(500).json({ error: "Could not extract metadata" });
    }
  });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
