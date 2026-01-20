import { IRolPermisoRepository } from '../interfaces/IRolPermisoRepository';
import { CreateRolPermisoDto, RolPermiso } from '../models/RolPermiso';
import prisma from '../config/database';


export class RolPermisoRepository implements IRolPermisoRepository {
  async crear(data: CreateRolPermisoDto): Promise<RolPermiso> {
    return await prisma.rolPermiso.create({
      data: {
        rolId: data.rolId,
        permisoId: data.permisoId
      }
    });
  }

  async obtenerTodos(page: number = 1, limit: number = 10, rolId?: string, permisoId?: string): Promise<{ rolPermisos: RolPermiso[]; total: number }> {
    const where: any = {};

    if (rolId) {
      where.rolId = rolId;
    }

    if (permisoId) {
      where.permisoId = permisoId;
    }

    const [rolPermisos, total] = await Promise.all([
      prisma.rolPermiso.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.rolPermiso.count({ where })
    ]);

    return { rolPermisos, total };
  }

  async obtenerPorId(id: string): Promise<RolPermiso | null> {
    return await prisma.rolPermiso.findUnique({
      where: { id }
    });
  }

  async obtenerPorRol(rolId: string): Promise<RolPermiso[]> {
    return await prisma.rolPermiso.findMany({
      where: { rolId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async obtenerPorPermiso(permisoId: string): Promise<RolPermiso[]> {
    return await prisma.rolPermiso.findMany({
      where: { permisoId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async eliminar(id: string): Promise<RolPermiso> {
    return await prisma.rolPermiso.delete({
      where: { id }
    });
  }

  async eliminarPorRolYPermiso(rolId: string, permisoId: string): Promise<void> {
    await prisma.rolPermiso.deleteMany({
      where: {
        rolId,
        permisoId
      }
    });
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

  async obtenerConDetalles(id: string): Promise<any> {
    return await prisma.rolPermiso.findUnique({
      where: { id },
      include: {
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        permiso: {
          select: {
            id: true,
            nombre: true,

            modulo: true,

          }
        }
      }
    });
  }
}
