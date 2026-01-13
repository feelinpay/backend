import { Request, Response } from 'express';
import { MembresiaUsuarioService } from '../services/membresiaUsuarioService';
import {
  createMembresiaUsuarioSchema,
  updateMembresiaUsuarioSchema,
  membresiaUsuarioParamsSchema,
  membresiaUsuarioQuerySchema
} from '../validators/membresiaUsuarioValidators';

// Crear nueva relación usuario-membresía
export const crearMembresiaUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;
    const validatedData = createMembresiaUsuarioSchema.parse({
      ...req.body,
      usuarioId
    });

    // Asegurar que las fechas estén definidas
    if (!validatedData.fechaInicio || !validatedData.fechaExpiracion) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y expiración son requeridas'
      });
    }

    const result = await MembresiaUsuarioService.crear({
      usuarioId,
      membresiaId: validatedData.membresiaId,
      fechaInicio: validatedData.fechaInicio,
      fechaExpiracion: validatedData.fechaExpiracion,
      activa: validatedData.activa
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todas las relaciones usuario-membresía
export const obtenerMembresiasUsuario = async (req: Request, res: Response) => {
  try {
    const { page, limit, activa, usuarioId, search } = membresiaUsuarioQuerySchema.parse(req.query);

    const result = await MembresiaUsuarioService.obtenerTodas(page, limit, activa, usuarioId, search);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener membresías de un usuario específico
export const obtenerMembresiasPorUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = membresiaUsuarioParamsSchema.parse(req.params);

    const result = await MembresiaUsuarioService.obtenerPorUsuario(usuarioId);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        errors: error.errors
      });
    }

    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener membresía activa de un usuario
export const obtenerMembresiaActivaPorUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = membresiaUsuarioParamsSchema.parse(req.params);

    const result = await MembresiaUsuarioService.obtenerActivaPorUsuario(usuarioId);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        errors: error.errors
      });
    }

    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar membresía de usuario
export const actualizarMembresiaUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaUsuarioParamsSchema.parse(req.params);
    const validatedData = updateMembresiaUsuarioSchema.parse(req.body);

    const result = await MembresiaUsuarioService.actualizar(id, validatedData);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar membresía de usuario
export const eliminarMembresiaUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaUsuarioParamsSchema.parse(req.params);

    const result = await MembresiaUsuarioService.eliminar(id);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
        errors: error.errors
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Verificar si usuario tiene membresía activa
export const verificarMembresiaActiva = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = membresiaUsuarioParamsSchema.parse(req.params);

    const result = await MembresiaUsuarioService.tieneMembresiaActiva(usuarioId);

    res.json({
      success: true,
      data: { tieneMembresiaActiva: result }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Extender membresía de usuario
export const extenderMembresiaUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaUsuarioParamsSchema.parse(req.params);
    const { diasAdicionales } = req.body;

    if (!diasAdicionales || diasAdicionales <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Días adicionales debe ser mayor a 0'
      });
    }

    const result = await MembresiaUsuarioService.extenderMembresia(id, diasAdicionales);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
        errors: error.errors
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Asignar o renovar membresía de forma inteligente
export const asignarORenovarMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId, membresiaId } = req.body;

    if (!usuarioId || !membresiaId) {
      return res.status(400).json({
        success: false,
        message: 'usuarioId y membresiaId son requeridos'
      });
    }

    const { MembresiaRenewalService } = await import('../services/membresiaRenewalService');
    const renewalService = new MembresiaRenewalService();

    const result = await renewalService.assignOrRenewMembership(usuarioId, membresiaId);

    res.json({
      success: true,
      message: 'Membresía asignada/renovada exitosamente',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener estado de membresía de un usuario
export const obtenerEstadoMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        message: 'usuarioId es requerido'
      });
    }

    const { MembresiaRenewalService } = await import('../services/membresiaRenewalService');
    const renewalService = new MembresiaRenewalService();

    const status = await renewalService.getMembershipStatus(usuarioId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
