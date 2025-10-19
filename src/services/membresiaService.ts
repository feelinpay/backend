import { PrismaClient } from '@prisma/client';
import { CreateMembresiaDto, UpdateMembresiaDto } from '../models/Membresia';

const prisma = new PrismaClient();

export class MembresiaService {
  // Crear nueva membresía
  static async crearMembresia(data: CreateMembresiaDto) {
    try {
      // Verificar si ya existe una membresía con el mismo nombre
      const membresiaExistente = await prisma.membresia.findFirst({
        where: {
          nombre: data.nombre,
          activa: true
        }
      });

      if (membresiaExistente) {
        throw new Error('Ya existe una membresía activa con este nombre');
      }

      const membresia = await prisma.membresia.create({
        data: {
          nombre: data.nombre,
          meses: data.meses,
          precio: data.precio,
          activa: data.activa ?? true
        }
      });

      return {
        success: true,
        data: membresia,
        message: 'Membresía creada exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al crear membresía: ${error.message}`);
    }
  }

  // Obtener todas las membresías con paginación y filtros
  static async obtenerMembresias(page: number = 1, limit: number = 10, activa?: boolean, search?: string) {
    try {
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

      return {
        success: true,
        data: {
          membresias,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresías: ${error.message}`);
    }
  }

  // Obtener membresía por ID
  static async obtenerMembresiaPorId(id: string) {
    try {
      const membresia = await prisma.membresia.findUnique({
        where: { id },
        include: {
          usuarios: {
            where: { activa: true },
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!membresia) {
        throw new Error('Membresía no encontrada');
      }

      return {
        success: true,
        data: membresia
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresía: ${error.message}`);
    }
  }

  // Actualizar membresía
  static async actualizarMembresia(id: string, data: UpdateMembresiaDto) {
    try {
      // Verificar si la membresía existe
      const membresiaExistente = await prisma.membresia.findUnique({
        where: { id }
      });

      if (!membresiaExistente) {
        throw new Error('Membresía no encontrada');
      }

      // Si se está cambiando el nombre, verificar que no exista otra con el mismo nombre
      if (data.nombre && data.nombre !== membresiaExistente.nombre) {
        const nombreExistente = await prisma.membresia.findFirst({
          where: {
            nombre: data.nombre,
            activa: true,
            id: { not: id }
          }
        });

        if (nombreExistente) {
          throw new Error('Ya existe una membresía activa con este nombre');
        }
      }

      const membresia = await prisma.membresia.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: membresia,
        message: 'Membresía actualizada exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al actualizar membresía: ${error.message}`);
    }
  }

  // Eliminar membresía (soft delete)
  static async eliminarMembresia(id: string) {
    try {
      // Verificar si la membresía existe
      const membresiaExistente = await prisma.membresia.findUnique({
        where: { id },
        include: {
          usuarios: {
            where: { activa: true }
          }
        }
      });

      if (!membresiaExistente) {
        throw new Error('Membresía no encontrada');
      }

      // Verificar si tiene usuarios activos
      if (membresiaExistente.usuarios.length > 0) {
        throw new Error('No se puede eliminar una membresía que tiene usuarios activos');
      }

      // Soft delete - desactivar
      const membresia = await prisma.membresia.update({
        where: { id },
        data: {
          activa: false,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: membresia,
        message: 'Membresía eliminada exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al eliminar membresía: ${error.message}`);
    }
  }

  // Obtener membresías activas (para dropdowns)
  static async obtenerMembresiasActivas() {
    try {
      const membresias = await prisma.membresia.findMany({
        where: { activa: true },
        select: {
          id: true,
          nombre: true,
          meses: true,
          precio: true
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return {
        success: true,
        data: membresias
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresías activas: ${error.message}`);
    }
  }
}