import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  procesarPagoYape
} from '../controllers/paymentController';

const router = Router();

// Aplicar middleware de autenticación para todas las rutas
router.use(authenticateToken);

// POST /api/payments/yape - Procesar pago recibido por Yape
router.post('/yape', procesarPagoYape);



export default router;
