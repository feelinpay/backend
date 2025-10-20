import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Usuario, CreateUsuarioDto, UserLoginDto, UserRegistrationDto } from '../models/Usuario';
import { registerUserSchema, loginSchema, resetPasswordSchema, verifyOTPSchema } from '../validators/userValidators';
import { EmailService } from '../services/emailService';
import { ResponseHelper } from '../utils/responseHelper';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/responseMessages';

const prisma = new PrismaClient();

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validationResult = registerUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input
      }));
      
      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const userData = validationResult.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return ResponseHelper.conflict(res, ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Buscar el rol propietario
    const rolPropietario = await prisma.rol.findFirst({
      where: { nombre: 'propietario' }
    });

    if (!rolPropietario) {
      return ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Crear usuario
    const newUser = await prisma.usuario.create({
      data: {
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono,
        password: hashedPassword,
        rolId: rolPropietario.id,
        activo: true,
        emailVerificado: false,
        enPeriodoPrueba: true,
        diasPruebaRestantes: 3, // 3 días de prueba
        googleSpreadsheetId: uuidv4() // Generar ID único para Google Sheets
      },
      include: {
        rol: true
      }
    });

    // Generar código OTP para verificación de email
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email: newUser.email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        expiraEn: expiresAt,
        usado: false,
        intentos: 0,
        createdAt: new Date()
      }
    });

    // Enviar email de verificación
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      newUser.email, 
      codigo, 
      'EMAIL_VERIFICATION',
      newUser.nombre
    );

    if (!emailEnviado) {
      console.error('Error enviando email de verificación');
      return ResponseHelper.internalError(res, ERROR_MESSAGES.EMAIL_SERVICE_ERROR);
    }

    // Respuesta exitosa
    ResponseHelper.created(res, {
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        telefono: newUser.telefono,
        rol: newUser.rol.nombre,
        activo: newUser.activo,
        emailVerificado: newUser.emailVerificado,
        enPeriodoPrueba: newUser.enPeriodoPrueba,
        diasPruebaRestantes: newUser.diasPruebaRestantes,
        createdAt: newUser.createdAt
      },
      requiresEmailVerification: true
    }, SUCCESS_MESSAGES.REGISTER_SUCCESS);

  } catch (error) {
    console.error('Error en registro:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input
      }));
      
      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const { email, password } = validationResult.data;

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: true
      }
    });

    if (!user) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return ResponseHelper.forbidden(res, 'Usuario inactivo');
    }

    // Verificar si el email está verificado
    if (!user.emailVerificado) {
      // Generar código OTP para verificación
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Eliminar códigos OTP anteriores
      await prisma.otpCode.deleteMany({
        where: {
          email: user.email,
          tipo: 'LOGIN_VERIFICATION'
        }
      });

      // Crear nuevo código OTP
      await prisma.otpCode.create({
        data: {
          id: uuidv4(),
          email: user.email,
          codigo,
          tipo: 'LOGIN_VERIFICATION',
          expiraEn: expiresAt,
          usado: false,
          intentos: 0,
          createdAt: new Date()
        }
      });

      // Enviar email con OTP
      const emailService = new EmailService();
      const emailEnviado = await emailService.sendOTPEmail(
        user.email, 
        codigo, 
        'LOGIN_VERIFICATION',
        user.nombre
      );

      if (!emailEnviado) {
        console.error('Error enviando email de verificación');
        return ResponseHelper.internalError(res, ERROR_MESSAGES.EMAIL_SERVICE_ERROR);
      }

      return ResponseHelper.success(res, {
        requiresOTP: true,
        email: user.email
      }, SUCCESS_MESSAGES.OTP_SENT);
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol.nombre },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    ResponseHelper.success(res, {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol.nombre,
        emailVerificado: user.emailVerificado,
        enPeriodoPrueba: user.enPeriodoPrueba,
        diasPruebaRestantes: user.diasPruebaRestantes,
        activo: user.activo,
        createdAt: user.createdAt
      },
      token,
      requiresOTP: false
    }, SUCCESS_MESSAGES.LOGIN_SUCCESS);

  } catch (error) {
    console.error('Error en login:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Verificar OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyOTPSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input
      }));
      
      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const { email, codigo, tipo } = validationResult.data;

    // Buscar código OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo,
        usado: false,
        expiraEn: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.OTP_INVALID);
    }

    // Marcar código como usado
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usado: true }
    });

    // Si es verificación de email, marcar usuario como verificado
    if (tipo === 'EMAIL_VERIFICATION') {
      await prisma.usuario.update({
        where: { email },
        data: { emailVerificado: true }
      });
    }

    ResponseHelper.success(res, {
      verified: true,
      type: tipo
    }, SUCCESS_MESSAGES.OTP_VERIFIED);

  } catch (error) {
    console.error('Error verificando OTP:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Reenviar OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email, tipo } = req.body;

    if (!email || !tipo) {
      return ResponseHelper.validationError(res, [
        { field: 'email', message: ERROR_MESSAGES.REQUIRED_FIELD },
        { field: 'tipo', message: ERROR_MESSAGES.REQUIRED_FIELD }
      ], ERROR_MESSAGES.VALIDATION_ERROR);
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!user) {
      return ResponseHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Generar nuevo código OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Eliminar códigos anteriores
    await prisma.otpCode.deleteMany({
      where: {
        email,
        tipo
      }
    });

    // Crear nuevo código
    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email,
        codigo,
        tipo,
        expiraEn: expiresAt,
        usado: false,
        intentos: 0,
        createdAt: new Date()
      }
    });

    // Enviar email
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      email, 
      codigo, 
      tipo,
      user.nombre
    );

    if (!emailEnviado) {
      return ResponseHelper.internalError(res, ERROR_MESSAGES.EMAIL_SERVICE_ERROR);
    }

    ResponseHelper.success(res, {
      sent: true,
      email,
      type: tipo
    }, SUCCESS_MESSAGES.OTP_SENT);

  } catch (error) {
    console.error('Error reenviando OTP:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Olvidar contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ResponseHelper.validationError(res, [
        { field: 'email', message: ERROR_MESSAGES.REQUIRED_FIELD }
      ], ERROR_MESSAGES.VALIDATION_ERROR);
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!user) {
      return ResponseHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Generar código OTP para reset de contraseña
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Eliminar códigos anteriores
    await prisma.otpCode.deleteMany({
      where: {
        email,
        tipo: 'PASSWORD_RESET'
      }
    });

    // Crear nuevo código
    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email,
        codigo,
        tipo: 'PASSWORD_RESET',
        expiraEn: expiresAt,
        usado: false,
        intentos: 0,
        createdAt: new Date()
      }
    });

    // Enviar email
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      email, 
      codigo, 
      'PASSWORD_RESET',
      user.nombre
    );

    if (!emailEnviado) {
      return ResponseHelper.internalError(res, ERROR_MESSAGES.EMAIL_SERVICE_ERROR);
    }

    ResponseHelper.success(res, {
      sent: true,
      email
    }, SUCCESS_MESSAGES.OTP_SENT);

  } catch (error) {
    console.error('Error en olvidar contraseña:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Resetear contraseña
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input
      }));
      
      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const { email, codigo, newPassword } = validationResult.data;

    // Verificar código OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo: 'PASSWORD_RESET',
        usado: false,
        expiraEn: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.OTP_INVALID);
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Marcar código como usado
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usado: true }
    });

    ResponseHelper.success(res, {
      reset: true
    }, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};
