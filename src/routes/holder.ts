import { Router } from 'express';
import { getUsersReport } from '../controllers/holder.controller';

const router = Router();

// Endpoint para obtener reporte anidado de policy holders y sus datos relacionados
router.get('/report', getUsersReport);

export default router;
