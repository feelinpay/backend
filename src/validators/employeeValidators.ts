import { z } from 'zod';

// Validador para crear empleado (usuario logueado)
export const createEmployeeSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim(),
  telefono: z.string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .trim()
});

// Validador para crear empleado (Super Admin - para cualquier usuario)
export const createEmployeeForUserSchema = z.object({
  usuarioId: z.string()
    .uuid('ID de usuario inválido'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim(),
  telefono: z.string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .trim()
});

// Validador para actualizar empleado
export const updateEmployeeSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim()
    .optional(),
  telefono: z.string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .trim()
    .optional(),
  activo: z.boolean().optional()
});

// Validador para búsqueda de empleados
export const searchEmployeeSchema = z.object({
  search: z.string()
    .min(1, 'El término de búsqueda es requerido')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .trim(),
  page: z.coerce.number()
    .min(1, 'La página debe ser mayor a 0')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'El límite debe ser mayor a 0')
    .max(100, 'El límite no puede exceder 100')
    .default(20)
});

// Validador para paginación
export const paginationSchema = z.object({
  page: z.coerce.number()
    .min(1, 'La página debe ser mayor a 0')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'El límite debe ser mayor a 0')
    .max(100, 'El límite no puede exceder 100')
    .default(20)
});

// Validador para cambiar estado de empleado
export const toggleEmployeeStatusSchema = z.object({
  activo: z.boolean()
});

// Validador para ID de empleado
export const employeeIdSchema = z.object({
  id: z.string()
    .uuid('ID de empleado inválido')
});

// Validador para filtros de empleados
export const employeeFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'all'])
    .default('all'),
  search: z.string()
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .trim()
    .optional(),
  page: z.coerce.number()
    .min(1, 'La página debe ser mayor a 0')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'El límite debe ser mayor a 0')
    .max(100, 'El límite no puede exceder 100')
    .default(20)
});
