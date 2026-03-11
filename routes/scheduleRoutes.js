import express from 'express';
import { 
  createScheduleSlot,
  uploadSchedule, 
  getMySchedule, 
  updateScheduleSlot, 
  deleteScheduleSlot 
} from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Single Manual Entry (Handles the 404 you were seeing)
router.post('/', protect, authorize('mentor', 'faculty'), createScheduleSlot);

// 2. Get the logged-in faculty's timetable
router.get('/my-schedule', protect, getMySchedule);

// 3. Bulk upload new slots
router.post('/upload', protect, authorize('mentor', 'faculty'), uploadSchedule);

// 4. Edit/Delete specific slots
router.put('/:id', protect, authorize('mentor', 'faculty'), updateScheduleSlot);
router.delete('/:id', protect, authorize('mentor', 'faculty'), deleteScheduleSlot);

export default router;