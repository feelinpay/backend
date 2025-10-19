import { z } from 'zod';

// Validadores para Permiso
export const createPermisoSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  descripcion: z.string().min(1, 'Descripción es requerida').max(300, 'Descripción muy larga'),
  modulo: z.string().min(1, 'Módulo es requerido').max(50, 'Módulo muy largo'),
  accion: z.string().min(1, 'Acción es requerida').max(50, 'Acción muy larga'),
  activo: z.boolean().default(true)
});

export const updatePermisoSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo').optional(),
  descripcion: z.string().min(1, 'Descripción es requerida').max(300, 'Descripción muy larga').optional(),
  modulo: z.string().min(1, 'Módulo es requerido').max(50, 'Módulo muy largo').optional(),
  accion: z.string().min(1, 'Acción es requerida').max(50, 'Acción muy larga').optional(),
  activo: z.boolean().optional()
});

export const permisoParamsSchema = z.object({
  id: z.string().uuid('ID inválido')
});

export const permisoQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional(),
  modulo: z.string().optional()
});
