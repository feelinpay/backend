import { PrismaClient } from '@prisma/client';
import { IOTPRepository } from '../interfaces/IOTPRepository';
import { OtpCode, CreateOtpCodeDto } from '../models/OtpCode';

export class OTPRepository implements IOTPRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateOtpCodeDto): Promise<OtpCode> {
    const otp = await this.prisma.otpCode.create({
      data
    });
    return otp;
  }

  async findByEmailAndCode(email: string, codigo: string, tipo: string): Promise<OtpCode | null> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        email,
        codigo,
        tipo,
        usado: false,
        expiraEn: { gt: new Date() }
      }
    });
    return otp;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { usado: true }
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.otpCode.deleteMany({
      where: {
        OR: [
          { expiraEn: { lt: new Date() } },
          { usado: true }
        ]
      }
    });
  }

  async findByEmail(email: string, tipo?: string): Promise<OtpCode[]> {
    const where: any = { email };
    if (tipo) {
      where.tipo = tipo;
    }

    const otps = await this.prisma.otpCode.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return otps;
  }
}
