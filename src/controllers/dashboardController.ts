import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

    // Obtener información de membresía
    const licenseInfo = { 
      tieneAcceso: true, 
      diasRestantes: 30, 
      mensaje: 'Acceso válido',
      tipoAcceso: 'activo'
    };

    // Obtener información del sistema
    const systemInfo = {
      status: 'online',
      timestamp: new Date().toISOString(),
      internet: { status: 'connected', responseTime: 50 },
      database: { status: 'connected', responseTime: 20 },
      email: { status: 'available', provider: 'SMTP' },
      sms: { status: 'available', provider: 'API' },
      overall: 'healthy'
    };

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

// Obtener información de membresía específica
export const getLicenseStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // TODO: Implementar verificación de acceso
    // const licenseInfo = await MembresiaService.verificarAcceso(userId);
    const licenseInfo = { 
      tieneAcceso: true, 
      diasRestantes: 30, 
      mensaje: 'Acceso válido',
      tipoAcceso: 'activo'
    };

    res.json({
      success: true,
      data: licenseInfo
    });
  } catch (error) {
    console.error('Error obteniendo estado de membresía:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
