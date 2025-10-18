import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  deactivateUser, 
  getUserStats,
  changeUserPassword,
  changeUserEmail,
  getAllRoles
} from '../controllers/userManagementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Gestión de usuarios
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.get('/roles', getAllRoles);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/password', changeUserPassword);
router.patch('/:id/email', changeUserEmail);
router.delete('/:id', deactivateUser);

export default router;