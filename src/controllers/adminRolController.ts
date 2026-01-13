import { Request, Response } from 'express';
import { RolService } from '../services/rolService';
import {
  createRolSchema,
  updateRolSchema,
  rolParamsSchema,
  rolQuerySchema,
  asignarPermisoSchema,
  desasignarPermisoSchema
} from '../validators/rolValidators';

// Crear nuevo rol
export const crearRol = async (req: Request, res: Response) => {
  try {
    const validatedData = createRolSchema.parse(req.body) as any;

    const result = await RolService.crear(validatedData);

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

// Obtener todos los roles
export const obtenerRoles = async (req: Request, res: Response) => {
  try {
    const { page, limit, activo, search } = rolQuerySchema.parse(req.query);

    const result = await RolService.obtenerTodos(page, limit, activo, search);

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

// Obtener rol por ID
export const obtenerRolPorId = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);

    const result = await RolService.obtenerPorId(id);

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

// Actualizar rol
export const actualizarRol = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);
    const validatedData = updateRolSchema.parse(req.body) as any;

    const result = await RolService.actualizar(id, validatedData);

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

// Eliminar rol
export const eliminarRol = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);

    const result = await RolService.eliminar(id);

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

// Obtener rol con permisos
export const obtenerRolConPermisos = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);

    const result = await RolService.obtenerConPermisos(id);

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

// Asignar permiso a rol
export const asignarPermiso = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);
    const { permisoId } = asignarPermisoSchema.parse(req.body);

    const result = await RolService.asignarPermiso(id, permisoId);

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

// Desasignar permiso de rol
export const desasignarPermiso = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);
    const { permisoId } = desasignarPermisoSchema.parse(req.body);

    const result = await RolService.desasignarPermiso(id, permisoId);

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

// Obtener permisos de un rol
export const obtenerPermisosDelRol = async (req: Request, res: Response) => {
  try {
    const { id } = rolParamsSchema.parse(req.params);

    const result = await RolService.obtenerPermisosDelRol(id);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
