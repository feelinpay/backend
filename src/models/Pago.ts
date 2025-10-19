/**
 * Pago domain model
 */
export interface Pago {
  id: string;
  usuarioId: string;
  nombrePagador: string;
  monto: number;
  fecha: Date;
  codigoSeguridad: string;
  registradoEnSheets: boolean;
  notificadoEmpleados: boolean;
  
  // Campos adicionales
  numeroTelefono?: string;
  mensajeOriginal?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
  procesadoAt?: Date;
  
  // Relaciones (commented out to avoid circular dependencies)
  // propietario: Usuario;
}

/**
 * Create Pago DTO
 */
export interface CreatePagoDto {
  usuarioId: string;
  nombrePagador: string;
  monto: number;
  fecha: Date;
  codigoSeguridad: string;
  numeroTelefono?: string;
  mensajeOriginal?: string;
}

/**
 * Update Pago DTO
 */
export interface UpdatePagoDto {
  nombrePagador?: string;
  monto?: number;
  fecha?: Date;
  codigoSeguridad?: string;
  registradoEnSheets?: boolean;
  notificadoEmpleados?: boolean;
  procesadoAt?: Date;
}
