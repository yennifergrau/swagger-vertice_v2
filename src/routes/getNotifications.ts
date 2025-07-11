import { Router } from 'express';
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { notificationSypago } from '../controllers/sypago.controller';

const router = Router();

router.post('/', authenticateSypagoToken, notificationSypago);

export default router;
