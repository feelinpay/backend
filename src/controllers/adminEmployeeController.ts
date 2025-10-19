import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { 
  createEmployeeForUserSchema,
  updateEmployeeSchema,
  searchEmployeeSchema,
  paginationSchema,
  toggleEmployeeStatusSchema,
  employeeIdSchema,
  employeeFiltersSchema
} from '../validators/employeeValidators';

const prisma = new PrismaClient();
const employeeRepository = new EmployeeRepository(prisma);

// ========================================
// CRUD DE EMPLEADOS PARA SUPER ADMIN
// (Gestionar empleados de cualquier usuario)
// ========================================

// Obtener todos los empleados de un usuario específico
export const getEmployeesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validar ID del usuario
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar parámetros de paginación
    const validationResult = paginationSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de paginación inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { page, limit } = validationResult.data;
    const { empleados, total } = await employeeRepository.findByUserId(userId, page, limit);

    res.json({
      success: true,
      data: {
        empleados,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo empleados del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener empleado específico de un usuario
export const getEmployeeByUser = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Validar IDs
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    if (!employeeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener empleado
    const empleado = await employeeRepository.findById(employeeId);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar que el empleado pertenece al usuario
    if (empleado.usuarioId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para este usuario'
      });
    }

    res.json({
      success: true,
      data: {
        empleado,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo empleado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear empleado para un usuario específico
export const createEmployeeForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validar ID del usuario
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Validar datos de entrada (sin usuarioId en el body, se toma del parámetro)
    const validationResult = createEmployeeForUserSchema.safeParse({
      ...req.body,
      usuarioId: userId
    });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { nombre, telefono } = req.body;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el teléfono no esté en uso por otro empleado del mismo usuario
    const existingEmployee = await employeeRepository.findByPhone(userId, telefono);
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un empleado con este teléfono para este usuario'
      });
    }

    // Crear empleado
    const empleado = await employeeRepository.create({
      usuarioId: userId,
      nombre,
      telefono
    });

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: {
        empleado,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error creando empleado para usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar empleado de un usuario específico
export const updateEmployeeByUser = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Validar IDs
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    if (!employeeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido'
      });
    }

    // Validar datos de actualización
    const dataValidation = updateEmployeeSchema.safeParse(req.body);
    if (!dataValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: dataValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const updateData = dataValidation.data;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el empleado existe y pertenece al usuario
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para este usuario'
      });
    }

    // Si se está actualizando el teléfono, verificar que no esté en uso
    if (updateData.telefono && updateData.telefono !== existingEmployee.telefono) {
      const phoneExists = await employeeRepository.findByPhone(userId, updateData.telefono);
      if (phoneExists && phoneExists.id !== employeeId) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un empleado con este teléfono para este usuario'
        });
      }
    }

    // Actualizar empleado
    const empleado = await employeeRepository.update(employeeId, updateData);

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: {
        empleado,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error actualizando empleado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar estado del empleado de un usuario específico
export const toggleEmployeeStatusByUser = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Validar IDs
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    if (!employeeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido'
      });
    }

    // Validar datos de estado
    const statusValidation = toggleEmployeeStatusSchema.safeParse(req.body);
    if (!statusValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: statusValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { activo } = statusValidation.data;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el empleado existe y pertenece al usuario
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para este usuario'
      });
    }

    // Actualizar estado del empleado
    const empleado = await employeeRepository.update(employeeId, { activo });

    res.json({
      success: true,
      message: `Empleado ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        empleado,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error cambiando estado del empleado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar empleado de un usuario específico
export const deleteEmployeeByUser = async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.params;

    // Validar IDs
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    if (!employeeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el empleado existe y pertenece al usuario
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para este usuario'
      });
    }

    // Eliminar empleado
    await employeeRepository.delete(employeeId);

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error eliminando empleado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar empleados de un usuario específico
export const searchEmployeesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validar ID del usuario
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar parámetros de búsqueda
    const validationResult = searchEmployeeSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { search, page, limit } = validationResult.data;
    const { empleados, total } = await employeeRepository.searchByUserId(userId, search, page, limit);

    res.json({
      success: true,
      data: {
        empleados,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        searchTerm: search
      }
    });
  } catch (error) {
    console.error('Error buscando empleados del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de empleados de un usuario específico
export const getEmployeeStatsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validar ID del usuario
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const stats = await employeeRepository.getStatsByUserId(userId);

    res.json({
      success: true,
      data: {
        stats,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de empleados del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
