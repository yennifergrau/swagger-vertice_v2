import { Router } from 'express';
import { authorizePolicy } from '../controllers/policy.controller';

const router = Router();

// El endpoint debe ser POST /authorize
router.post('/', authorizePolicy);

export default router;
