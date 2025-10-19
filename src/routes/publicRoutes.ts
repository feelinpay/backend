import { Router } from 'express';
import { 
  login,
  register,
  verifyOTP,
  verifyRegistrationOTP,
  verifyLoginOTP,
  resendOTP,
  forgotPassword,
  resetPassword
} from '../controllers/authController';

const router = Router();

// ========================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ========================================

// Autenticación
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/verify-registration-otp', verifyRegistrationOTP);
router.post('/auth/verify-login-otp', verifyLoginOTP);
router.post('/auth/resend-otp', resendOTP);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
