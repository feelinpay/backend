// Tipos TypeScript para el frontend - Feelin Pay API

// ===========================================
// TIPOS BASE DE LA API
// ===========================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===========================================
// TIPOS DE USUARIO
// ===========================================

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  enPeriodoPrueba: boolean;
  diasPruebaRestantes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  requiresOTP: boolean;
}

export interface RegisterResponse {
  user: User;
  requiresEmailVerification: boolean;
}

export interface OTPResponse {
  verified: boolean;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION';
}

// ===========================================
// TIPOS DE EMPLEADO
// ===========================================

export interface Employee {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string;
  salario: number;
  fecha_ingreso: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string;
  salario: number;
  fecha_ingreso: string;
  estado?: 'activo' | 'inactivo' | 'suspendido';
}

export interface UpdateEmployeeData {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  salario?: number;
  fecha_ingreso?: string;
  estado?: 'activo' | 'inactivo' | 'suspendido';
}

export interface EmployeeStats {
  total: number;
  activos: number;
  inactivos: number;
  suspendidos: number;
  promedioSalario: number;
  empleadosPorCargo: Record<string, number>;
}

// ===========================================
// TIPOS DE PAGO
// ===========================================

export interface Payment {
  id: string;
  monto: number;
  nombrePagador: string;
  numeroTelefono: string;
  codigoSeguridad: string;
  mensajeOriginal: string;
  fecha: string;
  estado: 'procesado' | 'pendiente' | 'fallido';
  usuarioId: string;
  createdAt: string;
}

export interface PaymentStats {
  totalPagos: number;
  montoTotal: number;
  promedioPago: number;
  pagosPorMes: Record<string, number>;
  ultimoPago?: Payment;
}

export interface ProcessPaymentData {
  usuarioId: string;
  nombrePagador: string;
  monto: number;
  codigoSeguridad: string;
  numeroTelefono: string;
  mensajeOriginal: string;
}

// ===========================================
// TIPOS DE MEMBRESÍA
// ===========================================

export interface Membership {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_dias: number;
  caracteristicas: string[];
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt?: string;
}

export interface UserMembership {
  id: string;
  usuarioId: string;
  membresiaId: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  autoRenovar: boolean;
  createdAt: string;
  membresia: Membership;
}

// ===========================================
// TIPOS DE ROL Y PERMISOS
// ===========================================

export interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt?: string;
}

export interface RolePermission {
  id: string;
  rolId: string;
  permisoId: string;
  rol: Role;
  permiso: Permission;
}

// ===========================================
// TIPOS DE NOTIFICACIONES
// ===========================================

export interface NotificationConfig {
  id: string;
  empleadoId: string;
  email_notificaciones: boolean;
  sms_notificaciones: boolean;
  horario_notificaciones: string;
  dias_notificacion: string[];
  createdAt: string;
  updatedAt?: string;
}

// ===========================================
// TIPOS DE HORARIOS
// ===========================================

export interface Schedule {
  id: string;
  empleadoId: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'Trabajo' | 'Descanso' | 'Extra';
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Break {
  id: string;
  empleadoId: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ===========================================
// TIPOS DE DASHBOARD
// ===========================================

export interface DashboardData {
  user: User;
  license: {
    hasAccess: boolean;
    reason: string;
    daysRemaining: number;
    isExpired: boolean;
    isSuperAdmin: boolean;
    enPeriodoPrueba: boolean;
    tipoAcceso: string;
  };
  system: {
    internet: boolean;
    database: boolean;
    email: boolean;
    sms: boolean;
    overall: boolean;
  };
  stats: {
    totalEmpleados: number;
    totalPagos: number;
    montoTotalPagos: number;
    empleadosActivos: number;
  };
}

// ===========================================
// TIPOS DE FILTROS Y BÚSQUEDA
// ===========================================

export interface EmployeeFilters {
  search?: string;
  estado?: string;
  cargo?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams extends PaginationParams {
  q: string;
}

// ===========================================
// TIPOS DE FORMULARIOS
// ===========================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  email: string;
  codigo: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OTPForm {
  email: string;
  codigo: string;
  tipo: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION';
}

// ===========================================
// TIPOS DE RESPUESTAS ESPECÍFICAS
// ===========================================

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    pagination: PaginationMeta;
    timestamp: string;
  };
}

export interface StatsResponse {
  success: boolean;
  message: string;
  data: EmployeeStats | PaymentStats;
}

export interface HealthResponse {
  success: boolean;
  message: string;
  data: {
    status: 'OK';
    timestamp: string;
    version: string;
  };
}

// ===========================================
// TIPOS DE ERRORES
// ===========================================

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationErrorResponse extends ApiError {
  errors: ValidationError[];
}

// ===========================================
// TIPOS DE HOOKS Y UTILIDADES
// ===========================================

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePaginatedApiResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  refetch: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export interface FormErrors {
  [key: string]: string;
}

// ===========================================
// TIPOS DE CONFIGURACIÓN
// ===========================================

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface AuthConfig {
  tokenKey: string;
  refreshTokenKey: string;
  tokenExpiryKey: string;
}
