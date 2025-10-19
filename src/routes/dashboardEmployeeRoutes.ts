import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMyEmployees,
  getMyEmployee,
  createMyEmployee,
  updateMyEmployee,
  toggleMyEmployeeStatus,
  deleteMyEmployee,
  searchMyEmployees,
  getMyEmployeesWithFilters,
  getMyEmployeeStats
} from '../controllers/dashboardEmployeeController';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ========================================
// RUTAS PARA GESTIÓN DE EMPLEADOS DEL DASHBOARD
// (Usuario logueado gestiona sus propios empleados)
// ========================================

// CRUD básico de empleados del usuario autenticado
router.get('/', getMyEmployees); // Listar mis empleados
router.get('/stats', getMyEmployeeStats); // Estadísticas de mis empleados
router.get('/search', searchMyEmployees); // Buscar mis empleados
router.get('/filter', getMyEmployeesWithFilters); // Filtrar mis empleados
router.get('/:employeeId', getMyEmployee); // Obtener mi empleado específico
router.post('/', createMyEmployee); // Crear mi empleado
router.put('/:employeeId', updateMyEmployee); // Actualizar mi empleado
router.patch('/:employeeId/status', toggleMyEmployeeStatus); // Cambiar estado de mi empleado
router.delete('/:employeeId', deleteMyEmployee); // Eliminar mi empleado

export default router;
