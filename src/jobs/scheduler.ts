import { OtpCleanupJob } from './otpCleanupJob';
import { PaymentCleanupJob } from './paymentCleanupJob';
import { UserCleanupJob } from './userCleanupJob';

export class Scheduler {
  // Inicializar todas las tareas programadas
  static init() {
    console.log('🚀 Iniciando sistema de tareas programadas...');

    try {
      // Inicializar jobs
      OtpCleanupJob.start();
      PaymentCleanupJob.init();
      UserCleanupJob.init();

      console.log('✅ Sistema de tareas programadas iniciado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar tareas programadas:', error);
    }
  }

  // Ejecutar limpieza manual de códigos OTP
  static async limpiarCodigosOTP() {
    return await OtpCleanupJob.ejecutarLimpieza();
  }

  // Ejecutar limpieza manual de usuarios no verificados
  static async limpiarUsuariosNoVerificados() {
    return await UserCleanupJob.cleanupUnverifiedUsersManual();
  }

  // Ejecutar limpieza manual de pagos duplicados
  static async limpiarPagosDuplicados() {
    return await PaymentCleanupJob.ejecutarLimpiezaManual();
  }

  // Ejecutar limpieza manual de usuarios no verificados (7 días)
  static async limpiarUsuariosNoVerificados7Dias() {
    return await UserCleanupJob.cleanupUnverifiedUsersManual();
  }

  // Obtener estadísticas generales
  static async obtenerEstadisticas() {
    try {
      const [paymentStats, userStats] = await Promise.all([
        PaymentCleanupJob.obtenerEstadisticas(),
        UserCleanupJob.getUnverifiedUsersStats()
      ]);

      const otpStats = {
        otpsEliminados: 0,
        intentosReiniciados: 0,
        ultimaLimpieza: new Date().toISOString()
      };

      return {
        otp: otpStats,
        pagos: paymentStats,
        usuarios: userStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return null;
    }
  }
}
