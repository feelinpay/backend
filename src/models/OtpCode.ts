// Interfaces para OtpCode
export interface OtpCode {
  id: string;
  email: string;
  codigo: string;
  tipo: string; // "EMAIL_VERIFICATION", "PASSWORD_RESET", "LOGIN_VERIFICATION"
  expiraEn: Date;
  usado: boolean;
  intentos: number;
  maxIntentos: number;
  createdAt: Date;
}

export interface CreateOtpCodeDto {
  email: string;
  codigo: string;
  tipo: string;
  expiraEn: Date;
  maxIntentos?: number;
}

export interface UpdateOtpCodeDto {
  usado?: boolean;
  intentos?: number;
}

export interface ValidateOtpCodeDto {
  email: string;
  codigo: string;
  tipo: string;
}