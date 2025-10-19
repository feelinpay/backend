import { z } from 'zod';

// Validadores para Membresia (Solo Super Admin)
export const createMembresiaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  meses: z.number()
    .int('Los meses deben ser un número entero')
    .min(1, 'Los meses deben ser al menos 1')
    .max(12, 'Los meses no pueden exceder 12'),
  precio: z.number()
    .positive('El precio debe ser mayor a 0')
    .max(999999.99, 'El precio no puede exceder 999,999.99'),
  activa: z.boolean().default(true)
});

export const updateMembresiaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  meses: z.number()
    .int('Los meses deben ser un número entero')
    .min(1, 'Los meses deben ser al menos 1')
    .max(12, 'Los meses no pueden exceder 12')
    .optional(),
  precio: z.number()
    .positive('El precio debe ser mayor a 0')
    .max(999999.99, 'El precio no puede exceder 999,999.99')
    .optional(),
  activa: z.boolean().optional()
});

export const membresiaParamsSchema = z.object({
  id: z.string().uuid('ID de membresía inválido')
});

export const membresiaQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  activa: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional()
});