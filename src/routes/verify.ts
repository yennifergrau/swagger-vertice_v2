import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { verifyPlateCtrl } from "../controllers/verify.controller";

const router = Router();

router.use(authenticateToken);

router.post("/", (req, res, next) => {
  verifyPlateCtrl(req, res).catch(next);
});

export default router;
