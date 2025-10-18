import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const AppConfig = {
  // Configuración del servidor
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0', // Escuchar en todas las interfaces
    url: process.env.SERVER_URL || 'http://localhost:3001',
  },

  // Configuración de base de datos
  database: {
    url: process.env.DATABASE_URL || 'file:./feelin_pay.db',
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret_default_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Configuración de email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'Feelin Pay <noreply@feelinpay.com>',
    fromName: process.env.EMAIL_FROM_NAME || 'Feelin Pay',
  },

  // Configuración de OTP
  otp: {
    expirationMinutes: parseInt(process.env.OTP_EXPIRATION_MINUTES || '10'),
    maxAttemptsPerDay: parseInt(process.env.OTP_MAX_ATTEMPTS_PER_DAY || '5'),
    maxVerificationAttempts: parseInt(process.env.OTP_MAX_VERIFICATION_ATTEMPTS || '3'),
    minIntervalMinutes: parseInt(process.env.OTP_MIN_INTERVAL_MINUTES || '5'),
  },

  // Configuración de limpieza automática
  cleanup: {
    unverifiedUserCleanupDays: parseInt(process.env.UNVERIFIED_USER_CLEANUP_DAYS || '7'),
    otpCleanupIntervalMinutes: parseInt(process.env.OTP_CLEANUP_INTERVAL_MINUTES || '30'),
    dailyResetHour: parseInt(process.env.DAILY_RESET_HOUR || '2'),
  },

  // Configuración de seguridad
  security: {
    rateLimitRequestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100'),
    rateLimitRequestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '1000'),
    blockDurationMinutes: parseInt(process.env.BLOCK_DURATION_MINUTES || '15'),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  },

  // Configuración de membresías
  membership: {
    trialDays: parseInt(process.env.TRIAL_DAYS || '3'),
    monthlyPrice: parseFloat(process.env.MONTHLY_MEMBERSHIP_PRICE || '29.90'),
  },

  // Configuración de SMS (opcional)
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.SMS_ACCOUNT_SID || '',
    authToken: process.env.SMS_AUTH_TOKEN || '',
    fromNumber: process.env.SMS_FROM_NUMBER || '',
  },

  // Configuración de Google Sheets (opcional)
  googleSheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED === 'true',
    credentialsPath: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || '',
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  },

  // Configuración de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  // Configuración de desarrollo
  development: {
    debugMode: process.env.DEBUG_MODE === 'true',
    autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED === 'true',
    scheduledJobsEnabled: process.env.SCHEDULED_JOBS_ENABLED === 'true',
  },

  // Configuración de CORS
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origin: process.env.CORS_ORIGIN || '*', // Permitir todos los orígenes para desarrollo
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization',
  },
};

// Validar configuración crítica
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar JWT secret en producción
  if (AppConfig.server.nodeEnv === 'production' && AppConfig.jwt.secret === 'jwt_secret_default_change_in_production') {
    errors.push('JWT_SECRET debe ser cambiado en producción');
  }

  // Validar email en producción
  if (AppConfig.server.nodeEnv === 'production' && (!AppConfig.email.user || !AppConfig.email.pass)) {
    errors.push('Configuración de email requerida en producción');
  }

  // Validar base de datos
  if (!AppConfig.database.url) {
    errors.push('DATABASE_URL es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Función para obtener configuración de OTP con valores por defecto
export const getOTPConfig = () => ({
  expirationMinutes: AppConfig.otp.expirationMinutes,
  maxAttemptsPerDay: AppConfig.otp.maxAttemptsPerDay,
  maxVerificationAttempts: AppConfig.otp.maxVerificationAttempts,
  minIntervalMinutes: AppConfig.otp.minIntervalMinutes,
});

// Función para obtener configuración de limpieza
export const getCleanupConfig = () => ({
  unverifiedUserCleanupDays: AppConfig.cleanup.unverifiedUserCleanupDays,
  otpCleanupIntervalMinutes: AppConfig.cleanup.otpCleanupIntervalMinutes,
  dailyResetHour: AppConfig.cleanup.dailyResetHour,
});

// Función para verificar si está en modo desarrollo
export const isDevelopment = () => AppConfig.server.nodeEnv === 'development';

// Función para verificar si está en modo producción
export const isProduction = () => AppConfig.server.nodeEnv === 'production';
