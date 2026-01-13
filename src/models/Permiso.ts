// Interfaces para Permiso
export interface Permiso {
  id: string;
  nombre: string;
  modulo: string;
  ruta?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermisoDto {
  nombre: string;
  modulo: string;
  ruta?: string;
  activo?: boolean;
}

export interface UpdatePermisoDto {
  nombre?: string;
  modulo?: string;
  ruta?: string;
  activo?: boolean;
}

export interface PermisoWithRoles extends Permiso {
  roles: {
    id: string;
    nombre: string;
  }[];
}
