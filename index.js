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
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Upload error", details: err.message });
    }

    // 1) Recupero file uploadato (può essere singolo o array)
    let uploadedFile = files.file;
    if (Array.isArray(uploadedFile)) {
      uploadedFile = uploadedFile[0];
    }

    if (!uploadedFile) {
      console.error("Nessun file ricevuto in 'files.file'");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 2) Gestisco sia 'filepath' (formidable v3) sia 'path' (versioni precedenti)
    const filePath =
      uploadedFile.filepath ||
      uploadedFile.path ||
      uploadedFile.tempFilePath;

    if (!filePath || !fs.existsSync(filePath)) {
      console.error("File path non trovato o inesistente:", uploadedFile);
      return res
        .status(500)
        .json({ error: "Uploaded file not found on server" });
    }

    try {
      // 3) Estraggo i metadata
      const metadata = await parseFile(filePath);

      const common = metadata.common || {};
      const format = metadata.format || {};

      const response = {
        title: common.title || null,
        artist: common.artist || null,
        album: common.album || null,
        genre: common.genre || null,
        copyright: common.copyright || null,
        track: common.track || null,
        disk: common.disk || null,
        format: {
          container: format.container || null,
          codec: format.codec || null,
          sampleRate: format.sampleRate || null,
          bitrate: format.bitrate || null,
          duration: format.duration || null,
        },
        // se vuoi meno dati, togli questa riga:
        raw: metadata,
      };

      return res.json(response);
    } catch (e) {
      console.error("Metadata parse error:", e);
      return res
        .status(500)
        .json({ error: "Could not extract metadata", details: e.message });
    } finally {
      // 4) Provo a cancellare il file temporaneo (non è grave se fallisce)
      try {
        fs.unlink(filePath, () => {});
      } catch (cleanupErr) {
        console.warn("Impossibile cancellare il file temporaneo:", cleanupErr);
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Metadata API listening on port ${PORT}`);
});
