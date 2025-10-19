import { PrismaClient } from '@prisma/client';
import { IOtpCodeRepository } from '../interfaces/IOtpCodeRepository';
import { OtpCode, CreateOtpCodeDto, UpdateOtpCodeDto, ValidateOtpCodeDto } from '../models/OtpCode';

const prisma = new PrismaClient();

export class OtpCodeRepository implements IOtpCodeRepository {
  async crear(data: CreateOtpCodeDto): Promise<OtpCode> {
    return await prisma.otpCode.create({
      data: {
        email: data.email,
        codigo: data.codigo,
        tipo: data.tipo,
        expiraEn: data.expiraEn,
        maxIntentos: data.maxIntentos ?? 3
      }
    });
  }

  async obtenerPorEmailYTipo(email: string, tipo: string): Promise<OtpCode | null> {
    return await prisma.otpCode.findUnique({
      where: {
        email_tipo: {
          email,
          tipo
        }
      }
    });
  }

  async validar(data: ValidateOtpCodeDto): Promise<{ valido: boolean; codigo: OtpCode | null }> {
    const codigo = await this.obtenerPorEmailYTipo(data.email, data.tipo);
    
    if (!codigo) {
      return { valido: false, codigo: null };
    }

    // Verificar si ya fue usado
    if (codigo.usado) {
      return { valido: false, codigo };
    }

    // Verificar si expiró
    if (codigo.expiraEn < new Date()) {
      return { valido: false, codigo };
    }

    // Verificar si excedió intentos
    if (codigo.intentos >= codigo.maxIntentos) {
      return { valido: false, codigo };
    }

    // Verificar si el código coincide
    const valido = codigo.codigo === data.codigo;
    
    return { valido, codigo };
  }

  async marcarComoUsado(email: string, tipo: string): Promise<OtpCode> {
    return await prisma.otpCode.update({
      where: {
        email_tipo: {
          email,
          tipo
        }
      },
      data: {
        usado: true
      }
    });
  }

  async incrementarIntentos(email: string, tipo: string): Promise<OtpCode> {
    return await prisma.otpCode.update({
      where: {
        email_tipo: {
          email,
          tipo
        }
      },
      data: {
        intentos: {
          increment: 1
        }
      }
    });
  }

  async eliminarExpirados(): Promise<number> {
    const result = await prisma.otpCode.deleteMany({
      where: {
        expiraEn: {
          lt: new Date()
        }
      }
    });
    return result.count;
  }

  async eliminar(email: string, tipo: string): Promise<OtpCode> {
    return await prisma.otpCode.delete({
      where: {
        email_tipo: {
          email,
          tipo
        }
      }
    });
  }

  async existeCodigoValido(email: string, tipo: string): Promise<boolean> {
    const count = await prisma.otpCode.count({
      where: {
        email,
        tipo,
        usado: false,
        expiraEn: {
          gt: new Date()
        },
        intentos: {
          lt: prisma.otpCode.fields.maxIntentos
        }
      }
    });
    return count > 0;
  }

  async obtenerTodos(search?: string): Promise<OtpCode[]> {
    const where: any = {};
    
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive'
      };
    }

    return await prisma.otpCode.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
