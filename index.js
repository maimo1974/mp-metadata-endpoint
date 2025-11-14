import http from "http";
import { parseFile } from "music-metadata";
import { IncomingForm } from "formidable";
import fs from "fs";

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/metadata") {
    const form = new IncomingForm({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: "Upload error" }));
      }

      const file = files.file;

      if (!file) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "File missing" }));
      }

      try {
        const metadata = await parseFile(file.filepath);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(metadata));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Metadata parsing failed" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Porta per Replit
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
