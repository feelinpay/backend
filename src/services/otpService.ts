import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './emailService';

const prisma = new PrismaClient();

// Generar código OTP de 6 dígitos
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Verificar límites de intentos diarios usando la tabla usuarios
export const verificarLimitesIntentos = async (email: string): Promise<{ permitido: boolean; mensaje?: string }> => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return { permitido: false, mensaje: 'Usuario no encontrado' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Verificar si es un nuevo día
    if (usuario.lastOtpAttemptDate) {
      const ultimoIntento = new Date(usuario.lastOtpAttemptDate);
      const esNuevoDia = ultimoIntento < hoy;
      
      if (esNuevoDia) {
        // Resetear contador para nuevo día
        await prisma.usuario.update({
          where: { email },
          data: { otpAttemptsToday: 0 }
        });
        return { permitido: true };
      }
    }

    // Verificar límite de 5 intentos por día
    if (usuario.otpAttemptsToday >= 5) {
      return { 
        permitido: false, 
        mensaje: 'Has excedido el límite de 5 códigos OTP por día. Intenta mañana.' 
      };
    }

    return { permitido: true };
  } catch (error) {
    console.error('Error verificando límites de intentos:', error);
    return { permitido: false, mensaje: 'Error interno del servidor' };
  }
};

// Crear código OTP
export const crearCodigoOTP = async (email: string, tipo: string): Promise<{ codigo: string; expiraEn: Date }> => {
  try {
    // Verificar límites primero
    const limiteVerificado = await verificarLimitesIntentos(email);
    if (!limiteVerificado.permitido) {
      throw new Error(limiteVerificado.mensaje || 'Límite de intentos excedido');
    }

    // Eliminar OTP anterior si existe
    await prisma.otpCode.deleteMany({
      where: { email }
    });

    // Generar nuevo código
    const codigo = generateOTP();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Crear nuevo OTP
    await prisma.otpCode.create({
      data: {
        email,
        codigo,
        tipo,
        expiraEn,
        usado: false,
        intentos: 0,
        maxIntentos: 3
      }
    });

    // Actualizar contador de intentos del usuario
    await prisma.usuario.update({
      where: { email },
      data: {
        otpAttemptsToday: { increment: 1 },
        lastOtpAttemptDate: new Date()
      }
    });

    return { codigo, expiraEn };
  } catch (error) {
    console.error('Error creando código OTP:', error);
    throw error;
  }
};

// Verificar código OTP
export const verificarCodigoOTP = async (email: string, codigo: string, tipo: string): Promise<{ valido: boolean; mensaje?: string }> => {
  try {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo,
        usado: false,
        expiraEn: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return { valido: false, mensaje: 'Código OTP inválido o expirado' };
    }

    // Verificar intentos
    if (otpRecord.intentos >= otpRecord.maxIntentos) {
      return { valido: false, mensaje: 'Código OTP bloqueado por exceso de intentos' };
    }

    return { valido: true };
  } catch (error) {
    console.error('Error verificando código OTP:', error);
    return { valido: false, mensaje: 'Error interno del servidor' };
  }
};

// Marcar código OTP como usado
export const marcarCodigoUsado = async (email: string, codigo: string): Promise<void> => {
  try {
    await prisma.otpCode.updateMany({
      where: { email, codigo },
      data: { usado: true }
    });
  } catch (error) {
    console.error('Error marcando código como usado:', error);
    throw error;
  }
};

// Incrementar intentos de verificación
export const incrementarIntentosVerificacion = async (email: string, codigo: string): Promise<void> => {
  try {
    await prisma.otpCode.updateMany({
      where: { email, codigo },
      data: { intentos: { increment: 1 } }
    });
  } catch (error) {
    console.error('Error incrementando intentos:', error);
    throw error;
  }
};

// Enviar OTP por email
export const sendOTPEmail = async (email: string, codigo: string, tipo: string, nombreUsuario?: string): Promise<boolean> => {
  try {
    const emailService = new EmailService();
    return await emailService.sendOTPEmail(email, codigo, tipo, nombreUsuario);
  } catch (error) {
    console.error('Error enviando email OTP:', error);
    return false;
  }
};

// Limpiar códigos OTP expirados
export const limpiarCodigosExpirados = async (): Promise<number> => {
  try {
    const resultado = await prisma.otpCode.deleteMany({
      where: {
        expiraEn: { lt: new Date() }
      }
    });
    
    console.log(`🧹 Códigos OTP expirados eliminados: ${resultado.count}`);
    return resultado.count;
  } catch (error) {
    console.error('Error limpiando códigos expirados:', error);
    return 0;
  }
};

// Obtener estadísticas de OTP
export const obtenerEstadisticasOTP = async (): Promise<{ total: number; activos: number; expirados: number }> => {
  try {
    const total = await prisma.otpCode.count();
    const activos = await prisma.otpCode.count({
      where: {
        usado: false,
        expiraEn: { gt: new Date() }
      }
    });
    const expirados = total - activos;

    return { total, activos, expirados };
  } catch (error) {
    console.error('Error obteniendo estadísticas OTP:', error);
    return { total: 0, activos: 0, expirados: 0 };
  }
};