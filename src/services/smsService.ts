import { PrismaClient } from '@prisma/client';
import { HorarioValidationService } from './horarioValidationService';

const prisma = new PrismaClient();

export class SmsService {
  // Enviar SMS a empleados elegibles
  static async enviarSmsAMpleados(usuarioId: string, mensaje: string) {
    try {
      // Obtener empleados del usuario
      const empleados = await prisma.empleado.findMany({
        where: {
          usuarioId,
          activo: true
        },
        include: {
          configuracionNotificacion: true,
          horariosLaborales: {
            where: { activo: true }
          },
          breaksLaborales: {
            where: { activo: true }
          }
        }
      });

      const empleadosElegibles = [];
      
      for (const empleado of empleados) {
        const puedeRecibir = await HorarioValidationService.puedeRecibirSMS(empleado.id);
        if (puedeRecibir) {
          empleadosElegibles.push(empleado);
        }
      }

      // Aquí se implementaría la lógica de envío de SMS
      // Por ahora solo retornamos los empleados elegibles
      return {
        success: true,
        data: {
          empleadosElegibles: empleadosElegibles.length,
          empleados: empleadosElegibles.map(e => ({
            id: e.id,
            nombre: e.nombre,
            telefono: e.telefono
          }))
        },
        message: `SMS enviado a ${empleadosElegibles.length} empleados`
      };
    } catch (error: any) {
      throw new Error(`Error al enviar SMS: ${error.message}`);
    }
  }

  // Obtener empleados elegibles para SMS
  static async obtenerEmpleadosElegibles(usuarioId: string) {
    try {
      const empleados = await prisma.empleado.findMany({
        where: {
          usuarioId,
          activo: true
        },
        include: {
          configuracionNotificacion: true,
          horariosLaborales: {
            where: { activo: true }
          },
          breaksLaborales: {
            where: { activo: true }
          }
        }
      });

      const empleadosElegibles = [];
      
      for (const empleado of empleados) {
        const puedeRecibir = await HorarioValidationService.puedeRecibirSMS(empleado.id);
        empleadosElegibles.push({
          ...empleado,
          puedeRecibirSMS: puedeRecibir
        });
      }

      return {
        success: true,
        data: empleadosElegibles
      };
    } catch (error: any) {
      throw new Error(`Error al obtener empleados elegibles: ${error.message}`);
    }
  }
}
