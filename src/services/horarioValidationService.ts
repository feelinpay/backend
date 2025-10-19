import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HorarioValidationService {
  // Verificar si un empleado puede recibir SMS según su horario
  static async puedeRecibirSMS(empleadoId: string): Promise<boolean> {
    try {
      // 1. Verificar si las notificaciones están activas
      const config = await prisma.configuracionNotificacion.findUnique({
        where: { empleadoId }
      });
      
      if (!config?.notificacionesActivas) return false;

      // 2. Obtener el día actual (1=Lunes, ..., 7=Domingo)
      const hoy = new Date();
      const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay(); // Convertir 0 (Domingo) a 7

      // 3. Obtener horario laboral para el día actual
      const horario = await prisma.horarioLaboral.findUnique({
        where: {
          empleadoId_diaSemana: {
            empleadoId,
            diaSemana
          }
        }
      });

      // Si no hay horario laboral o está inactivo, no puede recibir SMS
      if (!horario?.activo) {
        // Si no tiene horario laboral, pero las notificaciones están activas, se asume que siempre puede recibir.
        // Esto cubre el caso de "si en caso no tenga esos campos, que se manipule directamente la activación y desactivación de notificaciones"
        return config.notificacionesActivas;
      }

      // 4. Verificar si la hora actual está dentro del horario laboral
      const horaActual = hoy.toTimeString().slice(0, 5); // "HH:MM"
      if (horaActual < horario.horaInicio || horaActual > horario.horaFin) {
        return false;
      }

      // 5. Verificar si está en break
      const breakHoy = await prisma.breakLaboral.findUnique({
        where: {
          empleadoId_diaSemana: {
            empleadoId,
            diaSemana
          }
        }
      });

      if (breakHoy?.activo && horaActual >= breakHoy.horaInicio && horaActual <= breakHoy.horaFin) {
        return false; // Está en break, no puede recibir SMS
      }

      return true; // Puede recibir SMS
    } catch (error) {
      console.error('Error verificando horario:', error);
      return false;
    }
  }

  // Obtener empleados elegibles para SMS
  static async getEmpleadosElegiblesParaSMS(usuarioId: string) {
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
        const puedeRecibir = await this.puedeRecibirSMS(empleado.id);
        if (puedeRecibir) {
          empleadosElegibles.push(empleado);
        }
      }

      return empleadosElegibles;
    } catch (error) {
      console.error('Error obteniendo empleados elegibles:', error);
      return [];
    }
  }

  // Activar/desactivar notificaciones para un empleado
  static async toggleNotificaciones(empleadoId: string, activar: boolean) {
    try {
      const config = await prisma.configuracionNotificacion.upsert({
        where: { empleadoId },
        update: { notificacionesActivas: activar },
        create: {
          empleadoId,
          notificacionesActivas: activar
        }
      });

      return config;
    } catch (error) {
      console.error('Error toggleando notificaciones:', error);
      throw error;
    }
  }
}
