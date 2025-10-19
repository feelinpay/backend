import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { getCleanupConfig } from '../config/appConfig';

const prisma = new PrismaClient();
const cleanupConfig = getCleanupConfig();

export class UserCleanupJob {
  // Limpiar usuarios no verificados después de 7 días
  static init() {
    // Ejecutar cada día según configuración
    const cronExpression = `0 ${cleanupConfig.dailyResetHour} * * *`;
    cron.schedule(cronExpression, async () => {
      try {
        console.log('Limpiando usuarios no verificados...');
        
        const resultado = await this.cleanupUnverifiedUsers();
        
        console.log(`Limpieza completada: ${resultado.cleaned} eliminados, ${resultado.errors} errores`);

      } catch (error) {
        console.error('Error al limpiar usuarios:', error);
      }
    });

    console.log('Job de limpieza de usuarios iniciado');
  }

  // Limpiar usuarios no verificados manualmente
  static async cleanupUnverifiedUsersManual(): Promise<{
    success: boolean;
    cleaned: number;
    errors: number;
    message: string;
  }> {
    try {
      console.log('Ejecutando limpieza manual...');
      
      const resultado = await this.cleanupUnverifiedUsers();
      
      console.log(`Estadísticas: ${resultado.cleaned} eliminados, ${resultado.errors} errores`);

      return {
        success: true,
        cleaned: resultado.cleaned,
        errors: resultado.errors,
        message: `Se eliminaron ${resultado.cleaned} usuarios no verificados con ${resultado.errors} errores`
      };
    } catch (error) {
      console.error('Error en limpieza manual:', error);

      return {
        success: false,
        cleaned: 0,
        errors: 1,
        message: 'Error interno al limpiar usuarios'
      };
    }
  }

  // Función principal de limpieza
  private static async cleanupUnverifiedUsers(): Promise<{
    cleaned: number;
    errors: number;
  }> {
    try {
      // Calcular fecha límite según configuración
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - cleanupConfig.unverifiedUserCleanupDays);

      // Buscar usuarios no verificados creados hace más de X días
      const usuariosNoVerificados = await prisma.usuario.findMany({
        where: {
          emailVerificado: false,
          createdAt: {
            lt: fechaLimite
          },
          // No eliminar super admins
          rol: {
            nombre: {
              not: 'super_admin'
            }
          }
        },
        include: {
          rol: true
        }
      });

      let cleaned = 0;
      let errors = 0;

      // Eliminar usuarios uno por uno
      for (const usuario of usuariosNoVerificados) {
        try {
          // Verificar que no sea super admin (doble verificación)
          if (usuario.rol?.nombre === 'super_admin') {
            continue;
          }

          // Eliminar usuario
          await prisma.usuario.delete({
            where: { id: usuario.id }
          });

          cleaned++;

        } catch (error) {
          errors++;
          console.error(`Error eliminando usuario ${usuario.email}:`, error);
        }
      }

      return { cleaned, errors };

    } catch (error) {
      console.error('Error en limpieza:', error);
      return { cleaned: 0, errors: 1 };
    }
  }

  // Obtener estadísticas de usuarios no verificados
  static async getUnverifiedUsersStats(): Promise<{
    totalUnverified: number;
    unverifiedOlderThan7Days: number;
    unverifiedOlderThan3Days: number;
    unverifiedToday: number;
  }> {
    try {
      const ahora = new Date();
      const hace3Dias = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000);
      const hace7Dias = new Date(ahora.getTime() - cleanupConfig.unverifiedUserCleanupDays * 24 * 60 * 60 * 1000);
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

      const [
        totalUnverified,
        unverifiedOlderThan7Days,
        unverifiedOlderThan3Days,
        unverifiedToday
      ] = await Promise.all([
        prisma.usuario.count({
          where: {
            emailVerificado: false,
            rol: { nombre: { not: 'super_admin' } }
          }
        }),
        prisma.usuario.count({
          where: {
            emailVerificado: false,
            createdAt: { lt: hace7Dias },
            rol: { nombre: { not: 'super_admin' } }
          }
        }),
        prisma.usuario.count({
          where: {
            emailVerificado: false,
            createdAt: { lt: hace3Dias },
            rol: { nombre: { not: 'super_admin' } }
          }
        }),
        prisma.usuario.count({
          where: {
            emailVerificado: false,
            createdAt: { gte: hoy },
            rol: { nombre: { not: 'super_admin' } }
          }
        })
      ]);

      return {
        totalUnverified,
        unverifiedOlderThan7Days,
        unverifiedOlderThan3Days,
        unverifiedToday
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalUnverified: 0,
        unverifiedOlderThan7Days: 0,
        unverifiedOlderThan3Days: 0,
        unverifiedToday: 0
      };
    }
  }

  // Obtener lista de usuarios no verificados
  static async getUnverifiedUsersList(limit: number = 50): Promise<{
    usuarios: Array<{
      id: string;
      nombre: string;
      email: string;
      createdAt: Date;
      diasSinVerificar: number;
    }>;
    total: number;
  }> {
    try {
      const ahora = new Date();
      const hace7Dias = new Date(ahora.getTime() - cleanupConfig.unverifiedUserCleanupDays * 24 * 60 * 60 * 1000);

      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          where: {
            emailVerificado: false,
            createdAt: { lt: hace7Dias },
            rol: { nombre: { not: 'super_admin' } }
          },
          select: {
            id: true,
            nombre: true,
            email: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' },
          take: limit
        }),
        prisma.usuario.count({
          where: {
            emailVerificado: false,
            createdAt: { lt: hace7Dias },
            rol: { nombre: { not: 'super_admin' } }
          }
        })
      ]);

      const usuariosConDias = usuarios.map(usuario => ({
        ...usuario,
        diasSinVerificar: Math.floor((ahora.getTime() - usuario.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        usuarios: usuariosConDias,
        total
      };
    } catch (error) {
      console.error('Error obteniendo lista de usuarios:', error);
      return {
        usuarios: [],
        total: 0
      };
    }
  }
}
