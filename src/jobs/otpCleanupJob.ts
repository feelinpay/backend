import { limpiarCodigosExpirados } from '../services/otpService';

// Tarea programada para limpiar OTPs y reiniciar intentos
export class OtpCleanupJob {
  private static intervalId: NodeJS.Timeout | null = null;

  // Iniciar tarea programada
  static start() {
    console.log('🔄 Iniciando tarea de limpieza OTP...');
    
    // Limpiar OTPs expirados cada 30 minutos
    this.intervalId = setInterval(async () => {
      try {
        console.log('🧹 Ejecutando limpieza de OTPs expirados...');
        await limpiarCodigosExpirados();
      } catch (error) {
        console.error('Error en limpieza de OTPs:', error);
      }
    }, 30 * 60 * 1000); // 30 minutos

    // Reiniciar intentos diarios cada 24 horas
    setInterval(async () => {
      try {
        console.log('🔄 Ejecutando reinicio de intentos diarios...');
        // limpiarIntentosDiarios removed - using membership system
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
      // limpiarIntentosDiarios removed - using membership system
      console.log('✅ Limpieza manual completada');
    } catch (error) {
      console.error('Error en limpieza manual:', error);
      throw error;
    }
  }
}