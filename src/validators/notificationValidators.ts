import { z } from 'zod';

// Validador para crear/actualizar configuración de notificaciones
export const configuracionNotificacionSchema = z.object({
  notificacionesActivas: z.boolean().default(true)
});

// Validador para actualizar configuración (todos los campos opcionales)
export const updateConfiguracionNotificacionSchema = z.object({
  notificacionesActivas: z.boolean().optional()
});
