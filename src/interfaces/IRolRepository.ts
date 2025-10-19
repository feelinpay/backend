import { CreateRolDto, UpdateRolDto, Rol, RolWithPermissions } from '../models/Rol';

export interface IRolRepository {
  crear(data: CreateRolDto): Promise<Rol>;
  obtenerTodos(page?: number, limit?: number, activo?: boolean, search?: string): Promise<{ roles: Rol[]; total: number }>;
  obtenerPorId(id: string): Promise<Rol | null>;
  obtenerPorNombre(nombre: string): Promise<Rol | null>;
  actualizar(id: string, data: UpdateRolDto): Promise<Rol>;
  eliminar(id: string): Promise<Rol>;
  obtenerConPermisos(id: string): Promise<RolWithPermissions | null>;
  asignarPermiso(rolId: string, permisoId: string): Promise<void>;
  desasignarPermiso(rolId: string, permisoId: string): Promise<void>;
  obtenerPermisosDelRol(rolId: string): Promise<any[]>;
}
