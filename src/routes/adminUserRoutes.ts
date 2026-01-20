import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
    obtenerTodosUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    toggleUsuario,
    extenderPrueba,
    activarMembresia,
    desactivarMembresia,
    obtenerEstadisticasGenerales
} from '../controllers/adminController';

const router = Router();

// Aplicar autenticación y requerir rol de Super Admin
router.use(authenticateToken);
// Nota: requireRole('super_admin') debería usarse aquí o en cada ruta según la granularidad deseada
// Por ahora asumimos que authenticateToken y la lógica del controlador manejan parte de esto, 
// pero es mejor proteger las rutas explícitamente.

// ========================================
// GESTIÓN DE USUARIOS (SUPER ADMIN)
// ========================================

// Listar todos los usuarios/propietarios
router.get('/users', requireRole(['super_admin']), obtenerTodosUsuarios);

// Crear nuevo usuario
router.post('/users', requireRole(['super_admin']), crearUsuario);

// Actualizar usuario
router.put('/users/:id', requireRole(['super_admin']), actualizarUsuario);

// Eliminar usuario
router.delete('/users/:id', requireRole(['super_admin']), eliminarUsuario);

// Estadísticas generales para el dashboard
router.get('/stats', requireRole(['super_admin']), obtenerEstadisticasGenerales);
router.get('/estadisticas-generales', requireRole(['super_admin']), obtenerEstadisticasGenerales);

// Activar/Desactivar usuario
router.patch('/users/:id/toggle', requireRole(['super_admin']), toggleUsuario);

// Extender periodo de prueba
router.post('/users/:id/extend-trial', requireRole(['super_admin']), extenderPrueba);

// ========================================
// GESTIÓN DE MEMBRESÍAS (SUPER ADMIN)
// ========================================

// Activar membresía
router.post('/users/:usuarioId/membership/activate', requireRole(['super_admin']), activarMembresia);

// Desactivar membresía
// Desactivar membresía
router.post('/users/:usuarioId/membership/deactivate', requireRole(['super_admin']), desactivarMembresia);

export default router;
