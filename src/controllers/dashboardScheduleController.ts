import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  horarioLaboralSchema,
  updateHorarioLaboralSchema
} from '../validators/scheduleValidators';

const prisma = new PrismaClient();

// Obtener horarios laborales de mi empleado
export const getMyHorariosLaborales = async (req: Request, res: Response) => {
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

    // Obtener horarios
    const horarios = await prisma.horarioLaboral.findMany({
      where: { empleadoId: employeeId },
      orderBy: { diaSemana: 'asc' }
    });

    res.json({
      success: true,
      data: horarios
    });
  } catch (error) {
    console.error('Error obteniendo horarios laborales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear horario laboral para mi empleado
export const createMyHorarioLaboral = async (req: Request, res: Response) => {
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
    const validationResult = horarioLaboralSchema.safeParse(req.body);
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

    // Crear horario
    const horario = await prisma.horarioLaboral.create({
      data: {
        empleadoId: employeeId,
        diaSemana: String(validationResult.data.diaSemana),
        horaInicio: validationResult.data.horaInicio,
        horaFin: validationResult.data.horaFin,
        activo: validationResult.data.activo ?? true
      } as any
    });

    res.status(201).json({
      success: true,
      message: 'Horario laboral creado exitosamente',
      data: horario
    });
  } catch (error) {
    console.error('Error creando horario laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar horario laboral de mi empleado
export const updateMyHorarioLaboral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId, horarioId } = req.params;

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

    // Verificar que el horario existe y pertenece al empleado
    const horarioExistente = await prisma.horarioLaboral.findFirst({
      where: {
        id: horarioId,
        empleadoId: employeeId
      }
    });

    if (!horarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Horario laboral no encontrado'
      });
    }

    // Validar datos
    const validationResult = updateHorarioLaboralSchema.safeParse(req.body);
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

    // Preparar datos para actualización (convertir diaSemana a String si existe)
    const updateData: any = { ...validationResult.data };
    if (updateData.diaSemana !== undefined) {
      updateData.diaSemana = String(updateData.diaSemana);
    }

    // Actualizar horario
    const horario = await prisma.horarioLaboral.update({
      where: { id: horarioId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Horario laboral actualizado exitosamente',
      data: horario
    });
  } catch (error) {
    console.error('Error actualizando horario laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar horario laboral de mi empleado
export const deleteMyHorarioLaboral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId, horarioId } = req.params;

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

    // Verificar que el horario existe y pertenece al empleado
    const horarioExistente = await prisma.horarioLaboral.findFirst({
      where: {
        id: horarioId,
        empleadoId: employeeId
      }
    });

    if (!horarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Horario laboral no encontrado'
      });
    }

    // Eliminar horario
    await prisma.horarioLaboral.delete({
      where: { id: horarioId }
    });

    res.json({
      success: true,
      message: 'Horario laboral eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando horario laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
