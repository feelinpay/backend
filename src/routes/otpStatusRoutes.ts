import { Router } from 'express';
import { getOtpStatus, resetOtpAttempts } from '../controllers/otpStatusController';
import { sanitizeInputs } from '../middleware/sqlInjectionProtection';
import { detectHackingAttempts } from '../middleware/security';

const router = Router();

// Obtener estado de intentos OTP
router.get('/status/:email',
  detectHackingAttempts,
  sanitizeInputs,
  getOtpStatus
);

// Resetear intentos OTP (solo desarrollo)
router.post('/reset/:email',
  detectHackingAttempts,
  sanitizeInputs,
  resetOtpAttempts
);

export default router;
