import { Router } from 'express';
import { tasaBank, bankOptions, sypagoAuth, sypagoOtpRequest, sypagoOtpCode } from '../controllers/sypago.controller';

const router = Router();

router.post('/auth', sypagoAuth);
router.get('/bankOptions', bankOptions);
router.get('/tasa', tasaBank);
router.post('/otp', sypagoOtpRequest);
router.post('/otp/code', sypagoOtpCode);

export default router;
