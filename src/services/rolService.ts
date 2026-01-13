import { RolRepository } from '../repositories/RolRepository';
import { CreateRolDto, UpdateRolDto } from '../models/Rol';

const rolRepository = new RolRepository();

export class RolService {
  // Crear nuevo rol
  static async crear(data: CreateRolDto) {
    try {
      // Verificar si el rol ya existe
      const rolExistente = await rolRepository.obtenerPorNombre(data.nombre);
      if (rolExistente) {
        throw new Error('Ya existe un rol con ese nombre');
      }

      const rol = await rolRepository.crear(data);

      return {
        success: true,
        data: rol,
        message: 'Rol creado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }

  // Obtener todos los roles con paginación
  static async obtenerTodos(page: number = 1, limit: number = 10, activo?: boolean, search?: string) {
    try {
      const result = await rolRepository.obtenerTodos(page, limit, activo, search);

      return {
        success: true,
        data: {
          roles: result.roles,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      };
    } catch (error: any) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

  // Obtener rol por ID
  static async obtenerPorId(id: string) {
    try {
      const rol = await rolRepository.obtenerPorId(id);

      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      return {
        success: true,
        data: rol
      };
    } catch (error: any) {
      throw new Error(`Error al obtener rol: ${error.message}`);
    }
  }

  // Actualizar rol
  static async actualizar(id: string, data: UpdateRolDto) {
    try {
      const rol = await rolRepository.obtenerPorId(id);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      // PROTECCIÓN DE ROLES DEL SISTEMA
      const rolesProtegidos = ['super_admin', 'propietario'];
      if (rolesProtegidos.includes(rol.nombre)) {
        // Si intenta cambiar el nombre
        if (data.nombre && data.nombre !== rol.nombre) {
          throw new Error(`No se puede renombrar el rol protegido '${rol.nombre}'`);
        }
      }

      // Si se está cambiando el nombre, verificar que no exista otro rol con ese nombre
      if (data.nombre && data.nombre !== rol.nombre) {
        const rolExistente = await rolRepository.obtenerPorNombre(data.nombre);
        if (rolExistente) {
          throw new Error('Ya existe un rol con ese nombre');
        }
      }

      const rolActualizado = await rolRepository.actualizar(id, data);

      return {
        success: true,
        data: rolActualizado,
        message: 'Rol actualizado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }
  }

  // Eliminar rol
  static async eliminar(id: string) {
    try {
      const rol = await rolRepository.obtenerPorId(id);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      // PROTECCIÓN DE ROLES DEL SISTEMA
      const rolesProtegidos = ['super_admin', 'propietario'];
      if (rolesProtegidos.includes(rol.nombre)) {
        throw new Error(`No se puede eliminar el rol protegido '${rol.nombre}'`);
      }

      const rolEliminado = await rolRepository.eliminar(id);

      return {
        success: true,
        data: rolEliminado,
        message: 'Rol eliminado exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }
  }

  // Obtener rol con permisos
  static async obtenerConPermisos(id: string) {
    try {
      const rol = await rolRepository.obtenerConPermisos(id);

      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      return {
        success: true,
        data: rol
      };
    } catch (error: any) {
      throw new Error(`Error al obtener rol con permisos: ${error.message}`);
    }
  }

  // Asignar permiso a rol
  static async asignarPermiso(rolId: string, permisoId: string) {
    try {
      // Verificar que el rol existe
      const rol = await rolRepository.obtenerPorId(rolId);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      if (rol.nombre === 'super_admin') {
        throw new Error('No se pueden modificar los permisos del Super Admin');
      }

      // Verificar si ya está asignado
      const yaAsignado = await rolRepository.verificarAsignacion(rolId, permisoId);
      if (yaAsignado) {
        throw new Error('El permiso ya está asignado a este rol');
      }

      await rolRepository.asignarPermiso(rolId, permisoId);

      return {
        success: true,
        message: 'Permiso asignado al rol exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al asignar permiso: ${error.message}`);
    }
  }

  // Desasignar permiso de rol
  static async desasignarPermiso(rolId: string, permisoId: string) {
    try {
      // Verificar que el rol existe
      const rol = await rolRepository.obtenerPorId(rolId);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      if (rol.nombre === 'super_admin') {
        throw new Error('No se pueden modificar los permisos del Super Admin');
      }

      await rolRepository.desasignarPermiso(rolId, permisoId);

      return {
        success: true,
        message: 'Permiso desasignado del rol exitosamente'
      };
    } catch (error: any) {
      throw new Error(`Error al desasignar permiso: ${error.message}`);
    }
  }

  // Obtener permisos de un rol
  static async obtenerPermisosDelRol(rolId: string) {
    try {
      const permisos = await rolRepository.obtenerPermisosDelRol(rolId);

      return {
        success: true,
        data: permisos
      };
    } catch (error: any) {
      throw new Error(`Error al obtener permisos del rol: ${error.message}`);
    }
  }
}
