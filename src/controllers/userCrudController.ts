import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppConfig } from '../config/appConfig';

const prisma = new PrismaClient();

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Calcular días de prueba restantes basado en la fecha de inicio
const calcularDiasPruebaRestantes = (fechaInicio: Date | null, diasTotales: number): number => {
  if (!fechaInicio) return 0;
  
  const ahora = new Date();
  const diasTranscurridos = Math.floor((ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
  const diasRestantes = Math.max(0, diasTotales - diasTranscurridos);
  
  return diasRestantes;
};

// Determinar si un usuario puede tener período de prueba
const puedeTenerPeriodoPrueba = (rol: string, fechaInicioPrueba: Date | null): {
  enPeriodoPrueba: boolean;
  diasPruebaRestantes: number;
  fechaInicioPrueba: Date | null;
} => {
  if (rol !== 'propietario') {
    return {
      enPeriodoPrueba: false,
      diasPruebaRestantes: 0,
      fechaInicioPrueba: null
    };
  }

  // Si nunca tuvo período de prueba, asignar uno nuevo
  if (!fechaInicioPrueba) {
    return {
      enPeriodoPrueba: true,
      diasPruebaRestantes: AppConfig.membership.trialDays,
      fechaInicioPrueba: new Date()
    };
  }

  // Calcular días restantes del período original
  const diasRestantes = calcularDiasPruebaRestantes(fechaInicioPrueba, AppConfig.membership.trialDays);
  
  if (diasRestantes > 0) {
    return {
      enPeriodoPrueba: true,
      diasPruebaRestantes: diasRestantes,
      fechaInicioPrueba: fechaInicioPrueba
    };
  } else {
    // Período de prueba ya consumido
    return {
      enPeriodoPrueba: false,
      diasPruebaRestantes: 0,
      fechaInicioPrueba: fechaInicioPrueba
    };
  }
};

// ========================================
// CRUD COMPLETO DE USUARIOS (SUPER ADMIN)
// ========================================

// CREATE - Crear usuario
export const createUser = async (req: Request, res: Response) => {
  try {
    const { 
      nombre, 
      telefono, 
      email, 
      password, 
      rolId
    } = req.body;

    // Validaciones básicas
    if (!nombre || !telefono || !email || !password || !rolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de email inválido' 
      });
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña debe tener al menos 8 caracteres' 
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

    // Verificar si el rol existe y obtener información del rol
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

    // Determinar días de prueba según el rol
    const periodoPrueba = puedeTenerPeriodoPrueba(rol.nombre, null);

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
        activo: true,
        enPeriodoPrueba: periodoPrueba.enPeriodoPrueba,
        diasPruebaRestantes: periodoPrueba.diasPruebaRestantes,
        fechaInicioPrueba: periodoPrueba.fechaInicioPrueba,
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

// READ - Obtener todos los usuarios
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

// READ - Obtener usuario por ID
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
        updatedAt: usuario.updatedAt
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

// UPDATE - Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      telefono, 
      email, 
      rolId,
      activo,
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

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Formato de email inválido' 
        });
      }

      // Verificar si el email ya existe en otro usuario
      if (email !== existingUser.email) {
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

// DELETE - Desactivar usuario (soft delete)
export const deleteUser = async (req: Request, res: Response) => {
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

    // Verificar si ya está desactivado
    if (!usuario.activo) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario ya está desactivado' 
      });
    }

    // Desactivar usuario (soft delete)
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
        rol: usuarioDesactivado.rol?.nombre,
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

// REACTIVAR - Reactivar usuario desactivado
export const reactivateUser = async (req: Request, res: Response) => {
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

    // Verificar si ya está activo
    if (usuario.activo) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario ya está activo' 
      });
    }

    // Determinar días de prueba según el rol y estado previo
    const periodoPrueba = puedeTenerPeriodoPrueba(
      usuario.rol?.nombre || '', 
      usuario.fechaInicioPrueba
    );

    // Reactivar usuario
    const usuarioReactivado = await prisma.usuario.update({
      where: { id },
      data: { 
        activo: true,
        enPeriodoPrueba: periodoPrueba.enPeriodoPrueba,
        diasPruebaRestantes: periodoPrueba.diasPruebaRestantes,
        fechaInicioPrueba: periodoPrueba.fechaInicioPrueba
      },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: 'Usuario reactivado exitosamente',
      data: {
        id: usuarioReactivado.id,
        nombre: usuarioReactivado.nombre,
        email: usuarioReactivado.email,
        rol: usuarioReactivado.rol?.nombre,
        activo: usuarioReactivado.activo,
        enPeriodoPrueba: usuarioReactivado.enPeriodoPrueba,
        diasPruebaRestantes: usuarioReactivado.diasPruebaRestantes,
        reactivadoEn: new Date()
      }
    });

  } catch (error) {
    console.error('Error reactivando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// EXTENDER PRUEBA - Extender período de prueba de un usuario
export const extenderPeriodoPrueba = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diasAdicionales } = req.body;

    if (!diasAdicionales || diasAdicionales <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar días adicionales válidos'
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

    // Solo propietarios pueden tener período de prueba
    if (usuario.rol?.nombre !== 'propietario') {
      return res.status(400).json({
        success: false,
        message: 'Solo los propietarios pueden tener período de prueba'
      });
    }

    // Calcular nuevos días de prueba
    const diasActuales = usuario.diasPruebaRestantes || 0;
    const nuevosDias = diasActuales + diasAdicionales;
    const fechaInicio = usuario.fechaInicioPrueba || new Date();

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        enPeriodoPrueba: true,
        diasPruebaRestantes: nuevosDias,
        fechaInicioPrueba: fechaInicio
      },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: `Período de prueba extendido por ${diasAdicionales} días`,
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        diasPruebaRestantes: usuarioActualizado.diasPruebaRestantes,
        fechaInicioPrueba: usuarioActualizado.fechaInicioPrueba,
        diasAdicionales,
        extendidoEn: new Date()
      }
    });

  } catch (error) {
    console.error('Error extendiendo período de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ========================================
// FUNCIONES ADICIONALES PARA SUPER ADMIN
// ========================================

// Cambiar contraseña de usuario (Super Admin)
export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

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

    // Si no se envía contraseña o está vacía, mantener la actual
    if (!newPassword || newPassword.trim() === '') {
      return res.json({
        success: true,
        message: 'Contraseña mantenida (no se envió nueva contraseña)',
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          contraseñaActualizada: false
        }
      });
    }

    // Validar longitud de contraseña si se proporciona
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
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
        rol: usuario.rol?.nombre,
        contraseñaActualizada: true,
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

// Activar/Desactivar usuario
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
    if (!activo && usuario.rol?.nombre === 'super_admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede desactivar el super administrador' 
      });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { activo },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        activo: usuarioActualizado.activo
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

// Obtener estadísticas de usuarios
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosVerificados,
      usuariosEnPrueba
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.usuario.count({ where: { emailVerificado: true } }),
      prisma.usuario.count({ where: { enPeriodoPrueba: true } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsuarios,
        usuariosActivos,
        usuariosVerificados,
        usuariosEnPrueba,
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

// Obtener roles disponibles
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
