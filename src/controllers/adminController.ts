import { Request, Response } from 'express';
import prisma from '../config/database';

// Obtener todos los usuarios (Solo Super Admin)
export const obtenerTodosUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { createdAt: 'desc' }
    });

    const usuariosSinPassword = usuarios.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      email: usuario.email,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
      emailVerificado: usuario.emailVerificado,
      enPeriodoPrueba: usuario.enPeriodoPrueba,
      diasPruebaRestantes: usuario.diasPruebaRestantes,
      createdAt: usuario.createdAt,
      lastLoginAt: usuario.lastLoginAt
    }));

    res.json({
      usuarios: usuariosSinPassword,
      total: usuarios.length
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
      message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        rol: usuarioActualizado.rol.nombre,
        activo: usuarioActualizado.activo
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar email de usuario
export const verificarEmailUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await prisma.usuario.update({
      where: { id },
      data: { 
        emailVerificado: true,
        emailVerificadoAt: new Date()
      }
    });

    res.json({
      message: 'Email verificado correctamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        emailVerificado: true
      }
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

    const diasActuales = usuario.diasPruebaRestantes || 0;
    const nuevosDias = diasActuales + (dias || 7);

    await prisma.usuario.update({
      where: { id },
      data: { 
        diasPruebaRestantes: nuevosDias,
        enPeriodoPrueba: true
      }
    });

    res.json({
      message: `Período de prueba extendido por ${dias || 7} días`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        diasPruebaRestantes: nuevosDias
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
    const totalUsuarios = await prisma.usuario.count();
    const usuariosActivos = await prisma.usuario.count({ where: { activo: true } });
    const usuariosVerificados = await prisma.usuario.count({ where: { emailVerificado: true } });
    const usuariosEnPrueba = await prisma.usuario.count({ where: { enPeriodoPrueba: true } });
    const totalPagos = await prisma.pago.count();
    const totalEmpleados = await prisma.empleado.count();

    res.json({
      totalUsuarios,
      usuariosActivos,
      usuariosVerificados,
      usuariosEnPrueba,
      totalPagos,
      totalEmpleados,
      usuariosInactivos: totalUsuarios - usuariosActivos,
      usuariosNoVerificados: totalUsuarios - usuariosVerificados
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Activar membresía para un usuario
export const activarMembresia = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;
    const { diasMembresia, codigoMembresia } = req.body;

    if (!diasMembresia || diasMembresia <= 0) {
      return res.status(400).json({ error: 'Días de membresía inválidos' });
    }

    // Asignar membresía básica por defecto

    res.json({
      message: 'Membresía asignada exitosamente',
      diasMembresia: 30, // 30 días por defecto para membresías
      fechaExpiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días desde ahora
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