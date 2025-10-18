import { Request, Response } from 'express';
import { MembresiaService } from '../services/membresiaService';
import { z } from 'zod';

// Esquemas de validación
const asignarMembresiaSchema = z.object({
  usuarioId: z.string().uuid('ID de usuario inválido'),
  tipo: z.enum(['basica', 'premium', 'empresarial']),
  precio: z.number().positive('Precio debe ser positivo')
});

// Obtener tipos de membresía disponibles
export const obtenerTiposMembresia = async (req: Request, res: Response) => {
  try {
    const tiposMembresia = MembresiaService.obtenerTiposMembresia();
    
    res.json({
      success: true,
      data: tiposMembresia
    });
  } catch (error) {
    console.error('Error obteniendo tipos de membresía:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar membresía a usuario (Solo Super Admin)
export const asignarMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId, tipo, precio } = asignarMembresiaSchema.parse(req.body);
    
    const membresia = await MembresiaService.asignarMembresia(usuarioId, tipo, precio);
    
    res.status(201).json({
      success: true,
      message: 'Membresía asignada exitosamente',
      data: membresia
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.issues
      });
    }
    
    console.error('Error asignando membresía:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener membresía activa del usuario
export const obtenerMembresiaActiva = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user.id;
    
    const membresia = await MembresiaService.obtenerMembresiaActiva(usuarioId);
    
    if (!membresia) {
      return res.json({
        success: true,
        data: null,
        message: 'No tienes membresía activa'
      });
    }
    
    res.json({
      success: true,
      data: membresia
    });
  } catch (error) {
    console.error('Error obteniendo membresía activa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar acceso del usuario
export const verificarAcceso = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user.id;
    
    const acceso = await MembresiaService.verificarAcceso(usuarioId);
    
    res.json({
      success: true,
      data: acceso
    });
  } catch (error) {
    console.error('Error verificando acceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar días restantes (tarea programada)
export const actualizarDiasRestantes = async (req: Request, res: Response) => {
  try {
    const resultado = await MembresiaService.actualizarDiasRestantes();
    
    res.json({
      success: true,
      message: 'Días restantes actualizados',
      data: resultado
    });
  } catch (error) {
    console.error('Error actualizando días restantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de membresías (Solo Super Admin)
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const estadisticas = await MembresiaService.obtenerEstadisticas();
    
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};