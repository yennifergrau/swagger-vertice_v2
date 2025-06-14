import { Router } from "express";
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { verifyCodeAndPay } from "../controllers/sypago.controller";

const router = Router();

router.post("/Code", authenticateSypagoToken,(req, res, next) => {
  verifyCodeAndPay(req, res).catch(next);
});

export default router;
