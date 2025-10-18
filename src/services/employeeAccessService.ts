import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EmployeeAccessService {
  /**
   * Verificar si un empleado puede recibir SMS
   */
  static async canReceiveSms(empleadoId: string): Promise<{
    canReceive: boolean;
    reason?: string;
    empleado?: any;
  }> {
    try {
      const empleado = await prisma.empleado.findUnique({
        where: { id: empleadoId },
        include: {
          propietario: {
            select: {
              id: true,
              activo: true,
              // licenciaActiva and fechaExpiracionLicencia removed from schema
            }
          }
        }
      });

      if (!empleado) {
        return {
          canReceive: false,
          reason: 'Empleado no encontrado'
        };
      }

      if (!empleado.activo) {
        return {
          canReceive: false,
          reason: 'Empleado desactivado'
        };
      }

      if (!empleado.propietario.activo) {
        return {
          canReceive: false,
          reason: 'Propietario desactivado'
        };
      }

      // licenciaActiva removed from schema - using membership system
      if (false) {
        return {
          canReceive: false,
          reason: 'Licencia del propietario no activa'
        };
      }

      // fechaExpiracionLicencia removed from schema - using membership system
      if (false) {
        return {
          canReceive: false,
          reason: 'Licencia del propietario expirada'
        };
      }

      // En este sistema no manejamos saldo, se maneja en Google Sheets
      if (false) { // Costo mínimo por SMS
        return {
          canReceive: false,
          reason: 'Saldo insuficiente del propietario'
        };
      }

      return {
        canReceive: true,
        empleado
      };
    } catch (error) {
      console.error('Error al verificar acceso SMS del empleado:', error);
      return {
        canReceive: false,
        reason: 'Error interno'
      };
    }
  }

  /**
   * Obtener empleados que pueden recibir SMS de un propietario
   */
  static async getEmployeesForSms(propietarioId: string): Promise<{
    success: boolean;
    empleados?: any[];
    error?: string;
  }> {
    try {
      const empleados = await prisma.empleado.findMany({
        where: {
          propietarioId,
          activo: true
        },
        select: {
          id: true,
          telefono: true,
          activo: true
        }
      });

      return {
        success: true,
        empleados
      };
    } catch (error) {
      console.error('Error al obtener empleados para SMS:', error);
      return {
        success: false,
        error: 'Error al obtener empleados'
      };
    }
  }

  /**
   * Verificar acceso a Google Sheets (solo lectura)
   */
  static async canAccessGoogleSheets(propietarioId: string): Promise<{
    canAccess: boolean;
    url?: string;
    reason?: string;
  }> {
    try {
      const propietario = await prisma.usuario.findUnique({
        where: { id: propietarioId },
        select: {
          id: true,
          activo: true,
          // licenciaActiva removed from schema
          // fechaExpiracionLicencia removed from schema
          googleSpreadsheetId: true
        }
      });

      if (!propietario) {
        return {
          canAccess: false,
          reason: 'Propietario no encontrado'
        };
      }

      if (!propietario.activo) {
        return {
          canAccess: false,
          reason: 'Propietario desactivado'
        };
      }

      // licenciaActiva removed from schema - using membership system
      if (false) {
        return {
          canAccess: false,
          reason: 'Licencia no activa'
        };
      }

      // fechaExpiracionLicencia removed from schema - using membership system
      if (false) {
        return {
          canAccess: false,
          reason: 'Licencia expirada'
        };
      }

      if (!propietario.googleSpreadsheetId) {
        return {
          canAccess: false,
          reason: 'No se ha creado la hoja de cálculo'
        };
      }

      const url = `https://docs.google.com/spreadsheets/d/${propietario.googleSpreadsheetId}/edit?usp=sharing`;

      return {
        canAccess: true,
        url
      };
    } catch (error) {
      console.error('Error al verificar acceso a Google Sheets:', error);
      return {
        canAccess: false,
        reason: 'Error interno'
      };
    }
  }

  /**
   * Generar enlace de solo lectura para empleados
   */
  static async generateReadOnlyLink(propietarioId: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const accessCheck = await this.canAccessGoogleSheets(propietarioId);
      
      if (!accessCheck.canAccess) {
        return {
          success: false,
          error: accessCheck.reason
        };
      }

      // En un sistema real, aquí configurarías los permisos de solo lectura
      // Por ahora, devolvemos el enlace de compartir
      return {
        success: true,
        url: accessCheck.url
      };
    } catch (error) {
      console.error('Error al generar enlace de solo lectura:', error);
      return {
        success: false,
        error: 'Error al generar enlace'
      };
    }
  }

  /**
   * Verificar si un empleado puede acceder a la información de pagos
   */
  static async canAccessPaymentInfo(empleadoId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    empleado?: any;
  }> {
    try {
      const empleado = await prisma.empleado.findUnique({
        where: { id: empleadoId },
        include: {
          propietario: {
            select: {
              id: true,
              activo: true,
              // licenciaActiva and fechaExpiracionLicencia removed from schema
              googleSpreadsheetId: true
            }
          }
        }
      });

      if (!empleado) {
        return {
          canAccess: false,
          reason: 'Empleado no encontrado'
        };
      }

      if (!empleado.activo) {
        return {
          canAccess: false,
          reason: 'Empleado desactivado'
        };
      }

      if (!empleado.propietario.activo) {
        return {
          canAccess: false,
          reason: 'Propietario desactivado'
        };
      }

      // licenciaActiva removed from schema - using membership system
      if (false) {
        return {
          canAccess: false,
          reason: 'Licencia del propietario no activa'
        };
      }

      // fechaExpiracionLicencia removed from schema - using membership system
      if (false) {
        return {
          canAccess: false,
          reason: 'Licencia del propietario expirada'
        };
      }

      return {
        canAccess: true,
        empleado
      };
    } catch (error) {
      console.error('Error al verificar acceso a información de pagos:', error);
      return {
        canAccess: false,
        reason: 'Error interno'
      };
    }
  }

  /**
   * Obtener información de pagos para empleados (solo lectura)
   */
  static async getPaymentInfoForEmployee(empleadoId: string, fecha?: Date): Promise<{
    success: boolean;
    pagos?: any[];
    error?: string;
  }> {
    try {
      const accessCheck = await this.canAccessPaymentInfo(empleadoId);
      
      if (!accessCheck.canAccess) {
        return {
          success: false,
          error: accessCheck.reason
        };
      }

      const propietarioId = accessCheck.empleado?.propietarioId;
      
      if (!propietarioId) {
        return {
          success: false,
          error: 'Propietario no encontrado'
        };
      }

      // Obtener pagos del propietario
      const whereClause: any = {
        propietarioId
      };

      if (fecha) {
        const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        const finDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);
        
        whereClause.fecha = {
          gte: inicioDia,
          lte: finDia
        };
      }

      const pagos = await prisma.pago.findMany({
        where: whereClause,
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          monto: true,
          fecha: true,
          codigoSeguridad: true,
          nombrePagador: true,
          numeroTelefono: true,
          notificadoEmpleados: true,
          registradoEnSheets: true
        }
      });

      const pagosFormateados = pagos.map(pago => ({
        fecha: pago.fecha.toLocaleDateString('es-PE'),
        hora: pago.fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        pagador: pago.nombrePagador,
        monto: pago.monto.toFixed(2),
        codigoSeguridad: pago.codigoSeguridad,
        telefono: pago.numeroTelefono || '',
        smsEnviado: pago.notificadoEmpleados ? 'Sí' : 'No',
        registradoEnSheets: pago.registradoEnSheets ? 'Sí' : 'No'
      }));

      return {
        success: true,
        pagos: pagosFormateados
      };
    } catch (error) {
      console.error('Error al obtener información de pagos para empleado:', error);
      return {
        success: false,
        error: 'Error al obtener información de pagos'
      };
    }
  }

  /**
   * Obtener estadísticas básicas para empleados
   */
  static async getBasicStatsForEmployee(empleadoId: string): Promise<{
    success: boolean;
    estadisticas?: any;
    error?: string;
  }> {
    try {
      const accessCheck = await this.canAccessPaymentInfo(empleadoId);
      
      if (!accessCheck.canAccess) {
        return {
          success: false,
          error: accessCheck.reason
        };
      }

      const propietarioId = accessCheck.empleado?.propietarioId;
      
      if (!propietarioId) {
        return {
          success: false,
          error: 'Propietario no encontrado'
        };
      }

      // Obtener estadísticas básicas
      const totalPagos = await prisma.pago.count({
        where: { propietarioId }
      });

      const pagosHoy = await prisma.pago.count({
        where: {
          propietarioId,
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      });

      const montoTotal = await prisma.pago.aggregate({
        where: { propietarioId },
        _sum: { monto: true }
      });

      const montoHoy = await prisma.pago.aggregate({
        where: {
          propietarioId,
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        _sum: { monto: true }
      });

      return {
        success: true,
        estadisticas: {
          totalPagos,
          pagosHoy,
          montoTotal: montoTotal._sum.monto || 0,
          montoHoy: montoHoy._sum.monto || 0,
          propietario: accessCheck.empleado?.propietario.nombre
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas para empleado:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas'
      };
    }
  }
}
