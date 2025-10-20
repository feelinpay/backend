// Mensajes de respuesta estandarizados para el frontend

export const SUCCESS_MESSAGES = {
  // Autenticación
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
  REGISTER_SUCCESS: 'Usuario registrado exitosamente',
  PASSWORD_RESET_SUCCESS: 'Contraseña restablecida exitosamente',
  EMAIL_VERIFIED: 'Email verificado exitosamente',
  OTP_SENT: 'Código de verificación enviado',
  OTP_VERIFIED: 'Código verificado exitosamente',
  
  // Usuarios
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
  USER_DELETED: 'Usuario eliminado exitosamente',
  USER_REACTIVATED: 'Usuario reactivado exitosamente',
  USER_STATUS_CHANGED: 'Estado del usuario actualizado',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  
  // Empleados
  EMPLOYEE_CREATED: 'Empleado creado exitosamente',
  EMPLOYEE_UPDATED: 'Empleado actualizado exitosamente',
  EMPLOYEE_DELETED: 'Empleado eliminado exitosamente',
  EMPLOYEE_FOUND: 'Empleado encontrado',
  EMPLOYEES_FOUND: 'Empleados obtenidos exitosamente',
  
  // Membresías
  MEMBERSHIP_CREATED: 'Membresía creada exitosamente',
  MEMBERSHIP_UPDATED: 'Membresía actualizada exitosamente',
  MEMBERSHIP_DELETED: 'Membresía eliminada exitosamente',
  MEMBERSHIP_EXTENDED: 'Membresía extendida exitosamente',
  
  // Roles y Permisos
  ROLE_CREATED: 'Rol creado exitosamente',
  ROLE_UPDATED: 'Rol actualizado exitosamente',
  ROLE_DELETED: 'Rol eliminado exitosamente',
  PERMISSION_ASSIGNED: 'Permiso asignado exitosamente',
  PERMISSION_REMOVED: 'Permiso removido exitosamente',
  
  // Pagos
  PAYMENT_PROCESSED: 'Pago procesado exitosamente',
  PAYMENT_FOUND: 'Pago encontrado',
  PAYMENTS_FOUND: 'Pagos obtenidos exitosamente',
  
  // Notificaciones
  NOTIFICATION_CREATED: 'Notificación creada exitosamente',
  NOTIFICATION_UPDATED: 'Notificación actualizada exitosamente',
  NOTIFICATION_DELETED: 'Notificación eliminada exitosamente',
  
  // Horarios
  SCHEDULE_CREATED: 'Horario creado exitosamente',
  SCHEDULE_UPDATED: 'Horario actualizado exitosamente',
  SCHEDULE_DELETED: 'Horario eliminado exitosamente',
  
  // Descansos
  BREAK_CREATED: 'Descanso creado exitosamente',
  BREAK_UPDATED: 'Descanso actualizado exitosamente',
  BREAK_DELETED: 'Descanso eliminado exitosamente',
  
  // General
  OPERATION_SUCCESS: 'Operación exitosa',
  DATA_RETRIEVED: 'Datos obtenidos exitosamente',
  SETTINGS_UPDATED: 'Configuración actualizada exitosamente',
  EXPORT_SUCCESS: 'Datos exportados exitosamente',
  IMPORT_SUCCESS: 'Datos importados exitosamente'
};

