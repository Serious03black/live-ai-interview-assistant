import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

export const resumeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

resumeRouter.post('/parse', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded' });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ error: 'Only PDF format is supported' });
      return;
    }

    const data = await pdfParse(req.file.buffer);
    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    res.json({
      success: true,
      text: cleanedText,
      pageCount: data.numpages,
      info: data.info,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse resume PDF';
    res.status(500).json({ error: message });
  }
});
