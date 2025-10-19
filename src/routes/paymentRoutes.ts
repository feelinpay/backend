import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  procesarPagoYape, 
  obtenerPagosUsuario, 
  obtenerEstadisticasPagos 
} from '../controllers/paymentController';

const router = Router();

// Aplicar middleware de autenticación para todas las rutas
router.use(authenticateToken);

// POST /api/payments/yape - Procesar pago recibido por Yape
router.post('/yape', procesarPagoYape);

// GET /api/payments/usuario/:usuarioId - Obtener pagos de un usuario
router.get('/usuario/:usuarioId', obtenerPagosUsuario);

// GET /api/payments/usuario/:usuarioId/estadisticas - Obtener estadísticas de pagos
router.get('/usuario/:usuarioId/estadisticas', obtenerEstadisticasPagos);

export default router;
