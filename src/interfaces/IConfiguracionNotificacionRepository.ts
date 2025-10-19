import { ConfiguracionNotificacion, CreateConfiguracionNotificacionDto, UpdateConfiguracionNotificacionDto } from '../models/ConfiguracionNotificacion';

export interface IConfiguracionNotificacionRepository {
  // Crear configuración de notificación
  crear(data: CreateConfiguracionNotificacionDto): Promise<ConfiguracionNotificacion>;
  
  // Obtener configuración por empleado
  obtenerPorEmpleado(empleadoId: string): Promise<ConfiguracionNotificacion | null>;
  
  // Obtener todas las configuraciones
  obtenerTodas(): Promise<ConfiguracionNotificacion[]>;
  
  // Actualizar configuración
  actualizar(empleadoId: string, data: UpdateConfiguracionNotificacionDto): Promise<ConfiguracionNotificacion>;
  
  // Eliminar configuración
  eliminar(empleadoId: string): Promise<ConfiguracionNotificacion>;
  
  // Verificar si existe configuración para empleado
  existePorEmpleado(empleadoId: string): Promise<boolean>;
}
