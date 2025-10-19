import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  configuracionNotificacionSchema, 
  updateConfiguracionNotificacionSchema 
} from '../validators/notificationValidators';

const prisma = new PrismaClient();

// Obtener configuración de notificaciones de un empleado
export const getConfiguracionNotificacion = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Verificar que el empleado pertenece al usuario
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
        message: 'Empleado no encontrado o no pertenece al usuario'
      });
    }

    // Obtener configuración existente
    const configuracion = await prisma.configuracionNotificacion.findUnique({
      where: { empleadoId: employeeId }
    });

    res.json({
      success: true,
      data: configuracion || null
    });
  } catch (error) {
    console.error('Error obteniendo configuración de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear configuración de notificaciones
export const createConfiguracionNotificacion = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Verificar que el empleado pertenece al usuario
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
        message: 'Empleado no encontrado o no pertenece al usuario'
      });
    }

    // Verificar si ya existe configuración
    const configuracionExistente = await prisma.configuracionNotificacion.findUnique({
      where: { empleadoId: employeeId }
    });

    if (configuracionExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una configuración de notificaciones para este empleado'
      });
    }

    // Validar datos
    const validationResult = configuracionNotificacionSchema.safeParse(req.body);
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

    // Crear configuración
    const configuracion = await prisma.configuracionNotificacion.create({
      data: {
        empleadoId: employeeId,
        ...validationResult.data
      }
    });

    res.status(201).json({
      success: true,
      message: 'Configuración de notificaciones creada exitosamente',
      data: configuracion
    });
  } catch (error) {
    console.error('Error creando configuración de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar configuración de notificaciones
export const updateConfiguracionNotificacion = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Verificar que el empleado pertenece al usuario
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
        message: 'Empleado no encontrado o no pertenece al usuario'
      });
    }

    // Validar datos
    const validationResult = updateConfiguracionNotificacionSchema.safeParse(req.body);
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

    // Actualizar configuración
    const configuracion = await prisma.configuracionNotificacion.upsert({
      where: { empleadoId: employeeId },
      update: validationResult.data,
      create: {
        empleadoId: employeeId,
        ...validationResult.data
      }
    });

    res.json({
      success: true,
      message: 'Configuración de notificaciones actualizada exitosamente',
      data: configuracion
    });
  } catch (error) {
    console.error('Error actualizando configuración de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar configuración de notificaciones
export const deleteConfiguracionNotificacion = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Verificar que el empleado pertenece al usuario
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
        message: 'Empleado no encontrado o no pertenece al usuario'
      });
    }

    // Eliminar configuración
    await prisma.configuracionNotificacion.delete({
      where: { empleadoId: employeeId }
    });

    res.json({
      success: true,
      message: 'Configuración de notificaciones eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando configuración de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
