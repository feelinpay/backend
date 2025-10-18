import { Router } from 'express';
import { getOtpStatus, resetOtpAttempts } from '../controllers/otpStatusController';

const router = Router();

// Obtener estado de intentos OTP
router.get('/status/:email', getOtpStatus);

// Resetear intentos OTP (solo desarrollo)
router.post('/reset/:email', resetOtpAttempts);

export default router;
