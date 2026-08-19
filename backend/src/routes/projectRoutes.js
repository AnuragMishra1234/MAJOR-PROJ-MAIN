import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  saveAIOutput,
  saveExecutionResult,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All project routes require authentication
router.use(protect);

// Standard CRUD
router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// Integration endpoints — Person 3 (AI) and Person 4 (Execution)
router.post('/:id/ai-output', saveAIOutput);
router.post('/:id/execution-result', saveExecutionResult);

export default router;
