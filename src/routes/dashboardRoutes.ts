import express from 'express';
import { getDashboardInfo, getLicenseStatus } from '../controllers/dashboardController';
import { authenticateToken, requireEmailVerified } from '../controllers/authController';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);
router.use(requireEmailVerified);

// Obtener información del dashboard
router.get('/', getDashboardInfo);

// Obtener estado de licencia
router.get('/license-status', getLicenseStatus);

export default router;
