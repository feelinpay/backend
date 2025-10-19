import { OtpCleanupJob } from './otpCleanupJob';
import { UserCleanupJob } from './userCleanupJob';

export class Scheduler {
  // Inicializar tareas programadas esenciales
  static init() {
    console.log('Iniciando sistema de tareas programadas...');

    try {
      // Solo jobs esenciales: OTP y usuarios no verificados
      OtpCleanupJob.start();
      UserCleanupJob.init();

      console.log('Sistema de tareas programadas iniciado correctamente');
    } catch (error) {
      console.error('Error al inicializar tareas programadas:', error);
    }
  }

}
