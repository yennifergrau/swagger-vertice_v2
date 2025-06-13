import { Router } from "express";
import { authenticateToken, authenticateSypagoToken } from "../middleware/auth.middleware";
import { verifyPlateCtrl, verifyCodeAndPay } from "../controllers/sypago.controller";

const router = Router();

router.use("/", authenticateToken);
router.post("/", (req, res, next) => {
  verifyPlateCtrl(req, res).catch(next);
});

router.post("/Code", authenticateSypagoToken, (req, res, next) => {
  verifyCodeAndPay(req, res).catch(next);
});

export default router;
