import express from 'express';
import { EmployeeAccessController } from '../controllers/employeeAccessController';

const router = express.Router();

// Estas rutas son públicas para empleados (no requieren autenticación JWT)
// Los empleados solo necesitan el ID del empleado para acceder

// Obtener enlace de Google Sheets para empleados (solo lectura)
router.get('/google-sheets/:propietarioId', 
  EmployeeAccessController.obtenerEnlaceGoogleSheets
);

// Verificar si un empleado puede recibir SMS
router.get('/sms/:empleadoId', 
  EmployeeAccessController.verificarAccesoSms
);

// Obtener información de pagos para empleados (solo lectura)
router.get('/pagos/:empleadoId', 
  EmployeeAccessController.obtenerInformacionPagos
);

// Obtener estadísticas básicas para empleados
router.get('/estadisticas/:empleadoId', 
  EmployeeAccessController.obtenerEstadisticasBasicas
);

// Obtener empleados que pueden recibir SMS (para propietarios)
router.get('/empleados-sms/:propietarioId', 
  EmployeeAccessController.obtenerEmpleadosParaSms
);

// Verificar acceso general de empleado
router.get('/verificar/:empleadoId', 
  EmployeeAccessController.verificarAccesoGeneral
);

export default router;
