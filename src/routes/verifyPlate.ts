import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { verifyPlateCtrl } from "../controllers/plate.controller";

const router = Router();

// Endpoint para verificar la placa
router.post("/", authenticateToken,(req, res, next) => {
  verifyPlateCtrl(req, res).catch(next);
});

export default router;
