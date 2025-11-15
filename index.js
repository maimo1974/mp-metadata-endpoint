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

    // compatibile con formidable v3 (file è un array)
    const filePath = Array.isArray(uploadedFile)
      ? uploadedFile[0].filepath
      : uploadedFile.filepath;

    try {
      const metadata = await parseFile(filePath);

      // cancello il file temporaneo
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.warn("Errore nella cancellazione del file temporaneo:", unlinkErr);
        }
      });

      // restituisco solo le cose che ti servono davvero
      res.json({
        title: metadata.common.title || null,
        artist: metadata.common.artist || null,
        album: metadata.common.album || null,
        genre: metadata.common.genre || null,
        year: metadata.common.year || null,
        track: metadata.common.track || null,
        copyright: metadata.common.copyright || null,
        format: metadata.format
          ? {
              container: metadata.format.container,
              codec: metadata.format.codec,
              duration: metadata.format.duration,
              sampleRate: metadata.format.sampleRate,
              numberOfChannels: metadata.format.numberOfChannels,
            }
          : null,
      });
    } catch (e) {
      console.error("Metadata parse error:", e);
      res.status(500).json({ error: "Could not extract metadata" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
