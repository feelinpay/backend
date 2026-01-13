import { z } from 'zod';

// Validador para crear horario laboral
export const horarioLaboralSchema = z.object({
  diaSemana: z.number({
    required_error: 'El día de la semana es requerido',
    invalid_type_error: 'El día debe ser un número'
  }).int().min(1).max(7, 'Día inválido (1-7)'),
  horaInicio: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .min(1, 'La hora de inicio es requerida'),
  horaFin: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .min(1, 'La hora de fin es requerida'),
  activo: z.boolean().default(true)
}).refine((data) => {
  // Validar que la hora de fin sea mayor que la hora de inicio
  const inicio = data.horaInicio.split(':').map(Number);
  const fin = data.horaFin.split(':').map(Number);
  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const finMinutos = fin[0] * 60 + fin[1];
  return finMinutos > inicioMinutos;
}, {
  message: 'La hora de fin debe ser mayor que la hora de inicio',
  path: ['horaFin']
});

// Validador para actualizar horario laboral
export const updateHorarioLaboralSchema = z.object({
  diaSemana: z.number().int().min(1).max(7).optional(),
  horaInicio: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .optional(),
  horaFin: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .optional(),
  activo: z.boolean().optional()
}).refine((data) => {
  // Solo validar si se proporcionan ambas horas
  if (data.horaInicio && data.horaFin) {
    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);
    const inicioMinutos = inicio[0] * 60 + inicio[1];
    const finMinutos = fin[0] * 60 + fin[1];
    return finMinutos > inicioMinutos;
  }
  return true;
}, {
  message: 'La hora de fin debe ser mayor que la hora de inicio',
  path: ['horaFin']
});
