import { PrismaClient } from '@prisma/client';
import { IRolRepository } from '../interfaces/IRolRepository';
import { CreateRolDto, UpdateRolDto, Rol } from '../models/Rol';
import prisma from '../config/database';


export class RolRepository implements IRolRepository {
  async crear(data: CreateRolDto): Promise<Rol> {
    return await prisma.rol.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo ?? true
      }
    });
  }

  async obtenerTodos(page: number = 1, limit: number = 10, activo?: boolean, search?: string): Promise<{ roles: Rol[]; total: number }> {
    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.rol.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.rol.count({ where })
    ]);

    return { roles, total };
  }

  async obtenerPorId(id: string): Promise<Rol | null> {
    return await prisma.rol.findUnique({
      where: { id }
    });
  }

  async obtenerPorNombre(nombre: string): Promise<Rol | null> {
    return await prisma.rol.findUnique({
      where: { nombre }
    });
  }

  async actualizar(id: string, data: UpdateRolDto): Promise<Rol> {
    return await prisma.rol.update({
      where: { id },
      data
    });
  }

  async eliminar(id: string): Promise<Rol> {
    return await prisma.rol.delete({
      where: { id }
    });
  }

  async obtenerConPermisos(id: string): Promise<any> {
    return await prisma.rol.findUnique({
      where: { id },
      include: {
        permisos: {
          include: {
            permiso: true
          }
        }
      }
    });
  }

  async asignarPermiso(rolId: string, permisoId: string): Promise<void> {
    await prisma.rolPermiso.create({
      data: {
        rolId,
        permisoId
      }
    });
  }

  async desasignarPermiso(rolId: string, permisoId: string): Promise<void> {
    await prisma.rolPermiso.deleteMany({
      where: {
        rolId,
        permisoId
      }
    });
  }

  async obtenerPermisosDelRol(rolId: string): Promise<any[]> {
    const rolPermisos = await prisma.rolPermiso.findMany({
      where: { rolId },
      include: {
        permiso: true
      }
    });

    return rolPermisos.map(rp => rp.permiso);
  }

  async verificarAsignacion(rolId: string, permisoId: string): Promise<boolean> {
    const rolPermiso = await prisma.rolPermiso.findFirst({
      where: {
        rolId,
        permisoId
      }
    });

    return rolPermiso !== null;
  }
}
