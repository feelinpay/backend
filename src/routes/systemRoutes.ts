import { Router } from 'express';
import { 
  checkSystemStatus,
  checkUserPermissions,
  checkConnectivity,
  getSystemInfo
} from '../controllers/systemController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint de salud (sin autenticación) - debe ir ANTES del middleware
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Todas las demás rutas requieren autenticación
router.use(authenticateToken);

// Verificación del sistema
router.get('/status', checkSystemStatus);
router.get('/connectivity', checkConnectivity);
router.get('/permissions', checkUserPermissions);
router.get('/info', getSystemInfo);

export default router;
