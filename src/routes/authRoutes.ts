import { Router } from 'express';
import { 
  register, 
  login, 
  verifyOTP, 
  verifyLoginOTP,
  verifyRegistrationOTP,
  resendOTP, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  logout
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint de prueba simple
router.post('/test', (req, res) => {
  console.log('🔍 [TEST ENDPOINT] ===== TEST ENDPOINT CALLED =====');
  console.log('🔍 [TEST ENDPOINT] Method:', req.method);
  console.log('🔍 [TEST ENDPOINT] URL:', req.url);
  console.log('🔍 [TEST ENDPOINT] Body:', req.body);
  res.json({
    success: true,
    message: 'Test endpoint funcionando',
    data: req.body
  });
});

// Endpoint de salud
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

export default router;