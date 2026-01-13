import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import {
  crearMembresiaUsuario,
  obtenerMembresiasUsuario,
  obtenerMembresiasPorUsuario,
  obtenerMembresiaActivaPorUsuario,
  actualizarMembresiaUsuario,
  eliminarMembresiaUsuario,
  verificarMembresiaActiva,
  extenderMembresiaUsuario,
  asignarORenovarMembresia,
  obtenerEstadoMembresia
} from '../controllers/adminMembresiaUsuarioController';

const router = Router();

// Aplicar middleware de autenticación y autorización para todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Rutas para gestión de membresías de usuarios (Solo Super Admin)
// Estas rutas están integradas en el módulo de usuarios

// GET /api/super-admin/usuarios/membresias - Obtener todas las relaciones usuario-membresía
router.get('/membresias', obtenerMembresiasUsuario);

// GET /api/super-admin/usuarios/:usuarioId/membresias - Obtener membresías de un usuario
router.get('/:usuarioId/membresias', obtenerMembresiasPorUsuario);

// GET /api/super-admin/usuarios/:usuarioId/membresias/activa - Obtener membresía activa de un usuario
router.get('/:usuarioId/membresias/activa', obtenerMembresiaActivaPorUsuario);

// GET /api/super-admin/usuarios/:usuarioId/membresias/verificar - Verificar si usuario tiene membresía activa
router.get('/:usuarioId/membresias/verificar', verificarMembresiaActiva);

// POST /api/super-admin/usuarios/:usuarioId/membresias - Crear nueva relación usuario-membresía
router.post('/:usuarioId/membresias', crearMembresiaUsuario);

// PUT /api/super-admin/usuarios/membresias/:id - Actualizar membresía de usuario
router.put('/membresias/:id', actualizarMembresiaUsuario);

// PATCH /api/super-admin/usuarios/membresias/:id/extender - Extender membresía de usuario
router.patch('/membresias/:id/extender', extenderMembresiaUsuario);

// DELETE /api/super-admin/usuarios/membresias/:id - Eliminar membresía de usuario
router.delete('/membresias/:id', eliminarMembresiaUsuario);

// POST /api/super-admin/usuarios/membresias/assign - Asignar o renovar membresía (smart)
router.post('/membresias/assign', asignarORenovarMembresia);

// GET /api/super-admin/usuarios/:usuarioId/membresias/status - Obtener estado de membresía
router.get('/:usuarioId/membresias/status', obtenerEstadoMembresia);

export default router;
