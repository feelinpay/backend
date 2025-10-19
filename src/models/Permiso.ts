// Interfaces para Permiso
export interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermisoDto {
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
  activo?: boolean;
}

export interface UpdatePermisoDto {
  nombre?: string;
  descripcion?: string;
  modulo?: string;
  accion?: string;
  activo?: boolean;
}

export interface PermisoWithRoles extends Permiso {
  roles: {
    id: string;
    nombre: string;
    descripcion: string;
  }[];
}
