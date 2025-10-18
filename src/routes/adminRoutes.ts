import express from 'express';
import {
  obtenerTodosUsuarios,
  toggleUsuario,
  verificarEmailUsuario,
  extenderPrueba,
  obtenerEstadisticasGenerales,
  activarLicencia,
  desactivarLicencia,
  verificarAcceso,
  obtenerEstadisticasLicencias
} from '../controllers/adminController';
import { authenticateToken, requireSuperAdmin, requireEmailVerified } from '../controllers/authController';

const router = express.Router();

// Todas las rutas requieren autenticación y ser Super Admin
router.use(authenticateToken);
router.use(requireSuperAdmin);
// Super Admin no necesita verificación de email, pero lo agregamos por consistencia
router.use(requireEmailVerified);

// Obtener todos los usuarios
router.get('/usuarios', obtenerTodosUsuarios);

// Activar/Desactivar usuario
router.put('/usuarios/:id/toggle', toggleUsuario);

// Verificar email de usuario
router.put('/usuarios/:id/verificar-email', verificarEmailUsuario);

// Extender período de prueba
router.put('/usuarios/:id/extender-prueba', extenderPrueba);

// Obtener estadísticas generales
router.get('/estadisticas', obtenerEstadisticasGenerales);

// Gestión de licencias
router.post('/usuarios/:usuarioId/activar-licencia', activarLicencia);
router.post('/usuarios/:usuarioId/desactivar-licencia', desactivarLicencia);
router.get('/usuarios/:usuarioId/verificar-acceso', verificarAcceso);
router.get('/estadisticas-licencias', obtenerEstadisticasLicencias);

export default router;
