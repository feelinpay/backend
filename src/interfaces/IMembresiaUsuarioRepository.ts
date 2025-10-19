import { MembresiaUsuario, CreateMembresiaUsuarioDto, UpdateMembresiaUsuarioDto } from '../models/MembresiaUsuario';

export interface IMembresiaUsuarioRepository {
  // Crear nueva relación usuario-membresía
  crear(data: CreateMembresiaUsuarioDto): Promise<MembresiaUsuario>;
  
  // Obtener membresías de un usuario
  obtenerPorUsuario(usuarioId: string): Promise<MembresiaUsuario[]>;
  
  // Obtener membresía activa de un usuario
  obtenerActivaPorUsuario(usuarioId: string): Promise<MembresiaUsuario | null>;
  
  // Obtener todas las relaciones con paginación
  obtenerTodas(
    page: number, 
    limit: number, 
    activa?: boolean, 
    usuarioId?: string,
    search?: string
  ): Promise<{
    membresiasUsuario: MembresiaUsuario[];
    total: number;
  }>;
  
  // Obtener por ID
  obtenerPorId(id: string): Promise<MembresiaUsuario | null>;
  
  // Actualizar relación
  actualizar(id: string, data: UpdateMembresiaUsuarioDto): Promise<MembresiaUsuario>;
  
  // Eliminar relación (soft delete)
  eliminar(id: string): Promise<MembresiaUsuario>;
  
  // Verificar si usuario tiene membresía activa
  tieneMembresiaActiva(usuarioId: string): Promise<boolean>;
  
  // Obtener membresías que expiran pronto
  obtenerQueExpiranEn(dias: number): Promise<MembresiaUsuario[]>;
}
