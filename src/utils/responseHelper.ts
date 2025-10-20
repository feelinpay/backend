import { Response } from 'express';

// Tipos para las respuestas estandarizadas
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Clase para manejar respuestas de la API
export class ResponseHelper {
  /**
   * Respuesta de éxito estándar
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Operación exitosa',
    statusCode: number = 200,
    meta?: Partial<ApiResponse['meta']>
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Respuesta de éxito para creación de recursos
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Recurso creado exitosamente'
  ): void {
    this.success(res, data, message, 201);
  }

  /**
   * Respuesta de éxito para actualización de recursos
   */
  static updated<T>(
    res: Response,
    data: T,
    message: string = 'Recurso actualizado exitosamente'
  ): void {
    this.success(res, data, message, 200);
  }

  /**
   * Respuesta de éxito para eliminación de recursos
   */
  static deleted(
    res: Response,
    message: string = 'Recurso eliminado exitosamente'
  ): void {
    this.success(res, null, message, 200);
  }

  /**
   * Respuesta de éxito con paginación
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Datos obtenidos exitosamente'
  ): void {
    this.success(res, data, message, 200, {
      pagination
    });
  }

  /**
   * Respuesta de error de validación
   */
  static validationError(
    res: Response,
    errors: ValidationError[],
    message: string = 'Datos de entrada inválidos'
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors
    };

    res.status(400).json(response);
  }

  /**
   * Respuesta de error de autenticación
   */
  static unauthorized(
    res: Response,
    message: string = 'No autorizado'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(401).json(response);
  }

  /**
   * Respuesta de error de autorización
   */
  static forbidden(
    res: Response,
    message: string = 'Acceso denegado'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(403).json(response);
  }

  /**
   * Respuesta de error de recurso no encontrado
   */
  static notFound(
    res: Response,
    message: string = 'Recurso no encontrado'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(404).json(response);
  }

  /**
   * Respuesta de error de conflicto
   */
  static conflict(
    res: Response,
    message: string = 'Conflicto con el estado actual del recurso'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(409).json(response);
  }

  /**
   * Respuesta de error interno del servidor
   */
  static internalError(
    res: Response,
    message: string = 'Error interno del servidor',
    error?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    // En desarrollo, incluir detalles del error
    if (process.env.NODE_ENV === 'development' && error) {
      (response as any).error = error;
    }

    res.status(500).json(response);
  }

  /**
   * Respuesta de error personalizado
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: ValidationError[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors })
    };

    res.status(statusCode).json(response);
  }

  /**
   * Respuesta de error de rate limiting
   */
  static tooManyRequests(
    res: Response,
    message: string = 'Demasiadas peticiones, intenta más tarde'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(429).json(response);
  }

  /**
   * Respuesta de error de servicio no disponible
   */
  static serviceUnavailable(
    res: Response,
    message: string = 'Servicio temporalmente no disponible'
  ): void {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(503).json(response);
  }
}

// Funciones de conveniencia para respuestas comunes
export const sendSuccess = ResponseHelper.success;
export const sendCreated = ResponseHelper.created;
export const sendUpdated = ResponseHelper.updated;
export const sendDeleted = ResponseHelper.deleted;
export const sendPaginated = ResponseHelper.paginated;
export const sendValidationError = ResponseHelper.validationError;
export const sendUnauthorized = ResponseHelper.unauthorized;
export const sendForbidden = ResponseHelper.forbidden;
export const sendNotFound = ResponseHelper.notFound;
export const sendConflict = ResponseHelper.conflict;
export const sendInternalError = ResponseHelper.internalError;
export const sendError = ResponseHelper.error;
export const sendTooManyRequests = ResponseHelper.tooManyRequests;
export const sendServiceUnavailable = ResponseHelper.serviceUnavailable;
