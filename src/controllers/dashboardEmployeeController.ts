import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { 
  createEmployeeSchema,
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
// CRUD DE EMPLEADOS PARA USUARIOS LOGUEADOS
// (Gestionar empleados del usuario autenticado)
// ========================================

// Obtener todos los empleados del usuario autenticado
export const getMyEmployees = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
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
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo mis empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener empleado específico del usuario autenticado
export const getMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar ID del empleado
    const validationResult = employeeIdSchema.safeParse({ id: employeeId });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const empleado = await employeeRepository.findById(employeeId);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar que el empleado pertenece al usuario autenticado
    if (empleado.usuarioId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este empleado'
      });
    }

    res.json({
      success: true,
      data: empleado
    });
  } catch (error) {
    console.error('Error obteniendo mi empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear empleado para el usuario autenticado
export const createMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar datos de entrada
    const validationResult = createEmployeeSchema.safeParse(req.body);
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

    const { nombre, telefono } = validationResult.data;

    // Verificar que el teléfono no esté en uso por otro empleado del mismo usuario
    const existingEmployee = await employeeRepository.findByPhone(userId, telefono);
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un empleado con este teléfono'
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
      data: empleado
    });
  } catch (error) {
    console.error('Error creando mi empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar empleado del usuario autenticado
export const updateMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar ID del empleado
    const idValidation = employeeIdSchema.safeParse({ id: employeeId });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido',
        errors: idValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
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

    // Verificar que el empleado existe y pertenece al usuario autenticado
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este empleado'
      });
    }

    // Si se está actualizando el teléfono, verificar que no esté en uso
    if (updateData.telefono && updateData.telefono !== existingEmployee.telefono) {
      const phoneExists = await employeeRepository.findByPhone(userId, updateData.telefono);
      if (phoneExists && phoneExists.id !== employeeId) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un empleado con este teléfono'
        });
      }
    }

    // Actualizar empleado
    const empleado = await employeeRepository.update(employeeId, updateData);

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: empleado
    });
  } catch (error) {
    console.error('Error actualizando mi empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar estado del empleado del usuario autenticado
export const toggleMyEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar ID del empleado
    const idValidation = employeeIdSchema.safeParse({ id: employeeId });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido',
        errors: idValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
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

    // Verificar que el empleado existe y pertenece al usuario autenticado
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este empleado'
      });
    }

    // Actualizar estado del empleado
    const empleado = await employeeRepository.update(employeeId, { activo });

    res.json({
      success: true,
      message: `Empleado ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: empleado
    });
  } catch (error) {
    console.error('Error cambiando estado de mi empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar empleado del usuario autenticado
export const deleteMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar ID del empleado
    const validationResult = employeeIdSchema.safeParse({ id: employeeId });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Verificar que el empleado existe y pertenece al usuario autenticado
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    if (existingEmployee.usuarioId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este empleado'
      });
    }

    // Eliminar empleado
    await employeeRepository.delete(employeeId);

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando mi empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar empleados del usuario autenticado
export const searchMyEmployees = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
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
    console.error('Error buscando mis empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener empleados con filtros del usuario autenticado
export const getMyEmployeesWithFilters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar parámetros de filtros
    const validationResult = employeeFiltersSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de filtros inválidos',
        errors: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { status, search, page, limit } = validationResult.data;

    let empleados;
    let total;

    if (search) {
      // Búsqueda con filtros
      const result = await employeeRepository.searchByUserId(userId, search, page, limit);
      empleados = result.empleados;
      total = result.total;
    } else {
      // Obtener todos los empleados
      const result = await employeeRepository.findByUserId(userId, page, limit);
      empleados = result.empleados;
      total = result.total;
    }

    // Aplicar filtro de estado si es necesario
    if (status !== 'all') {
      const isActive = status === 'active';
      empleados = empleados.filter(emp => emp.activo === isActive);
      total = empleados.length;
    }

    res.json({
      success: true,
      data: {
        empleados,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          search: search || ''
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo mis empleados con filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de empleados del usuario autenticado
export const getMyEmployeeStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const stats = await employeeRepository.getStatsByUserId(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de mis empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
