/**
 * Usuario domain model based on Prisma schema
 */
export interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  password: string;
  rolId: string;
  googleSpreadsheetId: string;
  activo: boolean;
  
  // Sistema de prueba
  enPeriodoPrueba: boolean;
  fechaInicioPrueba?: Date;
  diasPruebaRestantes: number;
  
  // Verificación de email
  emailVerificado: boolean;
  emailVerificadoAt?: Date;
  
  // Sistema de intentos OTP diarios
  otpAttemptsToday: number;
  lastOtpAttemptDate?: Date;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Relaciones (commented out to avoid circular dependencies)
  rol?: {
    id: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  // empleados?: Empleado[];
  // pagos?: Pago[];
  // licencias?: Licencia[];
}

/**
 * Create Usuario DTO
 */
export interface CreateUsuarioDto {
  id?: string;
  nombre: string;
  telefono: string;
  email: string;
  password: string;
  rolId: string;
  googleSpreadsheetId: string;
  activo?: boolean;
  enPeriodoPrueba?: boolean;
  fechaInicioPrueba?: Date;
  diasPruebaRestantes?: number;
  emailVerificado?: boolean;
}

/**
 * Update Usuario DTO
 */
export interface UpdateUsuarioDto {
  nombre?: string;
  telefono?: string;
  email?: string;
  password?: string;
  activo?: boolean;
  enPeriodoPrueba?: boolean;
  diasPruebaRestantes?: number;
  emailVerificado?: boolean;
  emailVerificadoAt?: Date;
}

/**
 * Usuario response DTO (without sensitive data)
 */
export interface UsuarioResponseDto {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  rolId: string;
  googleSpreadsheetId: string;
  activo: boolean;
  enPeriodoPrueba: boolean;
  diasPruebaRestantes: number;
  emailVerificado: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // rol: Rol;
}

/**
 * User login DTO
 */
export interface UserLoginDto {
  email: string;
  password: string;
}

/**
 * User registration DTO
 */
export interface UserRegistrationDto {
  email: string;
  phone: string;
  name: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}
