import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  searchEmployees,
  getEmployeesWithFilters,
  getEmployeeStats
} from '../controllers/employeeController';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas básicas CRUD
router.get('/', getEmployees); // GET /api/employees - Obtener todos los empleados del usuario
router.get('/stats', getEmployeeStats); // GET /api/employees/stats - Obtener estadísticas
router.get('/search', searchEmployees); // GET /api/employees/search - Buscar empleados
router.get('/filter', getEmployeesWithFilters); // GET /api/employees/filter - Obtener empleados con filtros
router.get('/:id', getEmployeeById); // GET /api/employees/:id - Obtener empleado por ID
router.post('/', createEmployee); // POST /api/employees - Crear nuevo empleado
router.put('/:id', updateEmployee); // PUT /api/employees/:id - Actualizar empleado
router.patch('/:id/status', toggleEmployeeStatus); // PATCH /api/employees/:id/status - Cambiar estado
router.delete('/:id', deleteEmployee); // DELETE /api/employees/:id - Eliminar empleado

export default router;
