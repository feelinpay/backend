import { z } from 'zod';

// Validador para un turno individual
export const turnoLaboralSchema = z.object({
  horaInicio: z.string()

    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .min(1, 'La hora de inicio es requerida'),
  horaFin: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
    .min(1, 'La hora de fin es requerida'),
  activo: z.boolean().default(true)
}).refine((data) => {
  const inicio = data.horaInicio.split(':').map(Number);
  const fin = data.horaFin.split(':').map(Number);
  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const finMinutos = fin[0] * 60 + fin[1];
  return finMinutos > inicioMinutos;
}, {
  message: 'La hora de fin debe ser mayor que la hora de inicio',
  path: ['horaFin']
});

// Validador para el horario completo (Mapa de días a lista de turnos)
export const scheduleJsonSchema = z.record(
  z.string(), // Nombre del día
  z.array(turnoLaboralSchema) // Lista de turnos
);

export const horarioLaboralSchema = z.object({
  horarioLaboral: scheduleJsonSchema
});


// Validador para actualizar horario (opcional)
export const updateHorarioLaboralSchema = z.object({
  horarioLaboral: scheduleJsonSchema.optional()
});

