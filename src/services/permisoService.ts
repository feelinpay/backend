import { PermisoRepository } from '../repositories/PermisoRepository';
import { CreatePermisoDto, UpdatePermisoDto } from '../models/Permiso';

const permisoRepository = new PermisoRepository();

export class PermisoService {
  // Crear nuevo permiso
  static async crear(data: CreatePermisoDto) {
    try {
      // Verificar si el permiso ya existe
      const permisoExistente = await permisoRepository.obtenerPorNombre(data.nombre);
      if (permisoExistente) {
        throw new Error('Ya existe un permiso con ese nombre');
      }

      const permiso = await permisoRepository.crear(data);

      return {
        success: true,
        data: permiso,
        message: 'Permiso creado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al crear permiso: ${error.message}`);
    }
  }

  // Obtener todos los permisos con paginación
  static async obtenerTodos(page: number = 1, limit: number = 10, activo?: boolean, search?: string, modulo?: string) {
    try {
      const result = await permisoRepository.obtenerTodos(page, limit, activo, search, modulo);
      
      return {
        success: true,
        data: {
          permisos: result.permisos,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permisos: ${error.message}`);
    }
  }

  // Obtener permiso por ID
  static async obtenerPorId(id: string) {
    try {
      const permiso = await permisoRepository.obtenerPorId(id);
      
      if (!permiso) {
        throw new Error('Permiso no encontrado');
      }

      return {
        success: true,
        data: permiso
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permiso: ${error.message}`);
    }
  }

  // Actualizar permiso
  static async actualizar(id: string, data: UpdatePermisoDto) {
    try {
      const permiso = await permisoRepository.obtenerPorId(id);
      if (!permiso) {
        throw new Error('Permiso no encontrado');
      }

      // Si se está cambiando el nombre, verificar que no exista otro permiso con ese nombre
      if (data.nombre && data.nombre !== permiso.nombre) {
        const permisoExistente = await permisoRepository.obtenerPorNombre(data.nombre);
        if (permisoExistente) {
          throw new Error('Ya existe un permiso con ese nombre');
        }
      }

      const permisoActualizado = await permisoRepository.actualizar(id, data);

      return {
        success: true,
        data: permisoActualizado,
        message: 'Permiso actualizado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al actualizar permiso: ${error.message}`);
    }
  }

  // Eliminar permiso
  static async eliminar(id: string) {
    try {
      const permiso = await permisoRepository.obtenerPorId(id);
      if (!permiso) {
        throw new Error('Permiso no encontrado');
      }

      const permisoEliminado = await permisoRepository.eliminar(id);

      return {
        success: true,
        data: permisoEliminado,
        message: 'Permiso eliminado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al eliminar permiso: ${error.message}`);
    }
  }

  // Obtener permiso con roles
  static async obtenerConRoles(id: string) {
    try {
      const permiso = await permisoRepository.obtenerConRoles(id);
      
      if (!permiso) {
        throw new Error('Permiso no encontrado');
      }

      return {
        success: true,
        data: permiso
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permiso con roles: ${error.message}`);
    }
  }

  // Obtener permisos por módulo
  static async obtenerPorModulo(modulo: string) {
    try {
      const permisos = await permisoRepository.obtenerPorModulo(modulo);
      
      return {
        success: true,
        data: permisos
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permisos por módulo: ${error.message}`);
    }
  }

  // Obtener permisos por acción
  static async obtenerPorAccion(accion: string) {
    try {
      const permisos = await permisoRepository.obtenerPorAccion(accion);
      
      return {
        success: true,
        data: permisos
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permisos por acción: ${error.message}`);
    }
  }
}