export const ERROR_MESSAGES = {
  // Autenticación
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'Acceso denegado',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',
  SESSION_EXPIRED: 'Sesión expirada',
  EMAIL_NOT_VERIFIED: 'Email no verificado',
  OTP_INVALID: 'Código de verificación inválido',
  OTP_EXPIRED: 'Código de verificación expirado',
  OTP_MAX_ATTEMPTS: 'Máximo de intentos de verificación alcanzado',
  
  // Validación
  VALIDATION_ERROR: 'Datos de entrada inválidos',
  REQUIRED_FIELD: 'Campo requerido',
  INVALID_EMAIL: 'Formato de email inválido',
  INVALID_PHONE: 'Formato de teléfono inválido',
  INVALID_PASSWORD: 'Contraseña inválida',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  WEAK_PASSWORD: 'Contraseña muy débil',
  INVALID_NAME: 'Formato de nombre inválido',
  INVALID_DATE: 'Formato de fecha inválido',
  INVALID_NUMBER: 'Formato de número inválido',
  
  // Recursos
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMPLOYEE_NOT_FOUND: 'Empleado no encontrado',
  MEMBERSHIP_NOT_FOUND: 'Membresía no encontrada',
  ROLE_NOT_FOUND: 'Rol no encontrado',
  PERMISSION_NOT_FOUND: 'Permiso no encontrado',
  PAYMENT_NOT_FOUND: 'Pago no encontrado',
  NOTIFICATION_NOT_FOUND: 'Notificación no encontrada',
  SCHEDULE_NOT_FOUND: 'Horario no encontrado',
  BREAK_NOT_FOUND: 'Descanso no encontrado',
  
  // Conflictos
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
  PHONE_ALREADY_EXISTS: 'El teléfono ya está registrado',
  USER_ALREADY_EXISTS: 'El usuario ya existe',
  EMPLOYEE_ALREADY_EXISTS: 'El empleado ya existe',
  MEMBERSHIP_ALREADY_EXISTS: 'La membresía ya existe',
  ROLE_ALREADY_EXISTS: 'El rol ya existe',
  PERMISSION_ALREADY_EXISTS: 'El permiso ya existe',
  
  // Base de datos
  DATABASE_ERROR: 'Error en la base de datos',
  CONNECTION_ERROR: 'Error de conexión',
  QUERY_ERROR: 'Error en la consulta',
  CONSTRAINT_ERROR: 'Error de restricción de datos',
  
  // Servicios externos
  EMAIL_SERVICE_ERROR: 'Error en el servicio de email',
  SMS_SERVICE_ERROR: 'Error en el servicio de SMS',
  PAYMENT_SERVICE_ERROR: 'Error en el servicio de pagos',
  EXTERNAL_API_ERROR: 'Error en servicio externo',
  
  // Sistema
  INTERNAL_ERROR: 'Error interno del servidor',
  SERVICE_UNAVAILABLE: 'Servicio no disponible',
  MAINTENANCE_MODE: 'Sistema en mantenimiento',
  RATE_LIMIT_EXCEEDED: 'Demasiadas peticiones, intenta más tarde',
  INVALID_REQUEST: 'Petición inválida',
  METHOD_NOT_ALLOWED: 'Método no permitido',
  ENDPOINT_NOT_FOUND: 'Endpoint no encontrado',
  
  // Archivos
  FILE_TOO_LARGE: 'Archivo demasiado grande',
  INVALID_FILE_TYPE: 'Tipo de archivo inválido',
  FILE_UPLOAD_ERROR: 'Error al subir archivo',
  FILE_NOT_FOUND: 'Archivo no encontrado',
  
  // Licencias y membresías
  LICENSE_EXPIRED: 'Licencia expirada',
  MEMBERSHIP_EXPIRED: 'Membresía expirada',
  TRIAL_EXPIRED: 'Período de prueba expirado',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes',
  FEATURE_NOT_AVAILABLE: 'Funcionalidad no disponible',
  
  // Pagos
  PAYMENT_FAILED: 'Pago fallido',
  PAYMENT_CANCELLED: 'Pago cancelado',
  INSUFFICIENT_FUNDS: 'Fondos insuficientes',
  PAYMENT_METHOD_INVALID: 'Método de pago inválido',
  REFUND_FAILED: 'Reembolso fallido'
};

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  MIN_LENGTH: (min: number) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `No puede exceder ${max} caracteres`,
  MIN_VALUE: (min: number) => `Debe ser mayor o igual a ${min}`,
  MAX_VALUE: (max: number) => `Debe ser menor o igual a ${max}`,
  EMAIL_FORMAT: 'Formato de email inválido',
  PHONE_FORMAT: 'Formato de teléfono inválido',
  PASSWORD_STRENGTH: 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
  NAME_FORMAT: 'Solo se permiten letras y espacios',
  DATE_FORMAT: 'Formato de fecha inválido',
  NUMBER_FORMAT: 'Debe ser un número válido',
  URL_FORMAT: 'Formato de URL inválido',
  UNIQUE: 'Este valor ya existe',
  MATCH: 'Los valores no coinciden',
  INVALID_CHOICE: 'Opción inválida'
};
