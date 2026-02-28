import express from 'express';
import { createSubUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Admins, Dept Heads, and Mentors can reach this
router.post('/create-sub-user', protect, authorize('super_admin', 'dept_head', 'mentor'), createSubUser);

export default router;