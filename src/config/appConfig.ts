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
    url: process.env.DATABASE_URL as string, // MySQL requerido
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET as string, // Requerido
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  // Validar DATABASE_URL
  if (!AppConfig.database.url) {
    errors.push('DATABASE_URL es requerida');
  }

  // Validar JWT_SECRET
  if (!AppConfig.jwt.secret) {
    errors.push('JWT_SECRET es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};





// Función para verificar si está en modo desarrollo
export const isDevelopment = () => AppConfig.server.nodeEnv === 'development';

// Función para verificar si está en modo producción
export const isProduction = () => AppConfig.server.nodeEnv === 'production';
