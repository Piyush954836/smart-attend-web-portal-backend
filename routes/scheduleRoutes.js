import express from 'express';
import { 
  uploadSchedule, 
  getMySchedule, 
  updateScheduleSlot, 
  deleteScheduleSlot 
} from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get the logged-in faculty's timetable
router.get('/my-schedule', protect, getMySchedule);

// Bulk upload new slots (Faculty/Mentors only)
router.post('/upload', protect, authorize('mentor', 'faculty'), uploadSchedule);

// Edit a specific slot by ID (Faculty/Mentors only)
router.put('/:id', protect, authorize('mentor', 'faculty'), updateScheduleSlot);

// Delete a specific slot by ID (Faculty/Mentors only)
router.delete('/:id', protect, authorize('mentor', 'faculty'), deleteScheduleSlot);

export default router;