import { PrismaClient, Empleado } from '@prisma/client';
import { IEmployeeRepository, CreateEmployeeData, UpdateEmployeeData, EmployeeStats } from '../interfaces/IEmployeeRepository';

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateEmployeeData): Promise<Empleado> {
    return await this.prisma.empleado.create({
      data: {
        usuarioId: data.usuarioId,
        nombre: data.nombre,
        telefono: data.telefono,
        activo: true
      }
    });
  }

  async findById(id: string): Promise<Empleado | null> {
    return await this.prisma.empleado.findUnique({
      where: { id }
    });
  }

  async findByUserId(usuarioId: string, page: number = 1, limit: number = 20): Promise<{ empleados: Empleado[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [empleados, total] = await Promise.all([
      this.prisma.empleado.findMany({
        where: { usuarioId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.empleado.count({
        where: { usuarioId }
      })
    ]);

    return { empleados, total };
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Empleado> {
    return await this.prisma.empleado.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(typeof data.activo === 'boolean' && { activo: data.activo })
      }
    });
  }

  async delete(id: string): Promise<Empleado> {
    return await this.prisma.empleado.delete({
      where: { id }
    });
  }

  async searchByUserId(usuarioId: string, searchTerm: string, page: number = 1, limit: number = 20): Promise<{ empleados: Empleado[], total: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      usuarioId,
      OR: [
        { nombre: { contains: searchTerm, mode: 'insensitive' as const } },
        { telefono: { contains: searchTerm, mode: 'insensitive' as const } }
      ]
    };

    const [empleados, total] = await Promise.all([
      this.prisma.empleado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.empleado.count({ where })
    ]);

    return { empleados, total };
  }

  async findByPhone(usuarioId: string, telefono: string): Promise<Empleado | null> {
    return await this.prisma.empleado.findFirst({
      where: {
        usuarioId,
        telefono
      }
    });
  }

  async toggleStatus(id: string): Promise<Empleado> {
    const empleado = await this.prisma.empleado.findUnique({
      where: { id }
    });

    if (!empleado) {
      throw new Error('Empleado no encontrado');
    }

    return await this.prisma.empleado.update({
      where: { id },
      data: { activo: !empleado.activo }
    });
  }

  async getActiveByUserId(usuarioId: string): Promise<Empleado[]> {
    return await this.prisma.empleado.findMany({
      where: {
        usuarioId,
        activo: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInactiveByUserId(usuarioId: string): Promise<Empleado[]> {
    return await this.prisma.empleado.findMany({
      where: {
        usuarioId,
        activo: false
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStatsByUserId(usuarioId: string): Promise<EmployeeStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEmpleados,
      empleadosActivos,
      empleadosInactivos,
      empleadosRecientes
    ] = await Promise.all([
      this.prisma.empleado.count({ where: { usuarioId } }),
      this.prisma.empleado.count({ where: { usuarioId, activo: true } }),
      this.prisma.empleado.count({ where: { usuarioId, activo: false } }),
      this.prisma.empleado.count({ 
        where: { 
          usuarioId, 
          createdAt: { gte: thirtyDaysAgo } 
        } 
      })
    ]);

    return {
      totalEmpleados,
      empleadosActivos,
      empleadosInactivos,
      empleadosRecientes
    };
  }
}
