import { PrismaClient } from '@prisma/client';
import { IHorarioLaboralRepository } from '../interfaces/IHorarioLaboralRepository';
import { HorarioLaboral, CreateHorarioLaboralDto, UpdateHorarioLaboralDto } from '../models/HorarioLaboral';

const prisma = new PrismaClient();

export class HorarioLaboralRepository implements IHorarioLaboralRepository {
  async crear(data: CreateHorarioLaboralDto): Promise<HorarioLaboral> {
    return await prisma.horarioLaboral.create({
      data: {
        empleadoId: data.empleadoId,
        diaSemana: data.diaSemana as any,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        activo: data.activo ?? true
      }
    }) as any;
  }

  async obtenerPorEmpleado(empleadoId: string): Promise<HorarioLaboral[]> {
    return await prisma.horarioLaboral.findMany({
      where: { empleadoId },
      orderBy: {
        diaSemana: 'asc'
      } as any
    }) as any;
  }

  async obtenerPorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<HorarioLaboral | null> {
    return await prisma.horarioLaboral.findUnique({
      where: {
        empleadoId_diaSemana: {
          empleadoId,
          diaSemana
        }
      } as any
    }) as any;
  }

  async obtenerTodos(search?: string): Promise<HorarioLaboral[]> {
    const where: any = {};

    if (search) {
      where.empleado = {
        nombre: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    return await prisma.horarioLaboral.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    }) as any;
  }

  async actualizar(id: string, data: UpdateHorarioLaboralDto): Promise<HorarioLaboral> {
    return await prisma.horarioLaboral.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      } as any // UpdateInput might also be mismatched
    }) as any;
  }

  async eliminar(id: string): Promise<HorarioLaboral> {
    return await prisma.horarioLaboral.delete({
      where: { id }
    }) as any;
  }

  async existePorEmpleadoYDia(empleadoId: string, diaSemana: number): Promise<boolean> {
    const count = await prisma.horarioLaboral.count({
      where: {
        empleadoId,
        diaSemana
      } as any
    });
    return count > 0;
  }

  async obtenerActivosPorEmpleado(empleadoId: string): Promise<HorarioLaboral[]> {
    return await prisma.horarioLaboral.findMany({
      where: {
        empleadoId,
        activo: true
      },
      orderBy: {
        diaSemana: 'asc'
      } as any
    }) as any;
  }
}
