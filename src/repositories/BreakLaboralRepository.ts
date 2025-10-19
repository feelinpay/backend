import { PrismaClient } from '@prisma/client';
import { IBreakLaboralRepository } from '../interfaces/IBreakLaboralRepository';
import { BreakLaboral, CreateBreakLaboralDto, UpdateBreakLaboralDto } from '../models/BreakLaboral';

const prisma = new PrismaClient();

export class BreakLaboralRepository implements IBreakLaboralRepository {
  async crear(data: CreateBreakLaboralDto): Promise<BreakLaboral> {
    return await prisma.breakLaboral.create({
      data: {
        empleadoId: data.empleadoId,
        diaSemana: data.diaSemana,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        activo: data.activo ?? true
      }
    });
  }

  async obtenerPorEmpleado(empleadoId: string): Promise<BreakLaboral[]> {
    return await prisma.breakLaboral.findMany({
      where: { empleadoId },
      orderBy: {
        diaSemana: 'asc'
      }
    });
  }

  async obtenerPorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<BreakLaboral | null> {
    return await prisma.breakLaboral.findUnique({
      where: {
        empleadoId_diaSemana: {
          empleadoId,
          diaSemana
        }
      }
    });
  }

  async obtenerTodos(search?: string): Promise<BreakLaboral[]> {
    const where: any = {};
    
    if (search) {
      where.empleado = {
        nombre: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    return await prisma.breakLaboral.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async actualizar(id: string, data: UpdateBreakLaboralDto): Promise<BreakLaboral> {
    return await prisma.breakLaboral.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async eliminar(id: string): Promise<BreakLaboral> {
    return await prisma.breakLaboral.delete({
      where: { id }
    });
  }

  async existePorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<boolean> {
    const count = await prisma.breakLaboral.count({
      where: {
        empleadoId,
        diaSemana
      }
    });
    return count > 0;
  }

  async obtenerActivosPorEmpleado(empleadoId: string): Promise<BreakLaboral[]> {
    return await prisma.breakLaboral.findMany({
      where: {
        empleadoId,
        activo: true
      },
      orderBy: {
        diaSemana: 'asc'
      }
    });
  }
}
