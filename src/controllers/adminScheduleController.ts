import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    horarioLaboralSchema,
} from '../validators/scheduleValidators';

const prisma = new PrismaClient();

// Obtener horarios laborales de un empleado (Super Admin)
export const getHorariosLaborales = async (req: Request, res: Response) => {
    try {
        const { userId, employeeId } = req.params;

        // Verificar que el empleado pertenece al usuario especificado
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
                message: 'Empleado no encontrado para este usuario'
            });
        }

        res.json({
            success: true,
            data: empleado.horarioLaboral || {}
        });
    } catch (error) {
        console.error('Error obteniendo horarios laborales (Admin):', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar horario laboral completo de un empleado (Super Admin)
export const updateHorarioLaboral = async (req: Request, res: Response) => {
    try {
        const { userId, employeeId } = req.params;

        // Verificar que el empleado pertenece al usuario
        const empleado = await prisma.empleado.findFirst({
            where: {
                id: employeeId,
                usuarioId: userId
            }
        });

        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
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

        // Actualizar el campo JSON
        const updatedEmpleado = await prisma.empleado.update({
            where: { id: employeeId },
            data: {
                horarioLaboral: validationResult.data.horarioLaboral as any
            }
        });

        res.json({
            success: true,
            message: 'Horario laboral actualizado exitosamente por el administrador',
            data: updatedEmpleado.horarioLaboral
        });
    } catch (error) {
        console.error('Error actualizando horario laboral (Admin):', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Métodos obsoletos
export const createHorarioLaboral = async (req: Request, res: Response) => {
    return res.status(405).json({
        success: false,
        message: 'Método no permitido. Use PUT para actualizar el horario completo.'
    });
};

export const deleteHorarioLaboral = async (req: Request, res: Response) => {
    return res.status(405).json({
        success: false,
        message: 'Método no permitido. Use PUT para actualizar el horario completo.'
    });
};
