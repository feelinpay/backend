import { PrismaClient } from '@prisma/client';
import { IConfiguracionNotificacionRepository } from '../interfaces/IConfiguracionNotificacionRepository';
import { ConfiguracionNotificacion, CreateConfiguracionNotificacionDto, UpdateConfiguracionNotificacionDto } from '../models/ConfiguracionNotificacion';

const prisma = new PrismaClient();

export class ConfiguracionNotificacionRepository implements IConfiguracionNotificacionRepository {
  async crear(data: CreateConfiguracionNotificacionDto): Promise<ConfiguracionNotificacion> {
    return await prisma.configuracionNotificacion.create({
      data: {
        empleadoId: data.empleadoId,
        notificacionesActivas: data.notificacionesActivas ?? true
      }
    });
  }

  async obtenerPorEmpleado(empleadoId: string): Promise<ConfiguracionNotificacion | null> {
    return await prisma.configuracionNotificacion.findUnique({
      where: { empleadoId }
    });
  }

  async obtenerTodas(): Promise<ConfiguracionNotificacion[]> {
    return await prisma.configuracionNotificacion.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async actualizar(empleadoId: string, data: UpdateConfiguracionNotificacionDto): Promise<ConfiguracionNotificacion> {
    return await prisma.configuracionNotificacion.update({
      where: { empleadoId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async eliminar(empleadoId: string): Promise<ConfiguracionNotificacion> {
    return await prisma.configuracionNotificacion.delete({
      where: { empleadoId }
    });
  }

  async existePorEmpleado(empleadoId: string): Promise<boolean> {
    const count = await prisma.configuracionNotificacion.count({
      where: { empleadoId }
    });
    return count > 0;
  }
}
