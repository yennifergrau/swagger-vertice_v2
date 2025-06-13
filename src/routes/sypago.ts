import { Router } from 'express';
import { tasaBank, bankOptions, sypagoAuth } from '../controllers/sypago.controller';

const router = Router();

router.post('/auth', sypagoAuth);
router.get('/bankOptions', bankOptions);
router.get('/tasa', tasaBank);

export default router;
