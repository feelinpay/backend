import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware para detectar intentos de hacking
export const detectHackingAttempts = async (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /script\s*>/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /<script/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /cmd\s*=/i,
    /\.\.\//i, // Path traversal
    /\.\.\\/i, // Path traversal
    /null\s+byte/i,
    /%00/i, // Null byte
    /%2e%2e/i, // URL encoded path traversal
  ];

  const checkSuspiciousContent = (content: any): boolean => {
    if (typeof content === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(content));
    }
    if (typeof content === 'object' && content !== null) {
      return Object.values(content).some(checkSuspiciousContent);
    }
    return false;
  };

  // Verificar body, query y params
  const isSuspicious = 
    checkSuspiciousContent(req.body) ||
    checkSuspiciousContent(req.query) ||
    checkSuspiciousContent(req.params);

  if (isSuspicious) {
    // Log del intento de hacking
    console.warn('🚨 INTENTO DE HACKING DETECTADO:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString()
    });

    // Registrar en auditoría si hay usuario autenticado
    if (req.user) {
      try {
        console.log('🚨 Intento de hacking detectado:', {
          usuarioId: (req as any).user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error registrando intento de hacking:', error);
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado por seguridad',
      code: 'SECURITY_VIOLATION'
    });
  }

  next();
};

// Middleware para validar tokens JWT
export const validateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido',
      code: 'MISSING_TOKEN'
    });
  }

  // Verificar formato del token
  if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
    return res.status(401).json({
      success: false,
      error: 'Formato de token inválido',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  next();
};

// Middleware para verificar permisos específicos
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'ID de usuario no válido',
          code: 'INVALID_USER_ID'
        });
      }

      // PermissionService removed - using basic role check
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        include: { rol: true }
      });
      const hasPermission = user?.rol?.nombre === 'super_admin';

      if (!hasPermission) {
        // Registrar intento de acceso no autorizado
        try {
          const userId = (req as any).user?.id;
          if (userId && typeof userId === 'string') {
            console.log('🚨 Acceso no autorizado detectado:', {
              usuarioId: userId,
              permission,
              url: req.originalUrl,
              method: req.method,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error registrando acceso no autorizado:', error);
        }

        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno verificando permisos',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

// Middleware para verificar que el usuario es Super Admin
export const requireSuperAdmin = requirePermission('usuarios_create');

// Middleware para verificar que el usuario puede gestionar usuarios
export const requireUserManagement = requirePermission('usuarios_read');

// Middleware para verificar que el usuario puede gestionar empleados
export const requireEmployeeManagement = requirePermission('empleados_read');

// Middleware para verificar que el usuario puede ver reportes
export const requireReportsAccess = requirePermission('reportes_read');

// Middleware para limitar tamaño de requests
export const limitRequestSize = (maxSize: number = 1024 * 1024) => { // 1MB por defecto
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request demasiado grande',
        code: 'REQUEST_TOO_LARGE',
        maxSize: maxSize
      });
    }
    
    next();
  };
};

// Middleware para verificar IPs bloqueadas
export const checkBlockedIPs = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  
  // Lista de IPs bloqueadas (en producción esto vendría de una base de datos)
  const blockedIPs = [
    '127.0.0.1', // Ejemplo - en producción esto sería dinámico
  ];
  
  if (clientIP && blockedIPs.includes(clientIP)) {
    console.warn('🚫 IP bloqueada intentando acceso:', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({
      success: false,
      error: 'IP bloqueada',
      code: 'IP_BLOCKED'
    });
  }
  
  next();
};

// Middleware para verificar headers de seguridad
export const checkSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Agregar headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};
