import { z } from 'zod';

// Validator para crear pago
export const createPaymentSchema = z.object({
  nombrePagador: z.string()
    .min(2, 'El nombre del pagador debe tener al menos 2 caracteres')
    .max(100, 'El nombre del pagador no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  monto: z.number()
    .positive('El monto debe ser mayor a 0')
    .max(999999.99, 'El monto no puede exceder 999,999.99'),
  
  fecha: z.string()
    .datetime('Formato de fecha inválido')
    .transform((str) => new Date(str)),
  
  codigoSeguridad: z.string()
    .length(6, 'El código de seguridad debe tener 6 dígitos')
    .regex(/^[0-9]+$/, 'El código de seguridad solo puede contener números')
    .optional(),
  
  numeroTelefono: z.string()
    .min(9, 'El número de teléfono debe tener al menos 9 dígitos')
    .max(15, 'El número de teléfono no puede exceder 15 dígitos')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de teléfono inválido')
    .optional()
});

// Validator para actualizar pago
export const updatePaymentSchema = z.object({
  nombrePagador: z.string()
    .min(2, 'El nombre del pagador debe tener al menos 2 caracteres')
    .max(100, 'El nombre del pagador no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .optional(),
  
  monto: z.number()
    .positive('El monto debe ser mayor a 0')
    .max(999999.99, 'El monto no puede exceder 999,999.99')
    .optional(),
  
  fecha: z.string()
    .datetime('Formato de fecha inválido')
    .transform((str) => new Date(str))
    .optional(),
  
  codigoSeguridad: z.string()
    .length(6, 'El código de seguridad debe tener 6 dígitos')
    .regex(/^[0-9]+$/, 'El código de seguridad solo puede contener números')
    .optional()
});

// Validator para obtener pagos con filtros
export const getPaymentsSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'La página debe ser un número')
    .transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0')
    .default(1),
  
  limit: z.string()
    .regex(/^\d+$/, 'El límite debe ser un número')
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El límite debe estar entre 1 y 100')
    .default(20),
  
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Validator para estadísticas de pagos
export const paymentStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  propietarioId: z.string().uuid().optional()
});
