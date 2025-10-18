import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateOTP, sendOTPEmail } from '../services/otpService';
import { EmailService } from '../services/emailService';
import { UserRepository } from '../repositories/UserRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { registerUserSchema, loginSchema, verifyOTPSchema, resendOTPSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/userValidators';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const otpRepository = new OTPRepository(prisma);

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware de autenticación
export const authenticateToken = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: { rol: true }
    });

    if (!user || !user.activo) {
      return res.status(401).json({ success: false, message: 'Usuario no válido' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
};

// Middleware de autorización para super admin
export const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user?.rol?.nombre !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de super administrador' });
  }
  next();
};

// Middleware para verificar email verificado
export const requireEmailVerified = (req: Request, res: Response, next: Function) => {
  if (!req.user?.emailVerificado) {
    return res.status(403).json({ 
      success: false, 
      message: 'Debes verificar tu email antes de continuar',
      requiresVerification: true 
    });
  }
  next();
};

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    // Validar datos con Zod
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

    const { nombre, telefono, email, password } = validationResult.data;

    // Verificar si el email ya existe
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Obtener rol de propietario
    const rolPropietario = await prisma.rol.findFirst({
      where: { nombre: 'propietario' }
    });

    if (!rolPropietario) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error de configuración del sistema' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await userRepository.create({
      id: uuidv4(),
      nombre,
      telefono,
      email,
      password: hashedPassword,
      rolId: rolPropietario.id,
      googleSpreadsheetId: `sheet_${uuidv4()}`,
      activo: true,
      enPeriodoPrueba: true,
      fechaInicioPrueba: new Date(),
      diasPruebaRestantes: 3,
      emailVerificado: false
    });

    // Verificar límites de OTP diarios
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (usuario.lastOtpAttemptDate && usuario.lastOtpAttemptDate >= hoy) {
      if (usuario.otpAttemptsToday >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Has excedido el límite de 5 códigos OTP por día. Intenta mañana.'
        });
      }
    } else {
      // Nuevo día, resetear contador
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { otpAttemptsToday: 0 }
      });
    }

    // Eliminar OTP anterior si existe
    await prisma.otpCode.deleteMany({
      where: { email: usuario.email }
    });

    // Generar nuevo OTP
    const codigo = generateOTP();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await otpRepository.create({
      email: usuario.email,
      codigo,
      tipo: 'EMAIL_VERIFICATION',
      expiraEn
    });

    // Actualizar contador de intentos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        otpAttemptsToday: { increment: 1 },
        lastOtpAttemptDate: new Date()
      }
    });

    // Enviar email con diseño atractivo
    const emailService = new EmailService();
    await emailService.sendOTPEmail(usuario.email, codigo, 'EMAIL_VERIFICATION', usuario.nombre);

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol.nombre 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Verifica tu email para continuar.',
      data: {
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol.nombre,
          emailVerificado: usuario.emailVerificado,
          enPeriodoPrueba: usuario.enPeriodoPrueba,
          diasPruebaRestantes: usuario.diasPruebaRestantes
        },
        token
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
    // Validar datos con Zod
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

    const { email, password } = validationResult.data;

    // Buscar usuario
    const usuario = await userRepository.findByEmail(email);

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tu cuenta está desactivada' 
      });
    }

    // Actualizar último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { lastLoginAt: new Date() }
    });

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol.nombre 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol.nombre,
          emailVerificado: usuario.emailVerificado,
          enPeriodoPrueba: usuario.enPeriodoPrueba,
          diasPruebaRestantes: usuario.diasPruebaRestantes
        },
        token
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
    // Validar datos con Zod
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

    const { email, codigo, tipo } = validationResult.data;

    // Buscar OTP activo
    const otp = await otpRepository.findByEmailAndCode(email, codigo, tipo);

    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código OTP inválido o expirado' 
      });
    }

    // Marcar OTP como usado
    await otpRepository.markAsUsed(otp.id);

    // Si es verificación de email, marcar usuario como verificado
    if (tipo === 'EMAIL_VERIFICATION') {
      await prisma.usuario.update({
        where: { email },
        data: { 
          emailVerificado: true,
          emailVerificadoAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Código OTP verificado exitosamente'
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
    // Validar datos con Zod
    const validationResult = resendOTPSchema.safeParse(req.body);
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

    const { email, tipo } = validationResult.data;

    // Verificar si el usuario existe
    const usuario = await userRepository.findByEmail(email);

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Generar nuevo OTP
    const codigo = generateOTP();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    await otpRepository.create({
      email: usuario.email,
      codigo,
      tipo,
      expiraEn,
      // metadata removed - using direct fields
    });

    // Enviar email
    const emailService = new EmailService();
    await emailService.sendOTPEmail(usuario.email, codigo, tipo, usuario.nombre);

    res.json({
      success: true,
      message: 'Código OTP reenviado exitosamente'
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
    // Validar datos con Zod
    const validationResult = forgotPasswordSchema.safeParse(req.body);
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

    const { email } = validationResult.data;

    // Verificar si el usuario existe
    const usuario = await userRepository.findByEmail(email);

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar límites de OTP diarios
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (usuario.lastOtpAttemptDate && usuario.lastOtpAttemptDate >= hoy) {
      if (usuario.otpAttemptsToday >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Has excedido el límite de 5 códigos OTP por día. Intenta mañana.'
        });
      }
    } else {
      // Nuevo día, resetear contador
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { otpAttemptsToday: 0 }
      });
    }

    // Eliminar OTP anterior si existe
    await prisma.otpCode.deleteMany({
      where: { email: usuario.email }
    });

    // Generar nuevo OTP
    const codigo = generateOTP();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    await otpRepository.create({
      email: usuario.email,
      codigo,
      tipo: 'PASSWORD_RESET',
      expiraEn
    });

    // Actualizar contador de intentos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        otpAttemptsToday: { increment: 1 },
        lastOtpAttemptDate: new Date()
      }
    });

    // Enviar email
    const emailService = new EmailService();
    await emailService.sendOTPEmail(usuario.email, codigo, 'PASSWORD_RESET', usuario.nombre);

    res.json({
      success: true,
      message: 'Código de recuperación enviado a tu email'
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
    // Validar datos con Zod
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

    // Verificar OTP
    const otp = await otpRepository.findByEmailAndCode(email, codigo, 'PASSWORD_RESET');

    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código OTP inválido o expirado' 
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await userRepository.update(otp.email, {
      password: hashedPassword
    });

    // Marcar OTP como usado
    await otpRepository.markAsUsed(otp.id);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener perfil del usuario
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol.nombre,
        emailVerificado: user.emailVerificado,
        enPeriodoPrueba: user.enPeriodoPrueba,
        diasPruebaRestantes: user.diasPruebaRestantes,
        activo: user.activo,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
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
    // En un sistema más complejo, aquí invalidarías el token
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