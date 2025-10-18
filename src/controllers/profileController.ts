import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { generateOTP } from '../services/otpService';
import { EmailService } from '../services/emailService';
import { updateUserSchema } from '../validators/userValidators';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const otpRepository = new OTPRepository(prisma);

// Obtener perfil del usuario autenticado
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const user = await userRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Remover datos sensibles
    const { password, ...userProfile } = user;

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil del usuario
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar datos con Zod
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const updateData = validationResult.data;
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si se está cambiando el email, verificar que no esté en uso
    if (updateData.email && updateData.email !== currentUser.email) {
      const existingUser = await userRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        });
      }

      // Generar OTP para verificar nuevo email
      const codigo = generateOTP();
      const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      await otpRepository.create({
        email: updateData.email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        expiraEn,
        // metadata removed - using direct fields
      });

      // Enviar email con OTP
      const emailService = new EmailService();
      await emailService.sendOTPEmail(updateData.email, codigo, 'EMAIL_VERIFICATION', currentUser.nombre);

      return res.json({
        success: true,
        message: 'Se ha enviado un código de verificación al nuevo email',
        requiresOTP: true,
        newEmail: updateData.email
      });
    }

    // Si no hay cambio de email, actualizar directamente
    const updatedUser = await userRepository.update(userId, updateData);

    // Remover datos sensibles
    const { password, ...userProfile } = updatedUser;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: userProfile
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar OTP para cambio de email
export const verifyEmailChange = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { email, codigo } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    // Obtener usuario actual
    const currentUser = await userRepository.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar OTP
    const otp = await otpRepository.findByEmailAndCode(email, codigo, 'EMAIL_VERIFICATION');

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido o expirado'
      });
    }

    // Verificar que el OTP pertenece al usuario
    // metadata removed - using direct fields
    if (otp.email !== currentUser.email) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP no válido para este usuario'
      });
    }

    // Actualizar email del usuario
    const updatedUser = await userRepository.update(userId, {
      email,
      emailVerificado: true,
      emailVerificadoAt: new Date()
    });

    // Marcar OTP como usado
    await otpRepository.markAsUsed(otp.id);

    // Remover datos sensibles
    const { password, ...userProfile } = updatedUser;

    res.json({
      success: true,
      message: 'Email actualizado y verificado exitosamente',
      data: userProfile
    });
  } catch (error) {
    console.error('Error verificando cambio de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await userRepository.update(userId, {
      password: hashedNewPassword
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener información de licencia del usuario
export const getLicenseInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const user = await userRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Calcular días restantes
    let diasRestantes = 0;
    let fechaExpiracion = null;
    let estadoLicencia = 'inactiva';

    // licenciaActiva and fechaExpiracionLicencia removed from schema - using membership system
    if (false) {
      // This logic will be replaced with membership verification
    } else if (user.enPeriodoPrueba && user.diasPruebaRestantes) {
      diasRestantes = user.diasPruebaRestantes;
      estadoLicencia = 'prueba';
    }

    // Si es super admin, acceso ilimitado
    if (user.rol?.nombre === 'super_admin') {
      diasRestantes = -1; // -1 indica acceso ilimitado
      estadoLicencia = 'ilimitado';
    }

    res.json({
      success: true,
      data: {
        estadoLicencia,
        diasRestantes,
        fechaExpiracion,
        enPeriodoPrueba: user.enPeriodoPrueba,
        // licenciaActiva removed from schema
        fechaInicioPrueba: user.fechaInicioPrueba,
        esSuperAdmin: user.rol?.nombre === 'super_admin'
      }
    });
  } catch (error) {
    console.error('Error obteniendo información de licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
