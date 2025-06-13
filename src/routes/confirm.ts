import { Router } from 'express';
import { confirmPolicy } from '../controllers/policy.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, confirmPolicy);

export default router;
