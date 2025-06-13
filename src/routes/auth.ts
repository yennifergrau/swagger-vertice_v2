import { Router } from "express";
import { loginCtrl } from "../controllers/auth.controller";

const router = Router();

// POST /auth
router.post("/", (req, res, next) => {
  loginCtrl(req, res).catch(next);
});

export default router;