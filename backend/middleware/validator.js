import { validationResult } from 'express-validator';

/**
 * Validates request bodies against express-validator rules and returns 400 on error
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(e => ({ field: e.path, message: e.msg })) 
    });
  }
  next();
};
