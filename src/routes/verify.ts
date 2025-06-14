import { Router } from "express";
import { authenticateSypagoToken } from "../middleware/auth.middleware";
import { verifyPlateCtrl, verifyCodeAndPay } from "../controllers/sypago.controller";

const router = Router();


router.post("/", authenticateSypagoToken,(req, res, next) => {
  verifyCodeAndPay(req, res).catch(next);
});

export default router;
