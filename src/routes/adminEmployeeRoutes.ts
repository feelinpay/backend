import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import {
    getEmployeesByUser,
    getEmployeeByUser,
    createEmployeeForUser,
    updateEmployeeByUser,
    deleteEmployeeByUser,
    searchEmployeesByUser,
    getEmployeeStatsByUser
} from '../controllers/adminEmployeeController';

import {
    getHorariosLaborales,
    updateHorarioLaboral
} from '../controllers/adminScheduleController';

const router = Router();

// Aplicar autenticación y autorización de Super Admin a todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ========================================
// RUTAS PARA GESTIÓN DE EMPLEADOS DE USUARIOS
// (Super Admin puede gestionar empleados de cualquier usuario)
// ========================================

// CRUD básico de empleados para un usuario específico
router.get('/users/:userId/employees', getEmployeesByUser); // Listar empleados del usuario
router.get('/users/:userId/employees/stats', getEmployeeStatsByUser); // Estadísticas del usuario
router.get('/users/:userId/employees/search', searchEmployeesByUser); // Buscar empleados del usuario
router.get('/users/:userId/employees/:employeeId', getEmployeeByUser); // Obtener empleado específico
router.post('/users/:userId/employees', createEmployeeForUser); // Crear empleado para el usuario
router.put('/users/:userId/employees/:employeeId', updateEmployeeByUser); // Actualizar empleado del usuario (incluye cambio de estado)
router.delete('/users/:userId/employees/:employeeId', deleteEmployeeByUser); // Eliminar empleado del usuario

// ========================================
// RUTAS PARA HORARIOS LABORALES (JSON)
// ========================================
router.get('/users/:userId/employees/:employeeId/horarios-laborales', getHorariosLaborales);
router.put('/users/:userId/employees/:employeeId/horarios-laborales', updateHorarioLaboral);
// create y delete se manejan dentro del PUT del horario completo

export default router;
