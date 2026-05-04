import express from 'express';
import { 
  getMyStudents, 
  bulkImportStudents, 
  enrollStudent,
  updateFaceEmbedding,
  startAiEnrollment // Import the new AI-trigger function
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Student Records Management
router.get('/', protect, authorize('super_admin', 'dept_head', 'mentor', 'faculty', 'staff'), getMyStudents);

// 2. Enrollment Methods
router.post('/enroll', protect, authorize('dept_head', 'mentor', 'faculty'), enrollStudent);
router.post('/bulk-import', protect, authorize('dept_head', 'mentor'), bulkImportStudents);

// 3. --- NEW: AI Engine Integration Route ---
// This route triggers the Python AI Engine to start capturing 512-dim vectors
router.post('/start-ai-enrollment', protect, authorize('student'), startAiEnrollment);

// 4. Manual/Browser-based Updates (Fallback)
router.put('/update-face', protect, authorize('student'), updateFaceEmbedding);

export default router;