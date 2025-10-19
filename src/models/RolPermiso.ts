// Interfaces para RolPermiso (tabla intermedia)
export interface RolPermiso {
  id: string;
  rolId: string;
  permisoId: string;
  createdAt: Date;
}

export interface CreateRolPermisoDto {
  rolId: string;
  permisoId: string;
}

export interface RolPermisoWithDetails extends RolPermiso {
  rol: {
    id: string;
    nombre: string;
    descripcion: string;
  };
  permiso: {
    id: string;
    nombre: string;
    descripcion: string;
    modulo: string;
    accion: string;
  };
}
