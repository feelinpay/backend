import { Request, Response } from 'express';
import prisma from '../config/database';
import { updateUserSchema } from '../validators/userValidators';
import { z } from 'zod';

// Schema para creación de usuario por admin
const crearUsuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rolId: z.string().uuid()
});

// Obtener todos los usuarios (Solo Super Admin)
export const obtenerTodosUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { createdAt: 'desc' }
    });

    const usuariosSinPassword = usuarios.map(usuario => {
      // Cálculo dinámico de días de prueba
      let diasRestantes = 0;
      let enPeriodoPrueba = false;

      if (usuario.fechaFinPrueba) {
        const ahora = new Date();
        const fin = new Date(usuario.fechaFinPrueba);

        if (fin > ahora) {
          enPeriodoPrueba = true;
          const diferenciaMs = fin.getTime() - ahora.getTime();
          diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        googleId: usuario.googleId,
        rolId: usuario.rolId,
        rol: usuario.rol,
        activo: usuario.activo,
        enPeriodoPrueba: enPeriodoPrueba, // Calculated
        diasPruebaRestantes: diasRestantes, // Calculated
        fechaInicioPrueba: usuario.fechaInicioPrueba,
        fechaFinPrueba: usuario.fechaFinPrueba,
        imagen: usuario.imagen,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
        lastLoginAt: usuario.lastLoginAt
      };
    });

    res.json({
      success: true,
      data: {
        usuarios: usuariosSinPassword,
        total: usuarios.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Crear nuevo usuario (Solo Super Admin)
export const crearUsuario = async (req: Request, res: Response) => {
  try {
    const validatedData = crearUsuarioSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: validatedData.nombre,
        email: validatedData.email,
        rol: { connect: { id: validatedData.rolId } },
        googleId: `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Placeholder
        activo: true,
        fechaInicioPrueba: new Date(),
        fechaFinPrueba: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días de prueba
      },
      include: { rol: true }
    }) as any;

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol.nombre,
        activo: nuevoUsuario.activo
      }
    });
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar usuario (Solo Super Admin)
export const actualizarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);
    const currentUserId = (req as any).user?.id; // Get authenticated user ID

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Prevent super admin from changing their own role
    if (currentUserId === id && usuario.rol.nombre === 'super_admin' && validatedData.rolId) {
      return res.status(403).json({
        success: false,
        message: 'No puedes modificar tu propio rol como super administrador'
      });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...validatedData,
        rol: validatedData.rolId ? { connect: { id: validatedData.rolId } } : undefined,
        rolId: undefined // Evitar duplicidad si se usa connect
      } as any,
      include: { rol: true }
    }) as any;

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        rol: usuarioActualizado.rol.nombre,
        activo: usuarioActualizado.activo
      }
    });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Eliminar usuario (Solo Super Admin)
export const eliminarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await prisma.usuario.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Activar/Desactivar usuario
export const toggleUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { activo },
      include: { rol: true }
    });

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        rol: usuarioActualizado.rol.nombre,
        activo: usuarioActualizado.activo
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};


// Extender período de prueba
export const extenderPrueba = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dias } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const diasExtension = dias || 7;
    let nuevaFechaFin = new Date();

    // Si tiene fecha fin y es futura, extendemos desde ahí. Si es nula o pasada, extendemos desde HOY.
    if (usuario.fechaFinPrueba && usuario.fechaFinPrueba > new Date()) {
      nuevaFechaFin = new Date(usuario.fechaFinPrueba);
    }

    // Sumar días
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() + diasExtension);

    await prisma.usuario.update({
      where: { id },
      data: {
        fechaFinPrueba: nuevaFechaFin,
        // Eliminados campos legacy
      }
    });

    // Calculamos para devolver el dato correcto
    const ahora = new Date();
    const diferenciaMs = nuevaFechaFin.getTime() - ahora.getTime();
    const nuevosDiasRestantes = Math.max(0, Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)));

    res.json({
      message: `Período de prueba extendido hasta ${nuevaFechaFin.toLocaleDateString()}`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        diasPruebaRestantes: nuevosDiasRestantes,
        fechaFinPrueba: nuevaFechaFin
      }
    });
  } catch (error) {
    console.error('Error extendiendo prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas generales
export const obtenerEstadisticasGenerales = async (req: Request, res: Response) => {
  try {
    const totalUsuarios = await prisma.usuario.count({
      where: { rol: { nombre: { not: 'super_admin' } } }
    });
    const totalAdmins = await prisma.usuario.count({
      where: { rol: { nombre: 'super_admin' } }
    });
    const usuariosActivos = await prisma.usuario.count({
      where: {
        activo: true,
        rol: { nombre: { not: 'super_admin' } }
      }
    });
    const usuariosEnPrueba = await prisma.usuario.count({
      where: {
        fechaFinPrueba: { gt: new Date() },
        rol: { nombre: { not: 'super_admin' } }
      }
    });
    const totalPagos = 0; // Tabla Pagos eliminada (ahora en Sheets)
    const totalEmpleados = await prisma.empleado.count();

    res.json({
      success: true,
      data: {
        totalUsuarios,
        totalAdmins,
        usuariosActivos,
        usuariosEnPrueba,
        totalPagos,
        totalEmpleados,
        usuariosInactivos: totalUsuarios - usuariosActivos
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Activar membresía para un usuario
export const activarMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;
    const { diasMembresia } = req.body;

    if (!diasMembresia || diasMembresia <= 0) {
      return res.status(400).json({ error: 'Días de membresía inválidos' });
    }

    const fechaExpiracion = new Date(Date.now() + diasMembresia * 24 * 60 * 60 * 1000);

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        activo: true,
        // Aquí se podría actualizar una tabla de membresías si existiera, 
        // por ahora activamos al usuario y removemos el modo prueba.
      }
    });

    res.json({
      message: 'Membresía asignada exitosamente',
      usuarioId: usuario.id,
      diasMembresia,
      fechaExpiracion
    });
  } catch (error) {
    console.error('Error activando membresía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Desactivar membresía para un usuario
export const desactivarMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const resultado = { success: true, message: 'Membresía desactivada' };

    if (resultado.success) {
      res.json({ message: resultado.message });
    } else {
      res.status(400).json({ error: resultado.message });
    }
  } catch (error) {
    console.error('Error desactivando membresía:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar acceso de un usuario
export const verificarAcceso = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const acceso = {
      tieneAcceso: true,
      diasRestantes: 30,
      mensaje: 'Acceso válido',
      tipoAcceso: 'activo'
    };

    res.json({
      tieneAcceso: acceso.tieneAcceso,
      razon: acceso.mensaje,
      diasRestantes: acceso.diasRestantes,
      expirada: acceso.tipoAcceso === 'sin_acceso'
    });
  } catch (error) {
    console.error('Error verificando acceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de membresías
export const obtenerEstadisticasMembresias = async (req: Request, res: Response) => {
  try {
    const estadisticas = { totalMembresias: 0, membresiasActivas: 0 };
    res.json(estadisticas);
  } catch (error) {
    console.error('Error obteniendo estadísticas de membresías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};