import { Router } from 'express';
import { tasaBank, bankOptions, sypagoAuth, sypagoOtpRequest } from '../controllers/sypago.controller';

const router = Router();

router.post('/auth', sypagoAuth);
router.get('/bankOptions', bankOptions);
router.get('/tasa', tasaBank);
router.post('/otp/sypago', sypagoOtpRequest);

export default router;
