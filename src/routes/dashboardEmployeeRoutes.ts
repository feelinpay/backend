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
import {
  getMyConfiguracionNotificacion,
  createMyConfiguracionNotificacion,
  updateMyConfiguracionNotificacion,
  deleteMyConfiguracionNotificacion
} from '../controllers/dashboardNotificationController';
import {
  getMyHorariosLaborales,
  createMyHorarioLaboral,
  updateMyHorarioLaboral,
  deleteMyHorarioLaboral
} from '../controllers/dashboardScheduleController';
import {
  getMyBreaksLaborales,
  createMyBreakLaboral,
  updateMyBreakLaboral,
  deleteMyBreakLaboral
} from '../controllers/dashboardBreakController';

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

// ========================================
// RUTAS PARA CONFIGURACIÓN DE NOTIFICACIONES
// ========================================
router.get('/:employeeId/configuracion-notificacion', getMyConfiguracionNotificacion);
router.post('/:employeeId/configuracion-notificacion', createMyConfiguracionNotificacion);
router.put('/:employeeId/configuracion-notificacion', updateMyConfiguracionNotificacion);
router.delete('/:employeeId/configuracion-notificacion', deleteMyConfiguracionNotificacion);

// ========================================
// RUTAS PARA HORARIOS LABORALES
// ========================================
router.get('/:employeeId/horarios-laborales', getMyHorariosLaborales);
router.post('/:employeeId/horarios-laborales', createMyHorarioLaboral);
router.put('/:employeeId/horarios-laborales/:horarioId', updateMyHorarioLaboral);
router.delete('/:employeeId/horarios-laborales/:horarioId', deleteMyHorarioLaboral);

// ========================================
// RUTAS PARA BREAKS LABORALES
// ========================================
router.get('/:employeeId/breaks-laborales', getMyBreaksLaborales);
router.post('/:employeeId/breaks-laborales', createMyBreakLaboral);
router.put('/:employeeId/breaks-laborales/:breakId', updateMyBreakLaboral);
router.delete('/:employeeId/breaks-laborales/:breakId', deleteMyBreakLaboral);

export default router;
