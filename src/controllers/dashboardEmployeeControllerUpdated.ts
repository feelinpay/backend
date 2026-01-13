import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { ResponseHelper } from '../utils/responseHelper';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/responseMessages';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employeeValidators';

const prisma = new PrismaClient();
const employeeRepository = new EmployeeRepository(prisma);

// Obtener todos los empleados del usuario autenticado
export const getMyEmployees = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { page = 1, limit = 10, search, estado, cargo } = req.query;

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    // Obtener empleados con paginación
    const result = await employeeRepository.findByUserId(
      userId,
      pagination.page,
      pagination.limit
    );

    ResponseHelper.paginated(
      res,
      result.empleados,
      {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit)
      },
      SUCCESS_MESSAGES.EMPLOYEES_FOUND
    );

  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Obtener un empleado específico
export const getMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Verificar que el empleado pertenece al usuario
    const employee = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId
      }
    });

    if (!employee) {
      return ResponseHelper.notFound(res, ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    ResponseHelper.success(res, employee, SUCCESS_MESSAGES.EMPLOYEE_FOUND);

  } catch (error) {
    console.error('Error obteniendo empleado:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Crear un nuevo empleado
export const createMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Validar datos de entrada
    const validationResult = createEmployeeSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const employeeData = validationResult.data;

    // Verificar si el teléfono ya existe para este usuario
    const existingEmployee = await prisma.empleado.findFirst({
      where: {
        telefono: employeeData.telefono,
        usuarioId: userId
      }
    });

    if (existingEmployee) {
      return ResponseHelper.conflict(res, ERROR_MESSAGES.EMPLOYEE_ALREADY_EXISTS);
    }

    // Crear empleado usando el repositorio
    const newEmployee = await employeeRepository.create({
      usuarioId: userId,
      nombre: employeeData.nombre,
      telefono: employeeData.telefono
    });

    ResponseHelper.created(res, newEmployee, SUCCESS_MESSAGES.EMPLOYEE_CREATED);

  } catch (error) {
    console.error('Error creando empleado:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Actualizar un empleado
export const updateMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Validar datos de entrada
    const validationResult = updateEmployeeSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return ResponseHelper.validationError(res, errors, ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const updateData = validationResult.data;

    // Verificar que el empleado existe y pertenece al usuario
    const existingEmployee = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId
      }
    });

    if (!existingEmployee) {
      return ResponseHelper.notFound(res, ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    // Verificar si el teléfono ya existe en otro empleado del mismo usuario
    if (updateData.telefono && updateData.telefono !== existingEmployee.telefono) {
      const phoneExists = await prisma.empleado.findFirst({
        where: {
          telefono: updateData.telefono,
          usuarioId: userId,
          id: { not: employeeId }
        }
      });

      if (phoneExists) {
        return ResponseHelper.conflict(res, 'El teléfono ya está en uso por otro empleado');
      }
    }

    // Actualizar empleado usando el repositorio
    const updatedEmployee = await employeeRepository.update(employeeId, updateData);

    ResponseHelper.updated(res, updatedEmployee, SUCCESS_MESSAGES.EMPLOYEE_UPDATED);

  } catch (error) {
    console.error('Error actualizando empleado:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Eliminar un empleado
export const deleteMyEmployee = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { employeeId } = req.params;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Verificar que el empleado existe y pertenece al usuario
    const existingEmployee = await prisma.empleado.findFirst({
      where: {
        id: employeeId,
        usuarioId: userId
      }
    });

    if (!existingEmployee) {
      return ResponseHelper.notFound(res, ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    // Eliminar empleado usando el repositorio
    await employeeRepository.delete(employeeId);

    ResponseHelper.deleted(res, SUCCESS_MESSAGES.EMPLOYEE_DELETED);

  } catch (error) {
    console.error('Error eliminando empleado:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Buscar empleados
export const searchMyEmployees = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { q, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!q) {
      return ResponseHelper.validationError(res, [
        { field: 'q', message: 'Término de búsqueda requerido' }
      ], ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    // Buscar empleados usando el repositorio
    const result = await employeeRepository.searchByUserId(
      userId,
      q as string,
      pagination.page,
      pagination.limit
    );

    ResponseHelper.paginated(
      res,
      result.empleados,
      {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit)
      },
      SUCCESS_MESSAGES.EMPLOYEES_FOUND
    );

  } catch (error) {
    console.error('Error buscando empleados:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Obtener empleados con filtros
export const getMyEmployeesWithFilters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { estado, cargo, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    // Construir filtros para Prisma
    const whereClause: any = {
      usuarioId: userId
    };

    if (estado) {
      whereClause.activo = estado === 'activo';
    }

    // Obtener empleados con filtros
    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        where: whereClause,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.empleado.count({
        where: whereClause
      })
    ]);

    ResponseHelper.paginated(
      res,
      empleados,
      {
        page: pagination.page,
        limit: pagination.limit,
        total: total,
        totalPages: Math.ceil(total / pagination.limit)
      },
      SUCCESS_MESSAGES.EMPLOYEES_FOUND
    );

  } catch (error) {
    console.error('Error obteniendo empleados con filtros:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};

// Obtener estadísticas de empleados
export const getMyEmployeeStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Obtener estadísticas usando el repositorio
    const stats = await employeeRepository.getStatsByUserId(userId);

    ResponseHelper.success(res, stats, SUCCESS_MESSAGES.DATA_RETRIEVED);

  } catch (error) {
    console.error('Error obteniendo estadísticas de empleados:', error);
    ResponseHelper.internalError(res, ERROR_MESSAGES.INTERNAL_ERROR, error);
  }
};