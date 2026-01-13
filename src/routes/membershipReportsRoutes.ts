import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import { getMembershipReports } from '../controllers/membershipReportsController';

const router = Router();

// Apply authentication and authorization middleware
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/super-admin/membership-reports - Get membership reports
router.get('/', getMembershipReports);

export default router;
