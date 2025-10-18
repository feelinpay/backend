import { Router } from 'express';
import { 
  register, 
  login, 
  verifyOTP, 
  resendOTP, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  logout,
  authenticateToken,
  requireEmailVerified
} from '../controllers/authController';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

// Ruta para verificar si el usuario necesita verificación
router.get('/verification-status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      emailVerificado: req.user.emailVerificado,
      requiresVerification: !req.user.emailVerificado
    }
  });
});

export default router;