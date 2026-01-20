import { IPermisoRepository } from '../interfaces/IPermisoRepository';
import { CreatePermisoDto, UpdatePermisoDto, Permiso } from '../models/Permiso';
import prisma from '../config/database';


export class PermisoRepository implements IPermisoRepository {
  async crear(data: CreatePermisoDto): Promise<Permiso> {
    return await prisma.permiso.create({
      data: {
        nombre: data.nombre,
        modulo: data.modulo,
        ruta: data.ruta,
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
        { modulo: { contains: search, mode: 'insensitive' } },
        { ruta: { contains: search, mode: 'insensitive' } }
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

    return { permisos: permisos as Permiso[], total };
  }

  async obtenerPorId(id: string): Promise<Permiso | null> {
    return await prisma.permiso.findUnique({
      where: { id }
    });
  }

  async obtenerPorNombre(nombre: string): Promise<Permiso | null> {
    // nombre is not unique in schema anymore according to my last edit?
    // Wait, let's check schema again. I removed @unique from nombre?
    // "nombre String // Display Name". Yes, I removed @unique.
    // So findUnique({ where: { nombre } }) will FAIL if I use it.
    // I should use findFirst or restore unique context if needed.
    // But for now, repository interface says "obtenerPorNombre" returns "Permiso | null".
    // I will use findFirst.
    return await prisma.permiso.findFirst({
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
}
