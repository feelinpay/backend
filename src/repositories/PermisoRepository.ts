import { PrismaClient } from '@prisma/client';
import { IPermisoRepository } from '../interfaces/IPermisoRepository';
import { CreatePermisoDto, UpdatePermisoDto, Permiso } from '../models/Permiso';

const prisma = new PrismaClient();

export class PermisoRepository implements IPermisoRepository {
  async crear(data: CreatePermisoDto): Promise<Permiso> {
    return await prisma.permiso.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        modulo: data.modulo,
        accion: data.accion,
        activo: data.activo ?? true
      }
    });
  }

  async obtenerTodos(page: number = 1, limit: number = 10, activo?: boolean, search?: string, modulo?: string): Promise<{ permisos: Permiso[]; total: number }> {
    const where: any = {};
    
    if (activo !== undefined) {
      where.activo = activo;
    }
    
    if (modulo) {
      where.modulo = modulo;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { modulo: { contains: search, mode: 'insensitive' } },
        { accion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [permisos, total] = await Promise.all([
      prisma.permiso.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.permiso.count({ where })
    ]);

    return { permisos, total };
  }

  async obtenerPorId(id: string): Promise<Permiso | null> {
    return await prisma.permiso.findUnique({
      where: { id }
    });
  }

  async obtenerPorNombre(nombre: string): Promise<Permiso | null> {
    return await prisma.permiso.findUnique({
      where: { nombre }
    });
  }

  async actualizar(id: string, data: UpdatePermisoDto): Promise<Permiso> {
    return await prisma.permiso.update({
      where: { id },
      data
    });
  }

  async eliminar(id: string): Promise<Permiso> {
    return await prisma.permiso.delete({
      where: { id }
    });
  }

  async obtenerConRoles(id: string): Promise<any> {
    return await prisma.permiso.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    });
  }

  async obtenerPorModulo(modulo: string): Promise<Permiso[]> {
    return await prisma.permiso.findMany({
      where: { 
        modulo,
        activo: true
      },
      orderBy: { nombre: 'asc' }
    });
  }

  async obtenerPorAccion(accion: string): Promise<Permiso[]> {
    return await prisma.permiso.findMany({
      where: { 
        accion,
        activo: true
      },
      orderBy: { nombre: 'asc' }
    });
  }
}
