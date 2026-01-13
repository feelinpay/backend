import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMyEmployees,
  getMyEmployee,
  createMyEmployee,
  updateMyEmployee,
  deleteMyEmployee,
  searchMyEmployees,
  getMyEmployeesWithFilters,
  getMyEmployeeStats
} from '../controllers/dashboardEmployeeController';

import {
  getMyHorariosLaborales,
  createMyHorarioLaboral,
  updateMyHorarioLaboral,
  deleteMyHorarioLaboral
} from '../controllers/dashboardScheduleController';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ========================================
// RUTAS PARA GESTIÓN DE EMPLEADOS DEL DASHBOARD
// (Usuario logueado gestiona sus propios empleados)
// ========================================

// CRUD básico de empleados del usuario autenticado
router.get('/employees', getMyEmployees); // Listar mis empleados
router.get('/employees/stats', getMyEmployeeStats); // Estadísticas de mis empleados
router.get('/employees/search', searchMyEmployees); // Buscar mis empleados
router.get('/employees/filter', getMyEmployeesWithFilters); // Filtrar mis empleados
router.get('/employees/:employeeId', getMyEmployee); // Obtener mi empleado específico
router.post('/employees', createMyEmployee); // Crear mi empleado
router.put('/employees/:employeeId', updateMyEmployee); // Actualizar mi empleado (incluye cambio de estado)
router.delete('/employees/:employeeId', deleteMyEmployee); // Eliminar mi empleado

// ========================================
// RUTAS PARA HORARIOS LABORALES
// ========================================
router.get('/employees/:employeeId/horarios-laborales', getMyHorariosLaborales);
router.post('/employees/:employeeId/horarios-laborales', createMyHorarioLaboral);
router.put('/employees/:employeeId/horarios-laborales/:horarioId', updateMyHorarioLaboral);
router.delete('/employees/:employeeId/horarios-laborales/:horarioId', deleteMyHorarioLaboral);

export default router;
