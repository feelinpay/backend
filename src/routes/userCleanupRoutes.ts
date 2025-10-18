import express from 'express';
import { 
  getUnverifiedUsersStats, 
  getUnverifiedUsersList, 
  cleanupUnverifiedUsers 
} from '../controllers/userCleanupController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticación
router.use(authenticateToken);

// Obtener estadísticas de usuarios no verificados
router.get('/stats', getUnverifiedUsersStats);

// Obtener lista de usuarios no verificados
router.get('/list', getUnverifiedUsersList);

// Ejecutar limpieza manual
router.post('/cleanup', cleanupUnverifiedUsers);

export default router;
