import { Membresia, CreateMembresiaDto, UpdateMembresiaDto } from '../models/Membresia';

export interface IMembresiaRepository {
  // Crear nueva membresía
  crear(data: CreateMembresiaDto): Promise<Membresia>;
  
  // Obtener todas las membresías con paginación y filtros
  obtenerTodas(
    page: number, 
    limit: number, 
    activa?: boolean, 
    search?: string
  ): Promise<{
    membresias: Membresia[];
    total: number;
  }>;
  
  // Obtener membresía por ID
  obtenerPorId(id: string): Promise<Membresia | null>;
  
  // Actualizar membresía
  actualizar(id: string, data: UpdateMembresiaDto): Promise<Membresia>;
  
  // Eliminar membresía (soft delete)
  eliminar(id: string): Promise<Membresia>;
  
  // Obtener membresías activas
  obtenerActivas(): Promise<Membresia[]>;
  
  // Verificar si existe membresía con el mismo nombre
  existeConNombre(nombre: string, excluirId?: string): Promise<boolean>;
}
