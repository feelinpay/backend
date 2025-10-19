import { CreateRolPermisoDto, RolPermiso, RolPermisoWithDetails } from '../models/RolPermiso';

export interface IRolPermisoRepository {
  crear(data: CreateRolPermisoDto): Promise<RolPermiso>;
  obtenerTodos(page?: number, limit?: number, rolId?: string, permisoId?: string): Promise<{ rolPermisos: RolPermiso[]; total: number }>;
  obtenerPorId(id: string): Promise<RolPermiso | null>;
  obtenerPorRol(rolId: string): Promise<RolPermiso[]>;
  obtenerPorPermiso(permisoId: string): Promise<RolPermiso[]>;
  eliminar(id: string): Promise<RolPermiso>;
  eliminarPorRolYPermiso(rolId: string, permisoId: string): Promise<void>;
  verificarAsignacion(rolId: string, permisoId: string): Promise<boolean>;
  obtenerConDetalles(id: string): Promise<RolPermisoWithDetails | null>;
}
