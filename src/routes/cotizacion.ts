// src/routes/cotizacion.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware"; // Asumo que este middleware existe
import quotationController from '../controllers/quotation.controller'; // Importa el controlador

const router = Router();

// Aplica el middleware de autenticación a todas las rutas definidas en este router
router.use(authenticateToken);

// Define el endpoint POST /cotizacion (ya que el router.post('/') significa /cotizacion porque se monta en /cotizacion en app.ts)
router.post('/', (req, res, next) => {
  quotationController.quoteRCV(req, res).catch(next);
});

export default router;