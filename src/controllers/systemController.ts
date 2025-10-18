import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/emailService';
import { ConnectivityService } from '../services/connectivityService';

const prisma = new PrismaClient();

// Verificar estado del sistema
export const checkSystemStatus = async (req: Request, res: Response) => {
  try {
    const checks = {
      database: false,
      email: false,
      permissions: false,
      internet: false,
      timestamp: new Date().toISOString()
    };

    // Verificar conexión a base de datos
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Error de conexión a BD:', error);
    }

    // Verificar servicio de email
    try {
      // Simular verificación de email (en producción, hacer ping real)
      checks.email = true;
    } catch (error) {
      console.error('Error de servicio de email:', error);
    }

    // Verificar permisos del sistema
    try {
      const permissions = await prisma.permiso.count();
      checks.permissions = permissions > 0;
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }

    // Verificar conectividad a internet
    try {
      const internetCheck = await ConnectivityService.checkInternetConnection();
      checks.internet = internetCheck.isConnected;
    } catch (error) {
      console.error('Error de conectividad:', error);
    }

    const allSystemsOk = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    res.json({
      success: allSystemsOk,
      message: allSystemsOk ? 'Sistema funcionando correctamente' : 'Problemas detectados en el sistema',
      data: {
        status: allSystemsOk ? 'healthy' : 'degraded',
        checks,
        recommendations: getRecommendations(checks)
      }
    });

  } catch (error) {
    console.error('Error verificando sistema:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      data: {
        status: 'error',
        checks: {
          database: false,
          email: false,
          permissions: false,
          internet: false,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
};

// Verificar permisos del usuario
export const checkUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { 
        rol: { 
          include: { 
            permisos: { 
              include: { permiso: true } 
            } 
          } 
        } 
      }
    });

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const permisos = usuario.rol.permisos.map(rp => ({
      id: rp.permiso.id,
      nombre: rp.permiso.nombre,
      descripcion: rp.permiso.descripcion,
      modulo: rp.permiso.modulo,
      accion: rp.permiso.accion
    }));

    res.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol.nombre
        },
        permisos,
        totalPermisos: permisos.length
      }
    });

  } catch (error) {
    console.error('Error verificando permisos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Verificar conectividad
export const checkConnectivity = async (req: Request, res: Response) => {
  try {
    const connectivity = {
      database: false,
      email: false,
      internet: false,
      timestamp: new Date().toISOString()
    };

    // Verificar base de datos
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectivity.database = true;
    } catch (error) {
      console.error('Error de BD:', error);
    }

    // Verificar email (simulado)
    try {
      // En producción, verificar SMTP
      connectivity.email = true;
    } catch (error) {
      console.error('Error de email:', error);
    }

    // Verificar internet (simulado)
    try {
      // En producción, hacer ping a google.com o similar
      connectivity.internet = true;
    } catch (error) {
      console.error('Error de internet:', error);
    }

    const allConnected = Object.values(connectivity).every(check => 
      typeof check === 'boolean' ? check : true
    );

    res.json({
      success: allConnected,
      message: allConnected ? 'Conectividad completa' : 'Problemas de conectividad detectados',
      data: {
        connectivity,
        status: allConnected ? 'connected' : 'disconnected'
      }
    });

  } catch (error) {
    console.error('Error verificando conectividad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener información del sistema
export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      totalPagos,
      otpsActivos,
      roles
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.pago.count(),
      prisma.otpCode.count({ where: { usado: false, expiraEn: { gt: new Date() } } }),
      prisma.rol.findMany({ select: { id: true, nombre: true, descripcion: true } })
    ]);

    res.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          inactivos: totalUsuarios - usuariosActivos
        },
        pagos: {
          total: totalPagos
        },
        sistema: {
          otpsActivos,
          roles: roles.length,
          version: '1.0.0',
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo información del sistema:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Función auxiliar para obtener recomendaciones
function getRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.database) {
    recommendations.push('Verificar conexión a la base de datos');
  }

  if (!checks.email) {
    recommendations.push('Verificar configuración del servicio de email');
  }

  if (!checks.permissions) {
    recommendations.push('Verificar configuración de permisos del sistema');
  }

  if (!checks.internet) {
    recommendations.push('Verificar conectividad a internet');
  }

  if (recommendations.length === 0) {
    recommendations.push('Sistema funcionando correctamente');
  }

  return recommendations;
}
