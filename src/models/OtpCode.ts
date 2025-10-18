/**
 * OtpCode domain model
 */
export interface OtpCode {
  id: string;
  email: string;
  codigo: string;
  tipo: string;
  expiraEn: Date;
  usado: boolean;
  intentos: number;
  maxIntentos: number;
  createdAt: Date;
}

/**
 * Create OtpCode DTO
 */
export interface CreateOtpCodeDto {
  email: string;
  codigo: string;
  tipo: string;
  expiraEn: Date;
  maxIntentos?: number;
}

/**
 * Update OtpCode DTO
 */
export interface UpdateOtpCodeDto {
  usado?: boolean;
  intentos?: number;
}

/**
 * OTP verification DTO
 */
export interface OTPVerificationDto {
  code: string;
  userId: number;
}

/**
 * OTP generation DTO
 */
export interface OTPGenerationDto {
  userId: number;
  type: string;
  expirationMinutes?: number;
}

/**
 * OtpCode types enum
 */
export enum OtpCodeType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN_2FA = 'LOGIN_2FA',
  EMAIL_CHANGE = 'EMAIL_CHANGE'
}
