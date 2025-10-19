import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Obtener todos los usuarios (solo super admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { telefono: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.rol = { nombre: role as string };
    }

    // Filtro por estado (activo/inactivo)
    if (status === 'active') {
      where.activo = true;
    } else if (status === 'inactive') {
      where.activo = false;
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: { rol: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.usuario.count({ where })
    ]);

    // Remover contraseñas de la respuesta
    const usuariosSinPassword = usuarios.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol.nombre,
      activo: user.activo,
      emailVerificado: user.emailVerificado,
      enPeriodoPrueba: user.enPeriodoPrueba,
      diasPruebaRestantes: user.diasPruebaRestantes,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({
      success: true,
      data: {
        usuarios: usuariosSinPassword,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol?.nombre || 'Sin rol',
        activo: usuario.activo,
        emailVerificado: usuario.emailVerificado,
        enPeriodoPrueba: usuario.enPeriodoPrueba,
        diasPruebaRestantes: usuario.diasPruebaRestantes,
        createdAt: usuario.createdAt,
        lastLoginAt: usuario.lastLoginAt,
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Crear usuario (solo super admin)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { 
      nombre, 
      telefono, 
      email, 
      password, 
      rolId,
      activo = true,
      licenciaActiva = false,
      diasPruebaRestantes = 0
    } = req.body;

    // Validaciones
    if (!nombre || !telefono || !email || !password || !rolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Verificar si el rol existe
    const rol = await prisma.rol.findUnique({
      where: { id: rolId }
    });

    if (!rol) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rol no válido' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        nombre,
        telefono,
        email,
        password: hashedPassword,
        rolId,
        googleSpreadsheetId: `sheet_${uuidv4()}`,
        activo,
        enPeriodoPrueba: diasPruebaRestantes > 0,
        diasPruebaRestantes,
        emailVerificado: false,
      },
      include: { rol: true }
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol?.nombre || 'Sin rol',
        activo: usuario.activo,
        emailVerificado: usuario.emailVerificado,
        enPeriodoPrueba: usuario.enPeriodoPrueba,
        diasPruebaRestantes: usuario.diasPruebaRestantes,
        createdAt: usuario.createdAt
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      telefono, 
      email, 
      rolId,
      activo,
      licenciaActiva,
      diasPruebaRestantes,
      emailVerificado
    } = req.body;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar si el email ya existe en otro usuario
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.usuario.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(409).json({ 
          success: false, 
          message: 'El email ya está registrado por otro usuario' 
        });
      }
    }

    // Verificar rol si se proporciona
    if (rolId) {
      const rol = await prisma.rol.findUnique({
        where: { id: rolId }
      });

      if (!rol) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rol no válido' 
        });
      }
    }

    // Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(telefono && { telefono }),
        ...(email && { email }),
        ...(rolId && { rolId }),
        ...(typeof activo === 'boolean' && { activo }),
        ...(typeof licenciaActiva === 'boolean' && { licenciaActiva }),
        ...(typeof diasPruebaRestantes === 'number' && { 
          diasPruebaRestantes,
          enPeriodoPrueba: diasPruebaRestantes > 0
        }),
        ...(typeof emailVerificado === 'boolean' && { 
          emailVerificado,
          ...(emailVerificado && { emailVerificadoAt: new Date() })
        })
      },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol?.nombre || 'Sin rol',
        activo: usuario.activo,
        emailVerificado: usuario.emailVerificado,
        enPeriodoPrueba: usuario.enPeriodoPrueba,
        diasPruebaRestantes: usuario.diasPruebaRestantes,
        updatedAt: usuario.updatedAt
      }
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Desactivar/Activar usuario
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado de activación requerido' 
      });
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { activo },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        activo: usuario.activo
      }
    });

  } catch (error) {
    console.error('Error cambiando estado del usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Desactivar usuario (en lugar de eliminar)
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // No permitir desactivar super admin
    if (usuario.rol?.nombre === 'super_admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede desactivar el super administrador' 
      });
    }

    // Desactivar usuario (no eliminar)
    const usuarioDesactivado = await prisma.usuario.update({
      where: { id },
      data: { 
        activo: false,
        enPeriodoPrueba: false,
        diasPruebaRestantes: 0
      },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      data: {
        id: usuarioDesactivado.id,
        nombre: usuarioDesactivado.nombre,
        email: usuarioDesactivado.email,
        activo: usuarioDesactivado.activo,
        desactivadoEn: new Date()
      }
    });

  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Cambiar contraseña de usuario (solo super admin)
