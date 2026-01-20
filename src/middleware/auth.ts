import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Validar que JWT_SECRET esté configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET no está configurado en las variables de entorno');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token inválido: ID de usuario no encontrado' });
    }

    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { rol: true }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    (req as any).user = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
      googleId: usuario.googleId
    };

    // DEBUG: Log para diagnosticar 403
    console.log('✅ [AUTH] Usuario autenticado:', {
      email: usuario.email,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
      path: req.path
    });

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Middleware para verificar roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.rol;

    if (!userRole) {
      return res.status(403).json({ error: 'Rol no definido' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado: No tienes permisos suficientes'
      });
    }

    next();
  };
};