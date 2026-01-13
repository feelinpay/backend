import { z } from 'zod';

// Validator para actualizar usuario (Google Sign-In only)
export const updateUserSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .optional(),



  rolId: z.string().uuid('ID de rol inválido').optional(),
  activo: z.boolean().optional()
});

// Validator para actualizar perfil básico (nombre, teléfono)
export const updateProfileBasicSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .optional()
});

// Validator para Google Sign-In token
export const googleSignInSchema = z.object({
  idToken: z.string().min(1, 'El token de Google es requerido')
});