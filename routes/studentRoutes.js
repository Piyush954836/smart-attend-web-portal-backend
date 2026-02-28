import express from 'express';
import { getMyStudents, bulkImportStudents } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get students (Accessible by Dept Heads, Mentors, and Staff)
router.get('/', protect, authorize('super_admin', 'dept_head', 'mentor', 'staff'), getMyStudents);

// 2. Bulk Import (Typically handled by Mentors or Dept Heads)
router.post('/bulk-import', protect, authorize('dept_head', 'mentor'), bulkImportStudents);

export default router;