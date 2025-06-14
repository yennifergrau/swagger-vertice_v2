import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { verifyPlateCtrl, verifyCodeAndPay } from "../controllers/sypago.controller";

const router = Router();


router.post("/", authenticateToken,(req, res, next) => {
  verifyPlateCtrl(req, res).catch(next);
});

export default router;
