import { Router } from 'express';
import { googleLogin, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ========================================
// RUTAS AUTENTICADAS (PREFIL)
// ========================================

// Autenticación Google (Pública)
router.post('/auth/google', googleLogin);

router.get('/auth/me', authenticateToken, getMe);
router.put('/auth/profile', authenticateToken, updateProfile);


// Token Management (para monitoreo y debugging en producción)
import { checkTokenStatus, forceRefreshToken } from '../controllers/tokenController';
router.get('/auth/token-status', authenticateToken, checkTokenStatus);
router.post('/auth/token-refresh', authenticateToken, forceRefreshToken);

// Health check
router.get('/health', (req, res) => {
  // console.log('✅ Health check hit!'); // Silenced for production noise reduction
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

export default router;
