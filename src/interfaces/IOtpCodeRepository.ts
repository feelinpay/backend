import { OtpCode, CreateOtpCodeDto, UpdateOtpCodeDto, ValidateOtpCodeDto } from '../models/OtpCode';

export interface IOtpCodeRepository {
  // Crear código OTP
  crear(data: CreateOtpCodeDto): Promise<OtpCode>;
  
  // Obtener código por email y tipo
  obtenerPorEmailYTipo(email: string, tipo: string): Promise<OtpCode | null>;
  
  // Validar código OTP
  validar(data: ValidateOtpCodeDto): Promise<{ valido: boolean; codigo: OtpCode | null }>;
  
  // Marcar código como usado
  marcarComoUsado(email: string, tipo: string): Promise<OtpCode>;
  
  // Incrementar intentos
  incrementarIntentos(email: string, tipo: string): Promise<OtpCode>;
  
  // Eliminar códigos expirados
  eliminarExpirados(): Promise<number>;
  
  // Eliminar código específico
  eliminar(email: string, tipo: string): Promise<OtpCode>;
  
  // Verificar si existe código válido
  existeCodigoValido(email: string, tipo: string): Promise<boolean>;
  
  // Obtener todos los códigos OTP
  obtenerTodos(search?: string): Promise<OtpCode[]>;
}
