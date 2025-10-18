import cron from 'node-cron';
import { TrialService } from '../services/trialService';

export class TrialUpdateJob {
  // Actualizar períodos de prueba
  static init() {
    console.log('🧹 Iniciando tarea de actualización de períodos de prueba...');

    // Cada día a las 1:00 AM
    cron.schedule('0 1 * * *', async () => {
      try {
        console.log('🔄 [Trial Update] Actualizando períodos de prueba...');
        
        const usuariosActualizados = await TrialService.actualizarDiasPrueba();
        
        if (usuariosActualizados > 0) {
          console.log(`✅ [Trial Update] Actualizados ${usuariosActualizados} períodos de prueba`);
        } else {
          console.log('✅ [Trial Update] No hay períodos de prueba para actualizar');
        }

      } catch (error) {
        console.error('❌ [Trial Update] Error al actualizar períodos de prueba:', error);
      }
    });

    console.log('✅ [Trial Update] Tarea programada diariamente a las 1:00 AM');
  }

  // Ejecutar actualización manual
  static async ejecutarActualizacionManual(): Promise<{
    actualizados: number;
    mensaje: string;
  }> {
    try {
      console.log('🔄 [Trial Update Manual] Ejecutando actualización manual...');
      
      const actualizados = await TrialService.actualizarDiasPrueba();
      
      return {
        actualizados,
        mensaje: `Se actualizaron ${actualizados} períodos de prueba`
      };
    } catch (error) {
      console.error('❌ [Trial Update Manual] Error:', error);
      return {
        actualizados: 0,
        mensaje: 'Error al actualizar períodos de prueba'
      };
    }
  }

  // Obtener estadísticas de períodos de prueba
  static async obtenerEstadisticas() {
    try {
      return await TrialService.obtenerEstadisticasPrueba();
    } catch (error) {
      console.error('❌ [Trial Stats] Error al obtener estadísticas:', error);
      return {
        usuariosEnPrueba: 0,
        usuariosConPruebaExpirada: 0,
        usuariosConPruebaPorExpiar: 0,
        totalUsuariosNuevos: 0
      };
    }
  }
}
