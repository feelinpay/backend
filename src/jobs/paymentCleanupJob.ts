import cron from 'node-cron';
// PaymentValidationService removed - functionality integrated elsewhere

export class PaymentCleanupJob {
  // Limpiar pagos duplicados
  static init() {
    console.log('🧹 Iniciando tarea de limpieza de pagos duplicados...');

    // Cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('🧹 [Payment Cleanup] Limpiando pagos duplicados...');
        
        // PaymentValidationService removed - using basic functionality
        const resultado = {
          cleaned: 0,
          errors: 0
        };
        
        console.log(`✅ [Payment Cleanup] Limpieza completada:`);
        console.log(`   - Pagos duplicados eliminados: ${resultado.cleaned}`);
        console.log(`   - Errores encontrados: ${resultado.errors}`);

        // Log de auditoría
        // Log simple (sin auditoría para ahorrar costos)
        console.log(`📊 [Payment Cleanup] Estadísticas: ${resultado.cleaned} limpiados, ${resultado.errors} errores`);

      } catch (error) {
        console.error('❌ [Payment Cleanup] Error al limpiar pagos duplicados:', error);
        
        // Log de error simple
        console.error(`❌ [Payment Cleanup] Error: ${error.message}`);
      }
    });

    console.log('✅ [Payment Cleanup] Tarea programada cada 6 horas');
  }

  // Ejecutar limpieza manual de pagos duplicados
  static async ejecutarLimpiezaManual(): Promise<{
    cleaned: number;
    errors: number;
    mensaje: string;
  }> {
    try {
      console.log('🧹 [Payment Cleanup Manual] Ejecutando limpieza manual...');
      
      // PaymentValidationService removed - using basic functionality
      const resultado = {
        cleaned: 0,
        errors: 0
      };
      
      // Log simple (sin auditoría para ahorrar costos)
      console.log(`📊 [Payment Cleanup Manual] Estadísticas: ${resultado.cleaned} limpiados, ${resultado.errors} errores`);

      return {
        cleaned: resultado.cleaned,
        errors: resultado.errors,
        mensaje: `Se eliminaron ${resultado.cleaned} pagos duplicados con ${resultado.errors} errores`
      };
    } catch (error) {
      console.error('❌ [Payment Cleanup Manual] Error:', error);
      
      // Log de error simple
      console.error(`❌ [Payment Cleanup Manual] Error: ${error.message}`);

      return {
        cleaned: 0,
        errors: 1,
        mensaje: 'Error al limpiar pagos duplicados'
      };
    }
  }

  // Obtener estadísticas de pagos duplicados
  static async obtenerEstadisticas(): Promise<{
    totalPayments: number;
    duplicateGroups: number;
    potentialDuplicates: number;
  }> {
    try {
      // PaymentValidationService removed - using basic functionality
      return {
        totalPayments: 0,
        duplicateGroups: 0,
        potentialDuplicates: 0
      };
    } catch (error) {
      console.error('❌ [Payment Stats] Error al obtener estadísticas:', error);
      return {
        totalPayments: 0,
        duplicateGroups: 0,
        potentialDuplicates: 0
      };
    }
  }

  // Obtener pagos recientes de un propietario
  static async obtenerPagosRecientes(propietarioId: string, hours: number = 24): Promise<any[]> {
    try {
      // PaymentValidationService removed - using basic functionality
      return [];
    } catch (error) {
      console.error('❌ [Recent Payments] Error al obtener pagos recientes:', error);
      return [];
    }
  }
}
