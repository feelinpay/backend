import express from 'express';
import {
  obtenerTiposMembresia,
  asignarMembresia,
  obtenerMembresiaActiva,
  verificarAcceso,
  actualizarDiasRestantes,
  obtenerEstadisticas
} from '../controllers/membresiaController';
import { authenticateToken } from '../middleware/auth';
// import { requireSuperAdmin } from '../middleware/authorization';

const router = express.Router();

// Rutas públicas
router.get('/tipos', obtenerTiposMembresia);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para usuarios autenticados
router.get('/activa', obtenerMembresiaActiva);
router.get('/verificar-acceso', verificarAcceso);

// Rutas solo para Super Admin (temporarily without requireSuperAdmin)
router.post('/asignar', asignarMembresia);
router.get('/estadisticas', obtenerEstadisticas);
router.post('/actualizar-dias', actualizarDiasRestantes);

export default router;
