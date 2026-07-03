import { analyzeIssueImage } from '../services/aiService.js';
import { APIError } from '../middleware/errorHandler.js';

/**
 * Endpoint to analyze an uploaded image using Gemini Vision AI
 */
export const analyzeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required for AI diagnostic scan.' });
    }

    const analysis = await analyzeIssueImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.status(200).json(analysis);
  } catch (err) {
    next(err);
  }
};
