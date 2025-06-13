import { Router } from 'express';
import { confirmPolicy } from '../controllers/policy.controller';

const router = Router();

router.post('/', confirmPolicy);

export default router;
