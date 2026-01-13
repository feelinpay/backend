import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    createSMS,
    getPendingSMS,
    markSMSAsSent,
    sendPendingSMS,
    getSMSStatistics,
    getSMSStatus
} from '../controllers/smsController';

const router = Router();

router.use(authenticateToken);

router.post('/create', createSMS);
router.get('/pending', getPendingSMS);
router.patch('/:id/mark-sent', markSMSAsSent);
router.post('/send-pending', sendPendingSMS); // This is the one causing 404
router.get('/statistics/:propietarioId', getSMSStatistics);
router.get('/status/:id', getSMSStatus);

export default router;
