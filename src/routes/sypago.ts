import { Router } from 'express';
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { sypagoAuth } from '../controllers/sypago.controller';

const router = Router();

router.post('/auth', authenticateSypagoToken, sypagoAuth);

export default router;