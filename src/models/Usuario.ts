/**
 * Usuario domain model based on Prisma schema (Google Sign-In only)
 */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  googleId: string; // Google ID for authentication
  rolId: string;
  googleDriveFolderId: string | null;
  activo: boolean;
  imagen: string | null; // NEW: Added imagen

  // Sistema de prueba
  fechaInicioPrueba?: Date | null;
  fechaFinPrueba?: Date | null;

  // Auditoría
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;

  // Relaciones (commented out to avoid circular dependencies)
  rol?: {
    id: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Create Usuario DTO (Google Sign-In)
 */
export interface CreateUsuarioDto {
  id?: string;
  nombre: string;
  email: string;
  googleId: string; // Required for Google Sign-In
  imagen?: string | null;
  rolId: string;
  googleDriveFolderId?: string | null;
  activo?: boolean;
  fechaInicioPrueba?: Date;
  fechaFinPrueba?: Date;
}

/**
 * Update Usuario DTO
 */
export interface UpdateUsuarioDto {
  nombre?: string;
  activo?: boolean;
  imagen?: string | null;
  fechaInicioPrueba?: Date;
  fechaFinPrueba?: Date;
}

/**
 * Usuario response DTO (without sensitive data)
 */
export interface UsuarioResponseDto {
  id: string;
  nombre: string;
  email: string;
  googleId: string;
  rolId: string;
  googleDriveFolderId: string | null;
  activo: boolean;
  imagen: string | null;
  fechaInicioPrueba?: Date | null;
  fechaFinPrueba?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}
