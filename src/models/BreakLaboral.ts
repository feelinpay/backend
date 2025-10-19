// Interfaces para BreakLaboral
export interface BreakLaboral {
  id: string;
  empleadoId: string;
  diaSemana: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
  horaInicio: string; // "12:00" formato 24h
  horaFin: string; // "13:00" formato 24h
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBreakLaboralDto {
  empleadoId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
}

export interface UpdateBreakLaboralDto {
  diaSemana?: number;
  horaInicio?: string;
  horaFin?: string;
  activo?: boolean;
}

export interface BreakLaboralWithEmpleado extends BreakLaboral {
  empleado: {
    id: string;
    nombre: string;
    telefono: string;
    activo: boolean;
  };
}
