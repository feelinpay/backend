import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getPendingNotifications,
    processYapeNotification
} from '../controllers/notificationController';

const router = Router();

router.use(authenticateToken);

router.get('/pending', getPendingNotifications);
router.post('/process-yape', processYapeNotification);

export default router;
