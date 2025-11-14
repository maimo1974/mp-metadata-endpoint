import express from "express";
import formidable from "formidable";
import { parseFile } from "music-metadata";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint di test
app.get("/", (req, res) => {
  res.send("Metadata API is running");
});

// Endpoint per estrarre metadati
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
      res.json({ metadata });
    } catch (error) {
      console.error("Metadata error:", error);
      res.status(500).json({ error: "Could not extract metadata" });
    } finally {
      // Cancella file temporaneo
      fs.unlink(uploadedFile.filepath, () => {});
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
