import { Request, Response } from 'express';
import { MembresiaService } from '../services/membresiaService';
import { 
  createMembresiaSchema, 
  updateMembresiaSchema, 
  membresiaParamsSchema,
  membresiaQuerySchema 
} from '../validators/membresiaValidators';

// Crear nueva membresía
export const crearMembresia = async (req: Request, res: Response) => {
  try {
    const validatedData = createMembresiaSchema.parse(req.body);
    
    const result = await MembresiaService.crearMembresia(validatedData);
    
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

// Obtener todas las membresías
export const obtenerMembresias = async (req: Request, res: Response) => {
  try {
    const { page, limit, activa, search } = membresiaQuerySchema.parse(req.query);
    
    const result = await MembresiaService.obtenerMembresias(page, limit, activa, search);
    
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

// Obtener membresía por ID
export const obtenerMembresiaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaParamsSchema.parse(req.params);
    
    const result = await MembresiaService.obtenerMembresiaPorId(id);
    
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID de membresía inválido',
        errors: error.errors
      });
    }
    
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar membresía
export const actualizarMembresia = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaParamsSchema.parse(req.params);
    const validatedData = updateMembresiaSchema.parse(req.body);
    
    const result = await MembresiaService.actualizarMembresia(id, validatedData);
    
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

// Eliminar membresía
export const eliminarMembresia = async (req: Request, res: Response) => {
  try {
    const { id } = membresiaParamsSchema.parse(req.params);
    
    const result = await MembresiaService.eliminarMembresia(id);
    
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'ID de membresía inválido',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener membresías activas (para dropdowns)
export const obtenerMembresiasActivas = async (req: Request, res: Response) => {
  try {
    const result = await MembresiaService.obtenerMembresiasActivas();
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
