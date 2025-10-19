import { z } from 'zod';

// Validadores para Rol
export const createRolSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo'),
  descripcion: z.string().min(1, 'Descripción es requerida').max(200, 'Descripción muy larga'),
  activo: z.boolean().default(true)
});

export const updateRolSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo').optional(),
  descripcion: z.string().min(1, 'Descripción es requerida').max(200, 'Descripción muy larga').optional(),
  activo: z.boolean().optional()
});

export const rolParamsSchema = z.object({
  id: z.string().uuid('ID inválido')
});

export const rolQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional()
});

// Validadores para asignación de permisos
export const asignarPermisoSchema = z.object({
  permisoId: z.string().uuid('ID de permiso inválido')
});

export const desasignarPermisoSchema = z.object({
  permisoId: z.string().uuid('ID de permiso inválido')
});
