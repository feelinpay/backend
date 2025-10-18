import express from 'express';
import { getDashboardInfo, getLicenseStatus } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Obtener información del dashboard
router.get('/', getDashboardInfo);

// Obtener estado de licencia
router.get('/license-status', getLicenseStatus);

export default router;
