import { Request, Response } from 'express';
import prisma from '../config/database';

// Obtener estado de intentos OTP para un email
export const getOtpStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Obtener usuario y sus intentos OTP
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        otpAttemptsToday: true,
        lastOtpAttemptDate: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener OTPs activos
    const otpsActivos = await prisma.otpCode.findMany({
      where: {
        email,
        expiraEn: { gt: new Date() },
        usado: false
      },
      select: {
        tipo: true,
        expiraEn: true,
        intentos: true,
        maxIntentos: true
      }
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const esNuevoDia = !usuario.lastOtpAttemptDate || new Date(usuario.lastOtpAttemptDate) < hoy;

    res.json({
      success: true,
      data: {
        email,
        intentosHoy: usuario.otpAttemptsToday,
        maxIntentosDiarios: 5,
        bloqueado: usuario.otpAttemptsToday >= 5,
        esNuevoDia,
        otpsActivos: otpsActivos.map(otp => ({
          tipo: otp.tipo,
          intentos: otp.intentos,
          maxIntentos: otp.maxIntentos,
          expiraEn: otp.expiraEn,
          tiempoRestante: Math.max(0, Math.floor((otp.expiraEn.getTime() - Date.now()) / 1000 / 60))
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Resetear intentos para un email (solo para testing)
export const resetOtpAttempts = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Esta función no está disponible en producción' });
    }

    await prisma.usuario.update({
      where: { email },
      data: {
        otpAttemptsToday: 0,
        lastOtpAttemptDate: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Intentos OTP reseteados correctamente'
    });
  } catch (error) {
    console.error('Error reseteando intentos OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};