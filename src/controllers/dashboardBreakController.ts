import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  breakLaboralSchema, 
  updateBreakLaboralSchema 
} from '../validators/breakValidators';

const prisma = new PrismaClient();

// Obtener breaks laborales de mi empleado
export const getMyBreaksLaborales = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el empleado pertenece al usuario autenticado
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId,
        activo: true
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // Obtener breaks
    const breaks = await prisma.breakLaboral.findMany({
      where: { empleadoId: employeeId },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: breaks
    });
  } catch (error) {
    console.error('Error obteniendo breaks laborales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear break laboral para mi empleado
export const createMyBreakLaboral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el empleado pertenece al usuario autenticado
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId,
        activo: true
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // Validar datos
    const validationResult = breakLaboralSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Verificar si ya existe break para ese día
    const breakExistente = await prisma.breakLaboral.findUnique({
      where: {
        empleadoId_diaSemana: {
          empleadoId: employeeId,
          diaSemana: validationResult.data.diaSemana
        }
      }
    });

    if (breakExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un break para este día de la semana'
      });
    }

    // Crear break
    const breakLaboral = await prisma.breakLaboral.create({
      data: {
        empleadoId: employeeId,
        ...validationResult.data
      }
    });

    res.status(201).json({
      success: true,
      message: 'Break laboral creado exitosamente',
      data: breakLaboral
    });
  } catch (error) {
    console.error('Error creando break laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar break laboral de mi empleado
export const updateMyBreakLaboral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId, breakId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el empleado pertenece al usuario autenticado
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId,
        activo: true
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // Verificar que el break existe y pertenece al empleado
    const breakExistente = await prisma.breakLaboral.findFirst({
      where: {
        id: breakId,
        empleadoId: employeeId
      }
    });

    if (!breakExistente) {
      return res.status(404).json({
        success: false,
        message: 'Break laboral no encontrado'
      });
    }

    // Validar datos
    const validationResult = updateBreakLaboralSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Si se está cambiando el día, verificar que no exista conflicto
    if (validationResult.data.diaSemana && validationResult.data.diaSemana !== breakExistente.diaSemana) {
      const breakConflicto = await prisma.breakLaboral.findUnique({
        where: {
          empleadoId_diaSemana: {
            empleadoId: employeeId,
            diaSemana: validationResult.data.diaSemana
          }
        }
      });

      if (breakConflicto && breakConflicto.id !== breakId) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un break para este día de la semana'
        });
      }
    }

    // Actualizar break
    const breakLaboral = await prisma.breakLaboral.update({
      where: { id: breakId },
      data: validationResult.data
    });

    res.json({
      success: true,
      message: 'Break laboral actualizado exitosamente',
      data: breakLaboral
    });
  } catch (error) {
    console.error('Error actualizando break laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar break laboral de mi empleado
export const deleteMyBreakLaboral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId, breakId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el empleado pertenece al usuario autenticado
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId,
        activo: true
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // Verificar que el break existe y pertenece al empleado
    const breakExistente = await prisma.breakLaboral.findFirst({
      where: {
        id: breakId,
        empleadoId: employeeId
      }
    });

    if (!breakExistente) {
      return res.status(404).json({
        success: false,
        message: 'Break laboral no encontrado'
      });
    }

    // Eliminar break
    await prisma.breakLaboral.delete({
      where: { id: breakId }
    });

    res.json({
      success: true,
      message: 'Break laboral eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando break laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
