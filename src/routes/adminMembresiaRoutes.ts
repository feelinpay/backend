import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superAdminAuth';
import {
  crearMembresia,
  obtenerMembresias,
  obtenerMembresiaPorId,
  actualizarMembresia,
  eliminarMembresia,
  obtenerMembresiasActivas
} from '../controllers/adminMembresiaController';

const router = Router();

// Aplicar middleware de autenticación y autorización para todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Rutas para gestión de membresías (Solo Super Admin)

// GET /api/super-admin/membresias - Obtener todas las membresías con paginación y filtros
router.get('/', obtenerMembresias);

// GET /api/super-admin/membresias/activas - Obtener membresías activas (para dropdowns)
router.get('/activas', obtenerMembresiasActivas);

// GET /api/super-admin/membresias/:id - Obtener membresía por ID
router.get('/:id', obtenerMembresiaPorId);

// POST /api/super-admin/membresias - Crear nueva membresía
router.post('/', crearMembresia);

// PUT /api/super-admin/membresias/:id - Actualizar membresía
router.put('/:id', actualizarMembresia);

// DELETE /api/super-admin/membresias/:id - Eliminar membresía (soft delete)
router.delete('/:id', eliminarMembresia);

export default router;
