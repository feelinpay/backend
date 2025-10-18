import { Request, Response } from 'express';
import { UserCleanupJob } from '../jobs/userCleanupJob';

// Obtener estadísticas de usuarios no verificados
export const getUnverifiedUsersStats = async (req: Request, res: Response) => {
  try {
    const stats = await UserCleanupJob.getUnverifiedUsersStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios no verificados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener lista de usuarios no verificados
export const getUnverifiedUsersList = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const limitNumber = Math.min(Number(limit), 100); // Máximo 100

    const result = await UserCleanupJob.getUnverifiedUsersList(limitNumber);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo lista de usuarios no verificados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Ejecutar limpieza manual de usuarios no verificados
export const cleanupUnverifiedUsers = async (req: Request, res: Response) => {
  try {
    const result = await UserCleanupJob.cleanupUnverifiedUsersManual();

    res.json({
      success: result.success,
      message: result.message,
      data: {
        cleaned: result.cleaned,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error ejecutando limpieza de usuarios no verificados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
