import { Router } from 'express';
import { authorizePolicy } from '../controllers/policy.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// El endpoint debe ser POST /authorize
router.post('/', authenticateToken, authorizePolicy);

export default router;
