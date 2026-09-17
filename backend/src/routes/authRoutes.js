import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  getProfileStats,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected profile & user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.get('/stats', protect, getProfileStats);

export default router;
