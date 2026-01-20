import { Request, Response, NextFunction } from 'express';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (user.rol !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de super administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de super admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
