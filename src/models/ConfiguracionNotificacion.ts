// Interfaces para ConfiguracionNotificacion
export interface ConfiguracionNotificacion {
  id: string;
  empleadoId: string;
  notificacionesActivas: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConfiguracionNotificacionDto {
  empleadoId: string;
  notificacionesActivas?: boolean;
}

export interface UpdateConfiguracionNotificacionDto {
  notificacionesActivas?: boolean;
}

export interface ConfiguracionNotificacionWithEmpleado extends ConfiguracionNotificacion {
  empleado: {
    id: string;
    nombre: string;
    telefono: string;
    activo: boolean;
  };
}
