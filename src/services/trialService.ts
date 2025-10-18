import { PrismaClient } from '@prisma/client';
// DateUtils removed - using built-in Date methods

const prisma = new PrismaClient();

export class TrialService {
  // Activar período de prueba para nuevos usuarios
  static async activarPeriodoPrueba(usuarioId: string): Promise<{
    activado: boolean;
    diasRestantes: number;
    fechaExpiracion: Date;
  }> {
    try {
      const fechaInicio = new Date();
      const fechaExpiracion = new Date(fechaInicio.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días de prueba

      await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          enPeriodoPrueba: true,
          fechaInicioPrueba: fechaInicio,
          diasPruebaRestantes: 3,
          // Licencia temporal activada (campo removido)
        }
      });

      return {
        activado: true,
        diasRestantes: 3,
        fechaExpiracion
      };
    } catch (error) {
      console.error('Error al activar período de prueba:', error);
      throw new Error('Error al activar período de prueba');
    }
  }

  // Verificar si el usuario está en período de prueba
  static async verificarPeriodoPrueba(usuarioId: string): Promise<{
    enPrueba: boolean;
    diasRestantes: number;
    expirado: boolean;
    mensaje?: string;
  }> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          enPeriodoPrueba: true,
          fechaInicioPrueba: true,
          diasPruebaRestantes: true,
          // fechaExpiracionLicencia removido
        }
      });

      if (!usuario) {
        return { enPrueba: false, diasRestantes: 0, expirado: false };
      }

      if (!usuario.enPeriodoPrueba) {
        return { enPrueba: false, diasRestantes: 0, expirado: false };
      }

      const ahora = new Date();
      const diasRestantes = usuario.diasPruebaRestantes;
      const expirado = diasRestantes <= 0;

      if (expirado) {
        // Desactivar período de prueba
        await this.finalizarPeriodoPrueba(usuarioId);
        return {
          enPrueba: false,
          diasRestantes: 0,
          expirado: true,
          mensaje: 'Tu período de prueba ha expirado. Contacta al administrador para activar tu licencia.'
        };
      }

      return {
        enPrueba: true,
        diasRestantes,
        expirado: false,
        mensaje: diasRestantes === 1 ? 'Tu período de prueba expira mañana. Considera activar tu licencia.' : undefined
      };
    } catch (error) {
      console.error('Error al verificar período de prueba:', error);
      return { enPrueba: false, diasRestantes: 0, expirado: false };
    }
  }

  // Finalizar período de prueba
  static async finalizarPeriodoPrueba(usuarioId: string): Promise<void> {
    try {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          enPeriodoPrueba: false,
          // licenciaActiva removido
          diasPruebaRestantes: 0
        }
      });
    } catch (error) {
      console.error('Error al finalizar período de prueba:', error);
    }
  }

  // Actualizar días restantes de prueba
  static async actualizarDiasPrueba(): Promise<number> {
    try {
      const usuariosEnPrueba = await prisma.usuario.findMany({
        where: {
          enPeriodoPrueba: true,
          diasPruebaRestantes: { gt: 0 }
        },
        select: {
          id: true,
          fechaInicioPrueba: true,
          diasPruebaRestantes: true
        }
      });

      let usuariosActualizados = 0;

      for (const usuario of usuariosEnPrueba) {
        if (usuario.fechaInicioPrueba) {
          const diasTranscurridos = Math.floor((new Date().getTime() - usuario.fechaInicioPrueba.getTime()) / (1000 * 60 * 60 * 24));
          const diasRestantes = Math.max(0, 3 - diasTranscurridos);

          if (diasRestantes !== usuario.diasPruebaRestantes) {
            await prisma.usuario.update({
              where: { id: usuario.id },
              data: { diasPruebaRestantes: diasRestantes }
            });

            if (diasRestantes === 0) {
              await this.finalizarPeriodoPrueba(usuario.id);
            }

            usuariosActualizados++;
          }
        }
      }

      return usuariosActualizados;
    } catch (error) {
      console.error('Error al actualizar días de prueba:', error);
      return 0;
    }
  }

  // Obtener estadísticas de períodos de prueba
  static async obtenerEstadisticasPrueba(): Promise<{
    usuariosEnPrueba: number;
    usuariosConPruebaExpirada: number;
    usuariosConPruebaPorExpiar: number;
    totalUsuariosNuevos: number;
  }> {
    try {
      const fechaLimite = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días

      const [
        usuariosEnPrueba,
        usuariosConPruebaExpirada,
        usuariosConPruebaPorExpiar,
        totalUsuariosNuevos
      ] = await Promise.all([
        prisma.usuario.count({
          where: {
            enPeriodoPrueba: true,
            diasPruebaRestantes: { gt: 0 }
          }
        }),
        prisma.usuario.count({
          where: {
            enPeriodoPrueba: false,
            fechaInicioPrueba: { not: null },
            // licenciaActiva removido
          }
        }),
        prisma.usuario.count({
          where: {
            enPeriodoPrueba: true,
            diasPruebaRestantes: 1
          }
        }),
        prisma.usuario.count({
          where: {
            createdAt: { gte: fechaLimite },
            rol: { nombre: 'propietario' }
          }
        })
      ]);

      return {
        usuariosEnPrueba,
        usuariosConPruebaExpirada,
        usuariosConPruebaPorExpiar,
        totalUsuariosNuevos
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de prueba:', error);
      return {
        usuariosEnPrueba: 0,
        usuariosConPruebaExpirada: 0,
        usuariosConPruebaPorExpiar: 0,
        totalUsuariosNuevos: 0
      };
    }
  }

  // Verificar si un usuario puede activar período de prueba
  static async puedeActivarPrueba(usuarioId: string): Promise<{
    puede: boolean;
    razon?: string;
  }> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          enPeriodoPrueba: true,
          fechaInicioPrueba: true,
          // licenciaActiva removido
          rol: true
        }
      });

      if (!usuario) {
        return { puede: false, razon: 'Usuario no encontrado' };
      }

      if (usuario.rol.nombre === 'super_admin') {
        return { puede: false, razon: 'Los super administradores no necesitan período de prueba' };
      }

      // Verificar membresía activa (implementar lógica de membresía)
      if (!usuario.enPeriodoPrueba) {
        return { puede: false, razon: 'El usuario ya tiene una licencia activa' };
      }

      if (usuario.enPeriodoPrueba) {
        return { puede: false, razon: 'El usuario ya está en período de prueba' };
      }

      if (usuario.fechaInicioPrueba) {
        return { puede: false, razon: 'El usuario ya utilizó su período de prueba' };
      }

      return { puede: true };
    } catch (error) {
      console.error('Error al verificar si puede activar prueba:', error);
      return { puede: false, razon: 'Error interno' };
    }
  }
}
