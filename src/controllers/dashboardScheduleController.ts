import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  horarioLaboralSchema,
} from '../validators/scheduleValidators';

const prisma = new PrismaClient();

// Obtener horario laboral de mi empleado
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

    // Buscar el empleado y su horario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId
      },
      select: {
        horarioLaboral: true
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // El frontend espera una lista de turnos con 'diaSemana' para compatibilidad o el JSON directo
    // Vamos a enviarlo como el JSON guardado.
    res.json({
      success: true,
      data: empleado.horarioLaboral || {}
    });
  } catch (error) {
    console.error('Error obteniendo horario laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar horario laboral completo de mi empleado
export const updateMyHorarioLaboral = async (req: Request, res: Response) => {
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
        usuarioId: userId
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no pertenece a tu cuenta'
      });
    }

    // Validar datos (esperamos un objeto { horarioLaboral: { ... } })
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

    // Actualizar el campo JSON en el empleado
    const updatedEmpleado = await prisma.empleado.update({
      where: { id: employeeId },
      data: {
        horarioLaboral: validationResult.data.horarioLaboral as any
      }
    });

    res.json({
      success: true,
      message: 'Horario laboral actualizado exitosamente',
      data: updatedEmpleado.horarioLaboral
    });
  } catch (error) {
    console.error('Error actualizando horario laboral:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Estos se mantienen por compatibilidad de rutas pero ahora redirigen o devuelven error indicando que se use la ruta de actualización completa
export const createMyHorarioLaboral = async (req: Request, res: Response) => {
  return res.status(405).json({
    success: false,
    message: 'Método no permitido. Use PUT para actualizar el horario completo.'
  });
};

export const deleteMyHorarioLaboral = async (req: Request, res: Response) => {
  return res.status(405).json({
    success: false,
    message: 'Método no permitido. Use PUT para actualizar el horario completo.'
  });
};
