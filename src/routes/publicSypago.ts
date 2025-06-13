import { Router } from 'express';
import { bankOptions, tasaBank } from '../controllers/sypago.controller';

const router = Router();

router.get('/bankOptions', bankOptions);
router.get('/tasa', tasaBank);

export default router;
