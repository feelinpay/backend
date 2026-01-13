import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import {
  crearPermiso,
  obtenerPermisos,
  obtenerPermisoPorId,
  actualizarPermiso,
  eliminarPermiso,
  obtenerPermisoConRoles,
  obtenerPermisosPorModulo,

} from '../controllers/adminPermisoController';

const router = Router();

// Aplicar middleware de autenticación y autorización para todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Rutas para gestión de permisos (Solo Super Admin)

// GET /api/super-admin/permisos - Obtener todos los permisos
router.get('/', obtenerPermisos);

// GET /api/super-admin/permisos/:id - Obtener permiso por ID
router.get('/:id', obtenerPermisoPorId);

// GET /api/super-admin/permisos/:id/roles - Obtener permiso con roles
router.get('/:id/roles', obtenerPermisoConRoles);

// GET /api/super-admin/permisos/modulo/:modulo - Obtener permisos por módulo
router.get('/modulo/:modulo', obtenerPermisosPorModulo);

// GET /api/super-admin/permisos/accion/:accion - Obtener permisos por acción


// POST /api/super-admin/permisos - Crear nuevo permiso
router.post('/', crearPermiso);

// PUT /api/super-admin/permisos/:id - Actualizar permiso
router.put('/:id', actualizarPermiso);

// DELETE /api/super-admin/permisos/:id - Eliminar permiso
router.delete('/:id', eliminarPermiso);

export default router;
