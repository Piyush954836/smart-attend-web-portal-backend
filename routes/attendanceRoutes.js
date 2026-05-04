import express from 'express';
import { startAttendanceSession, verifyDynamicQR } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start-session', protect, authorize('faculty', 'mentor'), startAttendanceSession);
router.post('/verify', protect, verifyDynamicQR); // Students call this

export default router;