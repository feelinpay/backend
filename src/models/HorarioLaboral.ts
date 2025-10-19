// Interfaces para HorarioLaboral
export interface HorarioLaboral {
  id: string;
  empleadoId: string;
  diaSemana: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
  horaInicio: string; // "09:00" formato 24h
  horaFin: string; // "18:00" formato 24h
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHorarioLaboralDto {
  empleadoId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
}

export interface UpdateHorarioLaboralDto {
  diaSemana?: number;
  horaInicio?: string;
  horaFin?: string;
  activo?: boolean;
}

export interface HorarioLaboralWithEmpleado extends HorarioLaboral {
  empleado: {
    id: string;
    nombre: string;
    telefono: string;
    activo: boolean;
  };
}
