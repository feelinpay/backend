import express from 'express';
import { 
  getUnverifiedUsersStats, 
  getUnverifiedUsersList, 
  cleanupUnverifiedUsers 
} from '../controllers/userCleanupController';
import { authenticateToken, requireSuperAdmin } from '../controllers/authController';

const router = express.Router();

// Middleware de autenticación y autorización
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Obtener estadísticas de usuarios no verificados
router.get('/stats', getUnverifiedUsersStats);

// Obtener lista de usuarios no verificados
router.get('/list', getUnverifiedUsersList);

// Ejecutar limpieza manual
router.post('/cleanup', cleanupUnverifiedUsers);

export default router;
