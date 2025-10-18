import rateLimit from 'express-rate-limit';

// Rate limiter general
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para autenticación (más estricto)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 intentos de login por IP (aumentado para desarrollo)
  message: {
    error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para registro (muy estricto)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP por hora
  message: {
    error: 'Demasiados intentos de registro, intenta de nuevo en 1 hora',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para OTP (muy estricto)
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 solicitudes de OTP por IP
  message: {
    error: 'Demasiadas solicitudes de código OTP, intenta de nuevo en 5 minutos',
    code: 'OTP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
