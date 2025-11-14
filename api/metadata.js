import { parseFile } from 'music-metadata';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Upload error' });
    }

    try {
      const file = files.file;
      const metadata = await parseFile(file.filepath);

      return res.status(200).json({
        title: metadata.common.title || '',
        artist: metadata.common.artist || '',
        album: metadata.common.album || '',
        genre: metadata.common.genre ? metadata.common.genre[0] : '',
        copyright: metadata.common.copyright || '',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Metadata parsing error' });
    }
  });
}
