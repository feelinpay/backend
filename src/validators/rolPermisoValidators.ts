import { z } from 'zod';

// Validadores para RolPermiso (tabla intermedia)
export const createRolPermisoSchema = z.object({
  rolId: z.string().uuid('ID de rol inválido'),
  permisoId: z.string().uuid('ID de permiso inválido')
});

export const rolPermisoParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
  rolId: z.string().uuid('ID de rol inválido').optional(),
  permisoId: z.string().uuid('ID de permiso inválido').optional()
});

export const rolPermisoQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  rolId: z.string().uuid('ID de rol inválido').optional(),
  permisoId: z.string().uuid('ID de permiso inválido').optional()
});
