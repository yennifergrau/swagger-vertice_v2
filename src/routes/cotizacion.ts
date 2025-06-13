import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware"; // Ruta actualizada
import quotationController from '../controllers/quotation.controller';

const router = Router();

router.use(authenticateToken);

// quotation
router.post('/', (req, res, next) => {
  quotationController.quoteRCV(req, res).catch(next);
});

export default router;