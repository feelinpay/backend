import { HorarioLaboral, CreateHorarioLaboralDto, UpdateHorarioLaboralDto } from '../models/HorarioLaboral';

export interface IHorarioLaboralRepository {
  // Crear horario laboral
  crear(data: CreateHorarioLaboralDto): Promise<HorarioLaboral>;
  
  // Obtener horarios por empleado
  obtenerPorEmpleado(empleadoId: string): Promise<HorarioLaboral[]>;
  
  // Obtener horario por empleado y día
  obtenerPorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<HorarioLaboral | null>;
  
  // Obtener todos los horarios
  obtenerTodos(search?: string): Promise<HorarioLaboral[]>;
  
  // Actualizar horario
  actualizar(id: string, data: UpdateHorarioLaboralDto): Promise<HorarioLaboral>;
  
  // Eliminar horario
  eliminar(id: string): Promise<HorarioLaboral>;
  
  // Verificar si existe horario para empleado y día
  existePorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<boolean>;
  
  // Obtener horarios activos por empleado
  obtenerActivosPorEmpleado(empleadoId: string): Promise<HorarioLaboral[]>;
}
