import { OtpCode, CreateOtpCodeDto } from '../models/OtpCode';

export interface IOTPRepository {
  create(data: CreateOtpCodeDto): Promise<OtpCode>;
  findByEmailAndCode(email: string, codigo: string, tipo: string): Promise<OtpCode | null>;
  markAsUsed(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
  findByEmail(email: string, tipo?: string): Promise<OtpCode[]>;
}