export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        actualizadoEn: new Date()
      }
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar email de usuario (solo super admin - sin verificación)
export const changeUserEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newEmail } = req.body;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el nuevo email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: newEmail }
    });

    if (existingUser && existingUser.id !== id) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado por otro usuario'
      });
    }

    // Actualizar email (sin verificación para super admin)
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { 
        email: newEmail,
        emailVerificado: true, // Marcar como verificado automáticamente
        emailVerificadoAt: new Date()
      },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: 'Email actualizado exitosamente',
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        emailVerificado: usuarioActualizado.emailVerificado,
        actualizadoEn: new Date()
      }
    });

  } catch (error) {
    console.error('Error cambiando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los roles disponibles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.rol.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de usuarios
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosVerificados,
      usuariosEnPrueba,
      usuariosConLicencia
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.usuario.count({ where: { emailVerificado: true } }),
      prisma.usuario.count({ where: { enPeriodoPrueba: true } }),
      prisma.usuario.count({ where: { activo: true } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsuarios,
        usuariosActivos,
        usuariosVerificados,
        usuariosEnPrueba,
        usuariosConLicencia,
        usuariosInactivos: totalUsuarios - usuariosActivos,
        usuariosSinVerificar: totalUsuarios - usuariosVerificados
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Exportar usuarios a CSV (solo super admin)
export const exportUsers = async (req: Request, res: Response) => {
  try {
    const { format = 'csv' } = req.query;

    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Crear CSV
      const csvHeader = 'ID,Nombre,Email,Teléfono,Rol,Activo,Email Verificado,En Prueba,Días Prueba,Creado,Último Login\n';
      const csvData = usuarios.map(user => 
        `${user.id},${user.nombre},${user.email},${user.telefono},${user.rol?.nombre || 'Sin rol'},${user.activo},${user.emailVerificado},${user.enPeriodoPrueba},${user.diasPruebaRestantes},${user.createdAt.toISOString()},${user.lastLoginAt?.toISOString() || 'Nunca'}\n`
      ).join('');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=usuarios.csv');
      res.send(csvHeader + csvData);
    } else {
      // JSON por defecto
      const usuariosSinPassword = usuarios.map(user => ({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol?.nombre || 'Sin rol',
        activo: user.activo,
        emailVerificado: user.emailVerificado,
        enPeriodoPrueba: user.enPeriodoPrueba,
        diasPruebaRestantes: user.diasPruebaRestantes,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }));

      res.json({
        success: true,
        data: usuariosSinPassword
      });
    }

  } catch (error) {
    console.error('Error exportando usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Buscar usuarios por múltiples criterios
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { 
      query = '', 
      role = '', 
      status = '', 
      verified = '', 
      trial = '',
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Búsqueda por texto
    if (query) {
      where.OR = [
        { nombre: { contains: query as string, mode: 'insensitive' } },
        { email: { contains: query as string, mode: 'insensitive' } },
        { telefono: { contains: query as string, mode: 'insensitive' } }
      ];
    }

    // Filtro por rol
    if (role) {
      where.rol = { nombre: role as string };
    }

    // Filtro por estado
    if (status === 'active') {
      where.activo = true;
    } else if (status === 'inactive') {
      where.activo = false;
    }

    // Filtro por verificación de email
    if (verified === 'true') {
      where.emailVerificado = true;
    } else if (verified === 'false') {
      where.emailVerificado = false;
    }

    // Filtro por período de prueba
    if (trial === 'true') {
      where.enPeriodoPrueba = true;
    } else if (trial === 'false') {
      where.enPeriodoPrueba = false;
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: { rol: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.usuario.count({ where })
    ]);

    const usuariosSinPassword = usuarios.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol?.nombre || 'Sin rol',
      activo: user.activo,
      emailVerificado: user.emailVerificado,
      enPeriodoPrueba: user.enPeriodoPrueba,
      diasPruebaRestantes: user.diasPruebaRestantes,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({
      success: true,
      data: {
        usuarios: usuariosSinPassword,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        filters: {
          query,
          role,
          status,
          verified,
          trial
        }
      }
    });

  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener actividad reciente de usuarios
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    // Obtener usuarios que han iniciado sesión recientemente
    const usuariosRecientes = await prisma.usuario.findMany({
      where: {
        lastLoginAt: {
          not: null
        }
      },
      include: { rol: true },
      orderBy: { lastLoginAt: 'desc' },
      take: Number(limit)
    });

    const actividad = usuariosRecientes.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol?.nombre || 'Sin rol',
      lastLoginAt: user.lastLoginAt,
      activo: user.activo,
      emailVerificado: user.emailVerificado
    }));

    res.json({
      success: true,
      data: {
        actividad,
        total: actividad.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};