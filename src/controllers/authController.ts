import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Usuario, CreateUsuarioDto, UserLoginDto, UserRegistrationDto } from '../models/Usuario';
import { registerUserSchema, loginSchema, resetPasswordSchema, verifyOTPSchema } from '../validators/userValidators';
import { EmailService } from '../services/emailService';

const prisma = new PrismaClient();

// El middleware de autenticación ya existe en src/middleware/auth.ts

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validationResult = registerUserSchema.safeParse(req.body);
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

    const userData = validationResult.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Buscar el rol propietario
    const rolPropietario = await prisma.rol.findFirst({
      where: { nombre: 'propietario' }
    });

    if (!rolPropietario) {
      return res.status(500).json({
        success: false,
        message: 'Error del servidor: Rol propietario no encontrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Crear usuario usando el DTO
    const createData: CreateUsuarioDto = {
      nombre: userData.nombre,
      email: userData.email,
      telefono: userData.telefono,
      password: hashedPassword,
      rolId: rolPropietario.id, // ID dinámico del rol propietario
      googleSpreadsheetId: '',
      activo: true,
      emailVerificado: false,
      enPeriodoPrueba: true,
      diasPruebaRestantes: 3
    };

    const user = await prisma.usuario.create({
      data: createData
    });

    // Verificar intentos OTP diarios para el nuevo usuario
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar límite de intentos (máximo 5 por día)
    const maxAttempts = 5;
    if (user.otpAttemptsToday >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Has excedido el límite de intentos OTP diarios (${maxAttempts}). Intenta mañana.`
      });
    }

    // Generar código OTP para verificación de email
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Eliminar OTPs anteriores del mismo tipo
    await prisma.otpCode.deleteMany({
      where: { 
        email: userData.email,
        tipo: 'EMAIL_VERIFICATION'
      }
    });

    // Crear nuevo OTP
    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email: userData.email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        expiraEn: expiresAt,
        usado: false
      }
    });

    // Incrementar contador de intentos
    await prisma.usuario.update({
      where: { id: user.id },
      data: { 
        otpAttemptsToday: user.otpAttemptsToday + 1,
        lastOtpAttemptDate: today
      }
    });

    // Enviar email con OTP
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      userData.email, 
      codigo, 
      'EMAIL_VERIFICATION',
      userData.nombre
    );

    if (!emailEnviado) {
      console.error('Error enviando email de verificación');
      return res.status(500).json({
        success: false,
        message: 'Error enviando el código de verificación'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Se ha enviado un código de verificación a tu email.',
      data: { 
        userId: user.id,
        requiresOTP: true,
        email: userData.email
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validationResult = loginSchema.safeParse(req.body);
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

    const loginData = validationResult.data;

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email: loginData.email },
      include: { rol: true }
    });

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el email está verificado
    if (!user.emailVerificado) {
      // Verificar intentos OTP diarios
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastAttemptDate = user.lastOtpAttemptDate ? new Date(user.lastOtpAttemptDate) : null;
      const isNewDay = !lastAttemptDate || lastAttemptDate < today;
      
      // Si es un nuevo día, resetear contador
      if (isNewDay) {
        await prisma.usuario.update({
          where: { id: user.id },
          data: { 
            otpAttemptsToday: 0,
            lastOtpAttemptDate: today
          }
        });
        user.otpAttemptsToday = 0;
      }
      
      // Verificar límite de intentos (máximo 5 por día)
      const maxAttempts = 5;
      if (user.otpAttemptsToday >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: `Has excedido el límite de intentos OTP diarios (${maxAttempts}). Intenta mañana.`
        });
      }

      // Generar código OTP para verificación de login
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Eliminar OTPs anteriores del mismo tipo
      await prisma.otpCode.deleteMany({
        where: { 
          email: user.email,
          tipo: 'LOGIN_VERIFICATION'
        }
      });

      // Crear nuevo OTP
      await prisma.otpCode.create({
        data: {
          id: uuidv4(),
          email: user.email,
          codigo,
          tipo: 'LOGIN_VERIFICATION',
          expiraEn: expiresAt,
          usado: false
        }
      });

      // Incrementar contador de intentos
      await prisma.usuario.update({
        where: { id: user.id },
        data: { 
          otpAttemptsToday: user.otpAttemptsToday + 1,
          lastOtpAttemptDate: today
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
        return res.status(500).json({
          success: false,
          message: 'Error enviando el código de verificación'
        });
      }

      return res.json({
        success: true,
        message: 'Se ha enviado un código de verificación a tu email',
        data: {
          requiresOTP: true,
          email: user.email
        }
      });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol.nombre },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol.nombre,
          emailVerificado: user.emailVerificado,
          enPeriodoPrueba: user.enPeriodoPrueba,
          diasPruebaRestantes: user.diasPruebaRestantes
        },
        token,
        requiresOTP: false
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Verificar OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, codigo } = req.body;

    // Buscar OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        usado: false,
        expiraEn: { gt: new Date() }
      }
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido o expirado'
      });
    }

    // Marcar OTP como usado
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usado: true }
    });

    // Marcar email como verificado
    await prisma.usuario.update({
      where: { email },
      data: { emailVerificado: true }
    });

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    console.error('Error verificando OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Reenviar OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Eliminar OTPs existentes para este email
    await prisma.otpCode.deleteMany({
      where: { 
        email,
        tipo: 'EMAIL_VERIFICATION'
      }
    });

    // Generar nuevo OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar OTP
    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        expiraEn: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        usado: false
      }
    });

    // Enviar email con el OTP
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      email, 
      codigo, 
      'EMAIL_VERIFICATION'
    );

    if (!emailEnviado) {
      console.error('Error enviando email de verificación');
      return res.status(500).json({
        success: false,
        message: 'Error enviando el código de verificación'
      });
    }

    res.json({
      success: true,
      message: 'Código OTP enviado exitosamente'
    });

  } catch (error) {
    console.error('Error reenviando OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Recuperar contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Verificar si el usuario existe
    const user = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar OTPs existentes para este email
    await prisma.otpCode.deleteMany({
      where: { 
        email,
        tipo: 'PASSWORD_RESET'
      }
    });

    // Generar OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar OTP
    await prisma.otpCode.create({
      data: {
        id: uuidv4(),
        email,
        codigo,
        tipo: 'PASSWORD_RESET',
        expiraEn: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        usado: false
      }
    });

    // Enviar email con el OTP
    const emailService = new EmailService();
    const emailEnviado = await emailService.sendOTPEmail(
      email, 
      codigo, 
      'PASSWORD_RESET', 
      user.nombre
    );

    if (!emailEnviado) {
      console.error('Error enviando email de recuperación');
      return res.status(500).json({
        success: false,
        message: 'Error enviando el código de recuperación'
      });
    }

    res.json({
      success: true,
      message: 'Código de recuperación enviado exitosamente'
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Resetear contraseña
export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validationResult = resetPasswordSchema.safeParse(req.body);
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

    const { email, codigo, newPassword } = validationResult.data;

    // Buscar OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo: 'PASSWORD_RESET',
        usado: false,
        expiraEn: { gt: new Date() }
      }
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido o expirado'
      });
    }

    // Buscar usuario para verificar su estado actual
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Determinar si el email estaba verificado previamente
    const emailEstabaVerificado = usuario.emailVerificado;

    // Actualizar contraseña y verificar email automáticamente (solo si no estaba verificado)
    await prisma.usuario.update({
      where: { email },
      data: { 
        password: hashedPassword,
        emailVerificado: true,
        emailVerificadoAt: emailEstabaVerificado ? usuario.emailVerificadoAt : new Date()
      }
    });

    // Marcar OTP como usado
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usado: true }
    });

    // Mensaje personalizado según el estado previo
    const mensaje = emailEstabaVerificado 
      ? 'Contraseña actualizada exitosamente'
      : 'Contraseña actualizada exitosamente. Tu email ha sido verificado automáticamente.';

    res.json({
      success: true,
      message: mensaje
    });

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Verificar OTP de login
export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyOTPSchema.safeParse(req.body);
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

    const { email, codigo } = validationResult.data;

    // Buscar OTP válido
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo: 'LOGIN_VERIFICATION',
        expiraEn: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido o expirado'
      });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Marcar email como verificado
    await prisma.usuario.update({
      where: { email },
      data: { emailVerificado: true }
    });

    // Eliminar OTP usado
    await prisma.otpCode.delete({
      where: { id: otpRecord.id }
    });

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol.nombre },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol.nombre,
          emailVerificado: true,
          enPeriodoPrueba: user.enPeriodoPrueba,
          diasPruebaRestantes: user.diasPruebaRestantes
        },
        token
      }
    });

  } catch (error) {
    console.error('Error verificando OTP de login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Verificar OTP después del registro
export const verifyRegistrationOTP = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyOTPSchema.safeParse(req.body);
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

    const { email, codigo } = validationResult.data;

    // Buscar OTP válido
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo: 'EMAIL_VERIFICATION',
        expiraEn: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido o expirado'
      });
    }

    // Marcar email como verificado
    await prisma.usuario.update({
      where: { email },
      data: { emailVerificado: true }
    });

    // Eliminar OTP usado
    await prisma.otpCode.delete({
      where: { id: otpRecord.id }
    });

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    console.error('Error verificando OTP de registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener perfil
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      console.error('Error obteniendo perfil: Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol.nombre,
        emailVerificado: user.emailVerificado
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};