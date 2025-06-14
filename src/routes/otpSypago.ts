import { Router } from 'express';
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { sypagoOtpRequest } from '../controllers/sypago.controller';

const router = Router();

router.post('/sypago', authenticateSypagoToken, sypagoOtpRequest);

export default router;
