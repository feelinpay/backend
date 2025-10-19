import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import {
  crearRol,
  obtenerRoles,
  obtenerRolPorId,
  actualizarRol,
  eliminarRol,
  obtenerRolConPermisos,
  asignarPermiso,
  desasignarPermiso,
  obtenerPermisosDelRol
} from '../controllers/adminRolController';

const router = Router();

// Aplicar middleware de autenticación y autorización para todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Rutas para gestión de roles (Solo Super Admin)

// GET /api/super-admin/roles - Obtener todos los roles
router.get('/', obtenerRoles);

// GET /api/super-admin/roles/:id - Obtener rol por ID
router.get('/:id', obtenerRolPorId);

// GET /api/super-admin/roles/:id/permisos - Obtener rol con permisos
router.get('/:id/permisos', obtenerRolConPermisos);

// GET /api/super-admin/roles/:id/permisos-lista - Obtener lista de permisos del rol
router.get('/:id/permisos-lista', obtenerPermisosDelRol);

// POST /api/super-admin/roles - Crear nuevo rol
router.post('/', crearRol);

// PUT /api/super-admin/roles/:id - Actualizar rol
router.put('/:id', actualizarRol);

// DELETE /api/super-admin/roles/:id - Eliminar rol
router.delete('/:id', eliminarRol);

// POST /api/super-admin/roles/:id/permisos - Asignar permiso a rol
router.post('/:id/permisos', asignarPermiso);

// DELETE /api/super-admin/roles/:id/permisos - Desasignar permiso de rol
router.delete('/:id/permisos', desasignarPermiso);

export default router;
