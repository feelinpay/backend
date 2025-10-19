import { PrismaClient } from '@prisma/client';
import { IMembresiaUsuarioRepository } from '../interfaces/IMembresiaUsuarioRepository';
import { MembresiaUsuario, CreateMembresiaUsuarioDto, UpdateMembresiaUsuarioDto } from '../models/MembresiaUsuario';

const prisma = new PrismaClient();

export class MembresiaUsuarioRepository implements IMembresiaUsuarioRepository {
  async crear(data: CreateMembresiaUsuarioDto): Promise<MembresiaUsuario> {
    return await prisma.membresiaUsuario.create({
      data: {
        usuarioId: data.usuarioId,
        membresiaId: data.membresiaId,
        fechaInicio: data.fechaInicio,
        fechaExpiracion: data.fechaExpiracion,
        activa: data.activa ?? true
      }
    });
  }

  async obtenerPorUsuario(usuarioId: string): Promise<MembresiaUsuario[]> {
    return await prisma.membresiaUsuario.findMany({
      where: { usuarioId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async obtenerActivaPorUsuario(usuarioId: string): Promise<MembresiaUsuario | null> {
    return await prisma.membresiaUsuario.findFirst({
      where: {
        usuarioId,
        activa: true,
        fechaExpiracion: {
          gte: new Date() // No ha expirado
        }
      },
      orderBy: {
        fechaExpiracion: 'desc'
      }
    });
  }

  async obtenerTodas(
    page: number, 
    limit: number, 
    activa?: boolean, 
    usuarioId?: string,
    search?: string
  ): Promise<{ membresiasUsuario: MembresiaUsuario[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (activa !== undefined) {
      where.activa = activa;
    }
    
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (search) {
      where.OR = [
        {
          usuario: {
            nombre: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          membresia: {
            nombre: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [membresiasUsuario, total] = await Promise.all([
      prisma.membresiaUsuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.membresiaUsuario.count({ where })
    ]);

    return { membresiasUsuario, total };
  }

  async obtenerPorId(id: string): Promise<MembresiaUsuario | null> {
    return await prisma.membresiaUsuario.findUnique({
      where: { id }
    });
  }

  async actualizar(id: string, data: UpdateMembresiaUsuarioDto): Promise<MembresiaUsuario> {
    return await prisma.membresiaUsuario.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async eliminar(id: string): Promise<MembresiaUsuario> {
    return await prisma.membresiaUsuario.update({
      where: { id },
      data: {
        activa: false,
        updatedAt: new Date()
      }
    });
  }

  async tieneMembresiaActiva(usuarioId: string): Promise<boolean> {
    const count = await prisma.membresiaUsuario.count({
      where: {
        usuarioId,
        activa: true,
        fechaExpiracion: {
          gte: new Date() // No ha expirado
        }
      }
    });
    return count > 0;
  }

  async obtenerQueExpiranEn(dias: number): Promise<MembresiaUsuario[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return await prisma.membresiaUsuario.findMany({
      where: {
        activa: true,
        fechaExpiracion: {
          lte: fechaLimite,
          gte: new Date() // Aún no ha expirado
        }
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        membresia: {
          select: {
            id: true,
            nombre: true,
            meses: true,
            precio: true
          }
        }
      }
    });
  }
}
