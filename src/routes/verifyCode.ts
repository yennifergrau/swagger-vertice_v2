import { Router } from "express";
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { verifyCodeAndPay } from "../controllers/sypago.controller";

const router = Router();

// Endpoint to verify code and process payment
router.post("/Code", authenticateSypagoToken,(req, res, next) => {
  verifyCodeAndPay(req, res).catch(next);
});

export default router;
