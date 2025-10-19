import { PrismaClient } from '@prisma/client';
import { IMembresiaRepository } from '../interfaces/IMembresiaRepository';
import { Membresia, CreateMembresiaDto, UpdateMembresiaDto } from '../models/Membresia';

const prisma = new PrismaClient();

export class MembresiaRepository implements IMembresiaRepository {
  async crear(data: CreateMembresiaDto): Promise<Membresia> {
    return await prisma.membresia.create({
      data: {
        nombre: data.nombre,
        meses: data.meses,
        precio: data.precio,
        activa: data.activa ?? true
      }
    });
  }

  async obtenerTodas(
    page: number, 
    limit: number, 
    activa?: boolean, 
    search?: string
  ): Promise<{ membresias: Membresia[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (activa !== undefined) {
      where.activa = activa;
    }
    
    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [membresias, total] = await Promise.all([
      prisma.membresia.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.membresia.count({ where })
    ]);

    return { membresias, total };
  }

  async obtenerPorId(id: string): Promise<Membresia | null> {
    return await prisma.membresia.findUnique({
      where: { id }
    });
  }

  async actualizar(id: string, data: UpdateMembresiaDto): Promise<Membresia> {
    return await prisma.membresia.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async eliminar(id: string): Promise<Membresia> {
    return await prisma.membresia.update({
      where: { id },
      data: {
        activa: false,
        updatedAt: new Date()
      }
    });
  }

  async obtenerActivas(): Promise<Membresia[]> {
    return await prisma.membresia.findMany({
      where: { activa: true },
      orderBy: {
        nombre: 'asc'
      }
    });
  }

  async existeConNombre(nombre: string, excluirId?: string): Promise<boolean> {
    const where: any = {
      nombre: {
        equals: nombre,
        mode: 'insensitive'
      },
      activa: true
    };

    if (excluirId) {
      where.id = { not: excluirId };
    }

    const count = await prisma.membresia.count({ where });
    return count > 0;
  }
}
