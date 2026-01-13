import { Request, Response } from 'express';
import { PermisoService } from '../services/permisoService';
import {
  createPermisoSchema,
  updatePermisoSchema,
  permisoParamsSchema,
  permisoQuerySchema
} from '../validators/permisoValidators';

// Crear nuevo permiso
export const crearPermiso = async (req: Request, res: Response) => {
  try {
    const validatedData = createPermisoSchema.parse(req.body) as any;

    const result = await PermisoService.crear(validatedData);

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

// Obtener todos los permisos
export const obtenerPermisos = async (req: Request, res: Response) => {
  try {
    const { page, limit, activo, search, modulo } = permisoQuerySchema.parse(req.query);

    const result = await PermisoService.obtenerTodos(page, limit, activo, search, modulo);

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

// Obtener permiso por ID
export const obtenerPermisoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = permisoParamsSchema.parse(req.params);

    const result = await PermisoService.obtenerPorId(id);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
        errors: error.errors
      });
    }

    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar permiso
export const actualizarPermiso = async (req: Request, res: Response) => {
  try {
    const { id } = permisoParamsSchema.parse(req.params);
    const validatedData = updatePermisoSchema.parse(req.body) as any;

    const result = await PermisoService.actualizar(id, validatedData);

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

// Eliminar permiso
export const eliminarPermiso = async (req: Request, res: Response) => {
  try {
    const { id } = permisoParamsSchema.parse(req.params);

    const result = await PermisoService.eliminar(id);

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

// Obtener permiso con roles
export const obtenerPermisoConRoles = async (req: Request, res: Response) => {
  try {
    const { id } = permisoParamsSchema.parse(req.params);

    const result = await PermisoService.obtenerConRoles(id);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
        errors: error.errors
      });
    }

    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener permisos por módulo
export const obtenerPermisosPorModulo = async (req: Request, res: Response) => {
  try {
    const { modulo } = req.params;

    const result = await PermisoService.obtenerPorModulo(modulo);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


