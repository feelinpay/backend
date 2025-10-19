import { MembresiaUsuarioRepository } from '../repositories/MembresiaUsuarioRepository';
import { CreateMembresiaUsuarioDto, UpdateMembresiaUsuarioDto } from '../models/MembresiaUsuario';

const membresiaUsuarioRepository = new MembresiaUsuarioRepository();

export class MembresiaUsuarioService {
  // Crear nueva relación usuario-membresía
  static async crear(data: CreateMembresiaUsuarioDto) {
    try {
      // Verificar si el usuario ya tiene una membresía activa
      const tieneActiva = await membresiaUsuarioRepository.tieneMembresiaActiva(data.usuarioId);
      
      if (tieneActiva) {
        throw new Error('El usuario ya tiene una membresía activa');
      }

      const membresiaUsuario = await membresiaUsuarioRepository.crear(data);

      return {
        success: true,
        data: membresiaUsuario,
        message: 'Membresía asignada al usuario exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al crear membresía de usuario: ${error.message}`);
    }
  }

  // Obtener todas las relaciones con paginación
  static async obtenerTodas(page: number = 1, limit: number = 10, activa?: boolean, usuarioId?: string, search?: string) {
    try {
      const result = await membresiaUsuarioRepository.obtenerTodas(page, limit, activa, usuarioId, search);
      
      return {
        success: true,
        data: {
          membresiasUsuario: result.membresiasUsuario,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresías de usuarios: ${error.message}`);
    }
  }

  // Obtener membresías de un usuario
  static async obtenerPorUsuario(usuarioId: string) {
    try {
      const membresias = await membresiaUsuarioRepository.obtenerPorUsuario(usuarioId);
      
      return {
        success: true,
        data: membresias
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresías del usuario: ${error.message}`);
    }
  }

  // Obtener membresía activa de un usuario
  static async obtenerActivaPorUsuario(usuarioId: string) {
    try {
      const membresia = await membresiaUsuarioRepository.obtenerActivaPorUsuario(usuarioId);
      
      if (!membresia) {
        return {
          success: true,
          data: null,
          message: 'El usuario no tiene membresía activa'
        };
      }

      return {
        success: true,
        data: membresia
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresía activa del usuario: ${error.message}`);
    }
  }

  // Actualizar membresía de usuario
  static async actualizar(id: string, data: UpdateMembresiaUsuarioDto) {
    try {
      const membresiaUsuario = await membresiaUsuarioRepository.actualizar(id, data);

      return {
        success: true,
        data: membresiaUsuario,
        message: 'Membresía de usuario actualizada exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al actualizar membresía de usuario: ${error.message}`);
    }
  }

  // Eliminar membresía de usuario
  static async eliminar(id: string) {
    try {
      const membresiaUsuario = await membresiaUsuarioRepository.eliminar(id);

      return {
        success: true,
        data: membresiaUsuario,
        message: 'Membresía de usuario eliminada exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al eliminar membresía de usuario: ${error.message}`);
    }
  }

  // Verificar si usuario tiene membresía activa
  static async tieneMembresiaActiva(usuarioId: string) {
    try {
      return await membresiaUsuarioRepository.tieneMembresiaActiva(usuarioId);
    } catch (error: any) {
      throw new Error(`Error al verificar membresía activa: ${error.message}`);
    }
  }

  // Extender membresía de usuario
  static async extenderMembresia(id: string, diasAdicionales: number) {
    try {
      const membresiaUsuario = await membresiaUsuarioRepository.obtenerPorId(id);
      
      if (!membresiaUsuario) {
        throw new Error('Membresía de usuario no encontrada');
      }

      const nuevaFechaExpiracion = new Date(membresiaUsuario.fechaExpiracion);
      nuevaFechaExpiracion.setDate(nuevaFechaExpiracion.getDate() + diasAdicionales);

      const membresiaActualizada = await membresiaUsuarioRepository.actualizar(id, {
        fechaExpiracion: nuevaFechaExpiracion
      });

      return {
        success: true,
        data: membresiaActualizada,
        message: `Membresía extendida por ${diasAdicionales} días exitosamente`
      };
    } catch (error: any) {
      throw new Error(`Error al extender membresía: ${error.message}`);
    }
  }

  // Obtener membresías que expiran pronto
  static async obtenerQueExpiranEn(dias: number = 7) {
    try {
      const membresias = await membresiaUsuarioRepository.obtenerQueExpiranEn(dias);
      
      return {
        success: true,
        data: membresias,
        message: `Membresías que expiran en ${dias} días`
      };
    } catch (error: any) {
      throw new Error(`Error al obtener membresías que expiran: ${error.message}`);
    }
  }
}
