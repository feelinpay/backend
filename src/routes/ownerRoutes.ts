import { Router } from 'express';
import { 
  getProfile,
  updateProfile,
  changePassword,
  verifyEmailChange,
  updateProfileName,
  updateProfilePhone,
  updateProfilePassword,
  requestEmailChange,
  confirmEmailChange
} from '../controllers/profileController';
import { getDashboardInfo } from '../controllers/dashboardController';
import dashboardEmployeeRoutes from './dashboardEmployeeRoutes';
// import membresiaRoutes from './membresiaRoutes'; // TODO: Implementar rutas de membresías para usuarios
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ========================================
// RUTAS DE PROPIETARIO (USUARIOS AUTENTICADOS)
// ========================================

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Perfil del usuario
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/profile/password', changePassword);
router.post('/profile/verify-email', verifyEmailChange);

// Gestión específica del perfil (rutas que usa el frontend)
router.put('/profile/profile/name', updateProfileName);
router.put('/profile/profile/phone', updateProfilePhone);
router.put('/profile/profile/password', updateProfilePassword);
router.post('/profile/profile/email/request', requestEmailChange);
router.post('/profile/profile/email/confirm', confirmEmailChange);

// Dashboard
router.get('/dashboard', getDashboardInfo);

// Gestión de empleados del dashboard
router.use('/employees', dashboardEmployeeRoutes);

// Gestión de membresías
// router.use('/membresias', membresiaRoutes); // TODO: Implementar rutas de membresías para usuarios

export default router;
