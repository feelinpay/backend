import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/responseHelper';
import { ERROR_MESSAGES } from '../constants/responseMessages';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log del error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Errores de Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = ERROR_MESSAGES.DATABASE_ERROR;
  }

  // Errores de validación
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = ERROR_MESSAGES.TOKEN_INVALID;
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = ERROR_MESSAGES.TOKEN_EXPIRED;
  }

  // Errores de Zod (validación)
  if (error.name === 'ZodError') {
    statusCode = 400;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Errores de rate limiting
  if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }

  // Respuesta de error estandarizada
  ResponseHelper.error(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  ResponseHelper.notFound(res, ERROR_MESSAGES.ENDPOINT_NOT_FOUND);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
