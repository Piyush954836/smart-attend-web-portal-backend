import express from 'express';
import { 
  getMyStudents, 
  bulkImportStudents, 
  enrollStudent 
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get students (Accessible by all roles; RLS filters the data based on user scope)
router.get('/', protect, authorize('super_admin', 'dept_head', 'mentor', 'faculty', 'staff'), getMyStudents);

// 2. Single Student Enrollment (Handled by Dept Heads, Mentors, or Faculty)
router.post('/enroll', protect, authorize('dept_head', 'mentor', 'faculty'), enrollStudent);

// 3. Bulk Import (Typically handled by Mentors or Dept Heads for large batches)
router.post('/bulk-import', protect, authorize('dept_head', 'mentor'), bulkImportStudents);

export default router;