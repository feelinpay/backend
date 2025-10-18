import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  verifyEmailChange, 
  changePassword, 
  getLicenseInfo 
} from '../controllers/profileController';
import { authenticateToken, requireEmailVerified } from '../controllers/authController';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Obtener perfil del usuario
router.get('/', getProfile);

// Actualizar perfil del usuario
router.put('/', updateProfile);

// Verificar cambio de email con OTP
router.post('/verify-email-change', verifyEmailChange);

// Cambiar contraseña
router.put('/change-password', changePassword);

// Obtener información de licencia
router.get('/license-info', getLicenseInfo);

export default router;
