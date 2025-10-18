/**
 * Rol domain model
 */
export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones (commented out to avoid circular dependencies)
  // usuarios?: Usuario[];
  // permisos?: RolPermiso[];
}

/**
 * Create Rol DTO
 */
export interface CreateRolDto {
  nombre: string;
  descripcion: string;
  activo?: boolean;
}

/**
 * Update Rol DTO
 */
export interface UpdateRolDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
