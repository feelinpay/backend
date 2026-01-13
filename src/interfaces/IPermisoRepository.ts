import { CreatePermisoDto, UpdatePermisoDto, Permiso, PermisoWithRoles } from '../models/Permiso';

export interface IPermisoRepository {
  crear(data: CreatePermisoDto): Promise<Permiso>;
  obtenerTodos(page?: number, limit?: number, activo?: boolean, search?: string, modulo?: string): Promise<{ permisos: Permiso[]; total: number }>;
  obtenerPorId(id: string): Promise<Permiso | null>;
  obtenerPorNombre(nombre: string): Promise<Permiso | null>;
  actualizar(id: string, data: UpdatePermisoDto): Promise<Permiso>;
  eliminar(id: string): Promise<Permiso>;
  obtenerConRoles(id: string): Promise<PermisoWithRoles | null>;
  obtenerPorModulo(modulo: string): Promise<Permiso[]>;
}
