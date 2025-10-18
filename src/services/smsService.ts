import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SmsService {
  /**
   * Enviar SMS a empleados sobre pago recibido
   */
  static async enviarSmsPago({
    propietarioId,
    nombrePagador,
    monto,
    codigoSeguridad,
    fechaPago
  }: {
    propietarioId: string;
    nombrePagador: string;
    monto: number;
    codigoSeguridad: string;
    fechaPago: Date;
  }): Promise<{
    success: boolean;
    enviados: number;
    errores: number;
    error?: string;
  }> {
    try {
      // Obtener empleados del propietario
      const empleados = await prisma.empleado.findMany({
        where: {
          propietarioId,
          activo: true
        },
        select: {
          id: true,
          telefono: true,
        }
      });

      if (empleados.length === 0) {
        return {
          success: false,
          enviados: 0,
          errores: 0,
          error: 'No hay empleados registrados para notificar'
        };
      }

      // Obtener información del propietario
      const propietario = await prisma.usuario.findUnique({
        where: { id: propietarioId },
        select: { nombre: true }
      });

      if (!propietario) {
        return {
          success: false,
          enviados: 0,
          errores: 0,
          error: 'Propietario no encontrado'
        };
      }

      // Crear mensaje de notificación
      const mensaje = this.crearMensajeNotificacion({
        nombrePagador,
        monto,
        codigoSeguridad,
        fechaPago,
        nombrePropietario: propietario.nombre
      });

      let enviados = 0;
      let errores = 0;

      // Enviar SMS a cada empleado
      for (const empleado of empleados) {
        try {
          const resultado = await this.enviarSmsIndividual({
            telefono: empleado.telefono,
            mensaje,
            empleadoNombre: 'Empleado'
          });

          if (resultado.success) {
            enviados++;
            console.log(`✅ SMS enviado a Empleado (${empleado.telefono})`);
          } else {
            errores++;
            console.error(`❌ Error enviando SMS a Empleado: ${resultado.error}`);
          }
        } catch (error) {
          errores++;
          console.error(`❌ Error enviando SMS a Empleado:`, error);
        }
      }

      // No se necesita descontar saldo ya que todo se maneja en Google Sheets

      return {
        success: enviados > 0,
        enviados,
        errores
      };
    } catch (error) {
      console.error('Error al enviar SMS:', error);
      return {
        success: false,
        enviados: 0,
        errores: 0,
        error: 'Error interno al enviar SMS'
      };
    }
  }

  /**
   * Crear mensaje de notificación personalizado
   */
  private static crearMensajeNotificacion({
    nombrePagador,
    monto,
    codigoSeguridad,
    fechaPago,
    nombrePropietario
  }: {
    nombrePagador: string;
    monto: number;
    codigoSeguridad: string;
    fechaPago: Date;
    nombrePropietario: string;
  }): string {
    const fecha = fechaPago.toLocaleDateString('es-PE');
    const hora = fechaPago.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `🔔 NOTIFICACIÓN DE PAGO YAPE

📱 ${nombrePropietario} recibió un pago Yape:

👤 Pagador: ${nombrePagador}
💰 Monto: S/ ${monto.toFixed(2)}
🔢 Código: ${codigoSeguridad}
📅 Fecha: ${fecha} a las ${hora}

✅ Este es un pago REAL, no es fraude.

---
Feelin Pay - Sistema Anti-Fraude Yape`;
  }

  /**
   * Enviar SMS individual (simulado)
   */
  private static async enviarSmsIndividual({
    telefono,
    mensaje,
    empleadoNombre
  }: {
    telefono: string;
    mensaje: string;
    empleadoNombre: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Simular envío de SMS
      console.log(`📱 Enviando SMS a ${empleadoNombre}:`);
      console.log(`   📞 Teléfono: ${telefono}`);
      console.log(`   📝 Mensaje: ${mensaje.substring(0, 100)}...`);
      console.log(`   ✅ SMS enviado exitosamente`);

      // En un sistema real, aquí integrarías con un proveedor de SMS
      // como Twilio, AWS SNS, o un proveedor local

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al enviar SMS individual'
      };
    }
  }

  /**
   * Verificar disponibilidad para SMS (sin saldo)
   */
  static async verificarDisponibilidadSms(propietarioId: string, cantidadEmpleados: number): Promise<{
    puedeEnviar: boolean;
    mensaje?: string;
  }> {
    try {
      const propietario = await prisma.usuario.findUnique({
        where: { id: propietarioId },
        select: { nombre: true, activo: true }
      });

      if (!propietario) {
        return {
          puedeEnviar: false,
          mensaje: 'Propietario no encontrado'
        };
      }

      if (!propietario.activo) {
        return {
          puedeEnviar: false,
          mensaje: 'Propietario desactivado'
        };
      }

      // Verificar membresía activa (implementar lógica de membresía)
      // Por ahora permitir envío si el usuario está activo

      return {
        puedeEnviar: true,
        mensaje: `Puede enviar SMS a ${cantidadEmpleados} empleados`
      };
    } catch (error) {
      console.error('Error al verificar disponibilidad SMS:', error);
      return {
        puedeEnviar: false,
        mensaje: 'Error al verificar disponibilidad'
      };
    }
  }

  /**
   * Obtener historial de SMS enviados
   */
  static async obtenerHistorialSms(propietarioId: string, limite: number = 50): Promise<{
    success: boolean;
    historial?: any[];
    error?: string;
  }> {
    try {
      // Obtener pagos con SMS enviados
      const pagosConSms = await prisma.pago.findMany({
        where: {
          propietarioId,
          notificadoEmpleados: true
        },
        orderBy: { fecha: 'desc' },
        take: limite,
        select: {
          id: true,
          monto: true,
          fecha: true,
          codigoSeguridad: true,
          nombrePagador: true,
          numeroTelefono: true
        }
      });

      const historial = pagosConSms.map(pago => ({
        fecha: pago.fecha.toLocaleDateString('es-PE'),
        hora: pago.fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        pagador: pago.nombrePagador,
        monto: pago.monto.toFixed(2),
        codigoSeguridad: pago.codigoSeguridad,
        telefonoPagador: pago.numeroTelefono || ''
      }));

      return {
        success: true,
        historial
      };
    } catch (error) {
      console.error('Error al obtener historial SMS:', error);
      return {
        success: false,
        error: 'Error al obtener historial SMS'
      };
    }
  }

  /**
   * Recargar saldo del propietario
   */
  static async recargarSaldo(propietarioId: string, monto: number): Promise<{
    success: boolean;
    nuevoSaldo?: number;
    error?: string;
  }> {
    try {
      const propietario = await prisma.usuario.findUnique({
        where: { id: propietarioId },
        select: { id: true, nombre: true }
      });

      if (!propietario) {
        return {
          success: false,
          error: 'Propietario no encontrado'
        };
      }

      // En este sistema no manejamos saldo, se maneja en Google Sheets
      const nuevoSaldo = 0;

      await prisma.usuario.update({
        where: { id: propietarioId },
        data: { }
      });

      console.log(`💰 Saldo recargado para propietario ${propietarioId}:`);
      console.log(`   - Sistema de saldo no implementado (se maneja en Google Sheets)`);
      console.log(`   - Recarga simulada: S/ ${monto.toFixed(2)}`);

      return {
        success: true,
        nuevoSaldo
      };
    } catch (error) {
      console.error('Error al recargar saldo:', error);
      return {
        success: false,
        error: 'Error al recargar saldo'
      };
    }
  }
}
