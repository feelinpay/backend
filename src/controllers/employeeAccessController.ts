import { Request, Response } from 'express';
import { EmployeeAccessService } from '../services/employeeAccessService';

export class EmployeeAccessController {
  /**
   * Obtener enlace de Google Sheets para empleados (solo lectura)
   */
  static async obtenerEnlaceGoogleSheets(req: Request, res: Response) {
    try {
      const { propietarioId } = req.params;

      const resultado = await EmployeeAccessService.generateReadOnlyLink(propietarioId);

      if (!resultado.success) {
        return res.status(404).json({ 
          error: resultado.error,
          code: 'GOOGLE_SHEETS_ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        url: resultado.url,
        message: 'Enlace de Google Sheets obtenido exitosamente',
        accessType: 'read_only',
        description: 'Los empleados pueden ver los pagos pero no editarlos'
      });
    } catch (error) {
      console.error('Error al obtener enlace de Google Sheets:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Verificar si un empleado puede recibir SMS
   */
  static async verificarAccesoSms(req: Request, res: Response) {
    try {
      const { empleadoId } = req.params;

      const resultado = await EmployeeAccessService.canReceiveSms(empleadoId);

      res.json({
        success: true,
        canReceive: resultado.canReceive,
        reason: resultado.reason,
        empleado: resultado.empleado ? {
          id: resultado.empleado.id,
          nombre: resultado.empleado.nombre,
          telefono: resultado.empleado.telefono,
          activo: resultado.empleado.activo
        } : null
      });
    } catch (error) {
      console.error('Error al verificar acceso SMS:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Obtener información de pagos para empleados (solo lectura)
   */
  static async obtenerInformacionPagos(req: Request, res: Response) {
    try {
      const { empleadoId } = req.params;
      const { fecha } = req.query;

      const fechaFiltro = fecha ? new Date(fecha as string) : undefined;

      const resultado = await EmployeeAccessService.getPaymentInfoForEmployee(
        empleadoId, 
        fechaFiltro
      );

      if (!resultado.success) {
        return res.status(403).json({ 
          error: resultado.error,
          code: 'PAYMENT_INFO_ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        pagos: resultado.pagos,
        total: resultado.pagos?.length || 0,
        fecha: fechaFiltro ? fechaFiltro.toLocaleDateString('es-PE') : 'Todas las fechas',
        accessType: 'read_only',
        description: 'Información de solo lectura para empleados'
      });
    } catch (error) {
      console.error('Error al obtener información de pagos:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Obtener estadísticas básicas para empleados
   */
  static async obtenerEstadisticasBasicas(req: Request, res: Response) {
    try {
      const { empleadoId } = req.params;

      const resultado = await EmployeeAccessService.getBasicStatsForEmployee(empleadoId);

      if (!resultado.success) {
        return res.status(403).json({ 
          error: resultado.error,
          code: 'STATS_ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        estadisticas: resultado.estadisticas,
        accessType: 'read_only',
        description: 'Estadísticas básicas de solo lectura'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas básicas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Obtener empleados que pueden recibir SMS
   */
  static async obtenerEmpleadosParaSms(req: Request, res: Response) {
    try {
      const { propietarioId } = req.params;

      const resultado = await EmployeeAccessService.getEmployeesForSms(propietarioId);

      if (!resultado.success) {
        return res.status(500).json({ 
          error: resultado.error,
          code: 'EMPLOYEES_FETCH_ERROR'
        });
      }

      res.json({
        success: true,
        empleados: resultado.empleados,
        total: resultado.empleados?.length || 0,
        message: 'Empleados que pueden recibir SMS obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener empleados para SMS:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Verificar acceso general de empleado
   */
  static async verificarAccesoGeneral(req: Request, res: Response) {
    try {
      const { empleadoId } = req.params;

      const [smsAccess, paymentAccess] = await Promise.all([
        EmployeeAccessService.canReceiveSms(empleadoId),
        EmployeeAccessService.canAccessPaymentInfo(empleadoId)
      ]);

      res.json({
        success: true,
        acceso: {
          sms: {
            puedeRecibir: smsAccess.canReceive,
            razon: smsAccess.reason
          },
          googleSheets: {
            puedeAcceder: paymentAccess.canAccess,
            razon: paymentAccess.reason
          }
        },
        empleado: smsAccess.empleado ? {
          id: smsAccess.empleado.id,
          nombre: smsAccess.empleado.nombre,
          telefono: smsAccess.empleado.telefono,
          activo: smsAccess.empleado.activo,
          propietario: smsAccess.empleado.propietario?.nombre
        } : null
      });
    } catch (error) {
      console.error('Error al verificar acceso general:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}
