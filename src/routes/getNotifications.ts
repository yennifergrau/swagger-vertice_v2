import { Router } from 'express';
import { notificationSypago } from '../controllers/sypago.controller';

const router = Router();

router.post('/', notificationSypago);

export default router;
