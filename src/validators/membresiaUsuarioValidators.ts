import { z } from 'zod';

// Validadores para MembresiaUsuario (Solo Super Admin)
export const createMembresiaUsuarioSchema = z.object({
  membresiaId: z.string().uuid('ID de membresía inválido'),
  fechaInicio: z.string().datetime('Formato de fecha inválido').transform(str => new Date(str)),
  fechaExpiracion: z.string().datetime('Formato de fecha inválido').transform(str => new Date(str)),
  activa: z.boolean().default(true)
}).refine((data) => {
  return data.fechaInicio < data.fechaExpiracion;
}, {
  message: 'La fecha de inicio debe ser anterior a la fecha de expiración',
  path: ['fechaExpiracion']
});

export const updateMembresiaUsuarioSchema = z.object({
  fechaInicio: z.string().datetime('Formato de fecha inválido').transform(str => new Date(str)).optional(),
  fechaExpiracion: z.string().datetime('Formato de fecha inválido').transform(str => new Date(str)).optional(),
  activa: z.boolean().optional()
});

export const membresiaUsuarioParamsSchema = z.object({
  id: z.string().uuid('ID inválido').optional(),
  usuarioId: z.string().uuid('ID de usuario inválido').optional()
});

export const membresiaUsuarioQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  activa: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  usuarioId: z.string().uuid('ID de usuario inválido').optional(),
  search: z.string().optional()
});
