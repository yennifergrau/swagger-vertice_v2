import { Router } from 'express';
import { bankOptions, tasaBank, sypagoOtpRequest } from '../controllers/sypago.controller';

const router = Router();

router.get('/bankOptions', bankOptions);
router.get('/tasa', tasaBank);
router.post('/otp/sypago', sypagoOtpRequest); // Agregar el endpoint OTP en la raíz

export default router;
