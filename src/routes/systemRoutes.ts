import { Router } from 'express';
import { 
  checkSystemStatus,
  checkUserPermissions,
  checkConnectivity,
  getSystemInfo
} from '../controllers/systemController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Verificación del sistema
router.get('/status', checkSystemStatus);
router.get('/connectivity', checkConnectivity);
router.get('/permissions', checkUserPermissions);
router.get('/info', getSystemInfo);

export default router;
