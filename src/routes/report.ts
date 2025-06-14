import { Router } from 'express';
import { generateReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Cambiar a POST / (raíz del router) para que app.use('/report', ...) funcione como /report
router.post('/', authenticateToken, generateReport);

export default router;
