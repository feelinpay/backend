import { z } from 'zod';

// Validator para registro de usuario
export const registerUserSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  telefono: z.string()
    .min(9, 'El teléfono debe tener al menos 9 dígitos')
    .max(15, 'El teléfono no puede exceder 15 dígitos')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de teléfono inválido'),
  
  email: z.string()
    .email('Formato de email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Validator para login
export const loginSchema = z.object({
  email: z.string()
    .email('Formato de email inválido'),
  password: z.string()
    .min(1, 'La contraseña es requerida')
});

// Validator para actualizar usuario
export const updateUserSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .optional(),
  
  telefono: z.string()
    .min(9, 'El teléfono debe tener al menos 9 dígitos')
    .max(15, 'El teléfono no puede exceder 15 dígitos')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de teléfono inválido')
    .optional(),
  
  email: z.string()
    .email('Formato de email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  
  rolId: z.string().uuid('ID de rol inválido').optional(),
  activo: z.boolean().optional(),
  licenciaActiva: z.boolean().optional(),
  diasPruebaRestantes: z.number().int().min(0).max(365).optional(),
  emailVerificado: z.boolean().optional()
});

// Validator para recuperar contraseña
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Formato de email inválido')
});

// Validator para resetear contraseña
export const resetPasswordSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Validator para verificar OTP
export const verifyOTPSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
  tipo: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION'], {
    message: 'Tipo de OTP inválido'
  })
});

// Validator para reenviar OTP
export const resendOTPSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  tipo: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION'], {
    message: 'Tipo de OTP inválido'
  })
});
