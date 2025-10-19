import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MembresiaService } from '../services/membresiaService';
import { ConnectivityService } from '../services/connectivityService';

const prisma = new PrismaClient();

// Obtener información del dashboard para el usuario
export const getDashboardInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener información de licencia
    const licenseInfo = await MembresiaService.verificarAcceso(userId);

    // Obtener información del sistema
    const systemInfo = await ConnectivityService.checkSystemConnectivity();

    // Obtener estadísticas básicas del usuario
    const userStats = await getUserStats(userId);

    // Información del dashboard
    const dashboardData = {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol?.nombre,
        activo: user.activo,
        emailVerificado: user.emailVerificado,
        createdAt: user.createdAt
      },
      license: {
        hasAccess: licenseInfo.tieneAcceso,
        reason: licenseInfo.mensaje,
        daysRemaining: licenseInfo.diasRestantes,
        isExpired: licenseInfo.tipoAcceso === 'sin_acceso',
        isSuperAdmin: user.rol?.nombre === 'super_admin',
        enPeriodoPrueba: user.enPeriodoPrueba,
        // licenciaActiva and fechaExpiracionLicencia removed from schema
        tipoAcceso: licenseInfo.tipoAcceso
      },
      system: {
        internet: systemInfo.internet,
        database: systemInfo.database,
        email: systemInfo.email,
        sms: systemInfo.sms,
        overall: systemInfo.overall
      },
      stats: userStats
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error obteniendo información del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas del usuario
async function getUserStats(userId: string) {
  try {
    const [totalPagos, pagosRecientes, empleados] = await Promise.all([
      prisma.pago.count({
        where: { usuarioId: userId }
      }),
      prisma.pago.count({
        where: {
          usuarioId: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        }
      }),
      prisma.empleado.count({
        where: { usuarioId: userId }
      })
    ]);

    return {
      totalPagos,
      pagosRecientes,
      empleados
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    return {
      totalPagos: 0,
      pagosRecientes: 0,
      empleados: 0
    };
  }
}

// Obtener información de licencia específica
export const getLicenseStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const licenseInfo = await MembresiaService.verificarAcceso(userId);

    res.json({
      success: true,
      data: licenseInfo
    });
  } catch (error) {
    console.error('Error obteniendo estado de licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
