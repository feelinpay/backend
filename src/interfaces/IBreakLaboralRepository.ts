import { BreakLaboral, CreateBreakLaboralDto, UpdateBreakLaboralDto } from '../models/BreakLaboral';

export interface IBreakLaboralRepository {
  // Crear break laboral
  crear(data: CreateBreakLaboralDto): Promise<BreakLaboral>;
  
  // Obtener breaks por empleado
  obtenerPorEmpleado(empleadoId: string): Promise<BreakLaboral[]>;
  
  // Obtener break por empleado y día
  obtenerPorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<BreakLaboral | null>;
  
  // Obtener todos los breaks
  obtenerTodos(search?: string): Promise<BreakLaboral[]>;
  
  // Actualizar break
  actualizar(id: string, data: UpdateBreakLaboralDto): Promise<BreakLaboral>;
  
  // Eliminar break
  eliminar(id: string): Promise<BreakLaboral>;
  
  // Verificar si existe break para empleado y día
  existePorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<boolean>;
  
  // Obtener breaks activos por empleado
  obtenerActivosPorEmpleado(empleadoId: string): Promise<BreakLaboral[]>;
}
