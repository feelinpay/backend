import { Router } from 'express';
import { 
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  reactivateUser,
  extenderPeriodoPrueba,
  changeUserPassword,
  toggleUserStatus,
  getUserStats,
  getAllRoles
} from '../controllers/userCrudController';
import {
  obtenerEstadisticasGenerales,
  verificarAcceso,
  extenderPrueba,
  verificarEmailUsuario
} from '../controllers/adminController';
import adminEmployeeRoutes from './adminEmployeeRoutes';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';

const router = Router();

// ========================================
// RUTAS DE SUPER ADMIN
// ========================================

// Todas las rutas requieren autenticación y rol de super_admin
router.use(authenticateToken);
router.use(requireSuperAdmin);

// CRUD de Usuarios
router.post('/users', createUser);           // CREATE
router.get('/users', getAllUsers);           // READ (todos)
router.get('/users/:id', getUserById);       // READ (por ID)
router.put('/users/:id', updateUser);        // UPDATE
router.delete('/users/:id', deleteUser);     // DESACTIVAR (soft delete)
router.patch('/users/:id/reactivate', reactivateUser); // REACTIVAR

// Gestión adicional de usuarios
router.patch('/users/:id/password', changeUserPassword);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/extender-prueba', extenderPeriodoPrueba);

// Estadísticas y roles
router.get('/stats', getUserStats);
router.get('/roles', getAllRoles);

// Funcionalidades avanzadas de admin
router.get('/estadisticas-generales', obtenerEstadisticasGenerales);
router.get('/verificar-acceso', verificarAcceso);

// Gestión avanzada de usuarios
router.put('/users/:id/extender-prueba', extenderPrueba);
router.put('/users/:id/verificar-email', verificarEmailUsuario);

// ========================================
// GESTIÓN DE EMPLEADOS PARA CUALQUIER USUARIO
// ========================================

// Usar las rutas específicas de empleados para Super Admin
router.use('/', adminEmployeeRoutes);

export default router;
