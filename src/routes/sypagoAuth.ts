import { Router } from 'express';
import { sypagoAuth } from '../controllers/sypago.controller';

const router = Router();

router.post('/auth', sypagoAuth);

export default router;