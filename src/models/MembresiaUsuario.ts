// Interfaces para MembresiaUsuario
export interface MembresiaUsuario {
  id: string;
  usuarioId: string;
  membresiaId: string;
  fechaInicio: Date;
  fechaExpiracion: Date;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMembresiaUsuarioDto {
  usuarioId: string;
  membresiaId: string;
  fechaInicio: Date;
  fechaExpiracion: Date;
  activa?: boolean;
}

export interface UpdateMembresiaUsuarioDto {
  fechaInicio?: Date;
  fechaExpiracion?: Date;
  activa?: boolean;
}

export interface MembresiaUsuarioWithDetails extends MembresiaUsuario {
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  membresia: {
    id: string;
    nombre: string;
    meses: number;
    precio: number;
  };
}
