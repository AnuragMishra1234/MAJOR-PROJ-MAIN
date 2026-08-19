import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — JWT Authentication Middleware.
 *
 * Expects Bearer token in Authorization header:
 *   Authorization: Bearer <token>
 *
 * On success: attaches req.user (without password field)
 * On failure: returns 401 JSON error
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user not found.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token.',
    });
  }
};
