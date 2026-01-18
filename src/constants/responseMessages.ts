// Mensajes de respuesta estandarizados para el backend
// Solo se mantienen los mensajes que realmente se usan en la aplicación

export const ERROR_MESSAGES = {
  // Autenticación
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'Acceso denegado',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',

  // Validación
  VALIDATION_ERROR: 'Datos de entrada inválidos',
  REQUIRED_FIELD: 'Campo requerido',

  // Recursos
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMPLOYEE_NOT_FOUND: 'Empleado no encontrado',
  MEMBERSHIP_NOT_FOUND: 'Membresía no encontrada',
  ROLE_NOT_FOUND: 'Rol no encontrado',
  PERMISSION_NOT_FOUND: 'Permiso no encontrado',
  PAYMENT_NOT_FOUND: 'Pago no encontrado',

  // Conflictos
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
  USER_ALREADY_EXISTS: 'El usuario ya existe',

  // Base de datos
  DATABASE_ERROR: 'Error en la base de datos',

  // Sistema
  INTERNAL_ERROR: 'Error interno del servidor',
  RATE_LIMIT_EXCEEDED: 'Demasiadas peticiones, intenta más tarde',
  ENDPOINT_NOT_FOUND: 'Endpoint no encontrado',

  // Licencias y membresías
  MEMBERSHIP_EXPIRED: 'Membresía expirada',
  TRIAL_EXPIRED: 'Período de prueba expirado',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes'
};
