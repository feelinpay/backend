import { limpiarCodigosExpirados } from '../services/otpService';
import { PrismaClient } from '@prisma/client';
import { getCleanupConfig } from '../config/appConfig';

const prisma = new PrismaClient();
const cleanupConfig = getCleanupConfig();

// Tarea programada para limpiar OTPs y reiniciar intentos
export class OtpCleanupJob {
  private static intervalId: NodeJS.Timeout | null = null;

  // Iniciar tarea programada
  static start() {
    console.log('🔄 Iniciando tarea de limpieza OTP...');
    
    // Limpiar OTPs expirados según configuración
    this.intervalId = setInterval(async () => {
      try {
        console.log('🧹 Ejecutando limpieza de OTPs expirados...');
        await limpiarCodigosExpirados();
      } catch (error) {
        console.error('Error en limpieza de OTPs:', error);
      }
    }, cleanupConfig.otpCleanupIntervalMinutes * 60 * 1000);

    // Reiniciar intentos diarios cada 24 horas
    setInterval(async () => {
      try {
        console.log('🔄 Ejecutando reinicio de intentos diarios...');
        await this.resetearIntentosDiarios();
      } catch (error) {
        console.error('Error reiniciando intentos diarios:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

    console.log('✅ Tarea de limpieza OTP iniciada correctamente');
  }

  // Detener tarea programada
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Tarea de limpieza OTP detenida');
    }
  }

  // Ejecutar limpieza manual
  static async ejecutarLimpieza() {
    try {
      console.log('🧹 Ejecutando limpieza manual...');
      await limpiarCodigosExpirados();
      await this.resetearIntentosDiarios();
      console.log('✅ Limpieza manual completada');
    } catch (error) {
      console.error('Error en limpieza manual:', error);
      throw error;
    }
  }

  // Resetear intentos diarios de OTP
  private static async resetearIntentosDiarios(): Promise<void> {
    try {
      const resultado = await prisma.usuario.updateMany({
        where: {
          otpAttemptsToday: { gt: 0 }
        },
        data: {
          otpAttemptsToday: 0
        }
      });

      console.log(`🔄 Intentos diarios reseteados para ${resultado.count} usuarios`);
    } catch (error) {
      console.error('Error reseteando intentos diarios:', error);
      throw error;
    }
  }
}