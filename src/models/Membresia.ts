// Interfaces para Membresia
export interface Membresia {
  id: string;
  nombre: string;
  meses: number;
  precio: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMembresiaDto {
  nombre: string;
  meses: number;
  precio: number;
  activa?: boolean;
}

export interface UpdateMembresiaDto {
  nombre?: string;
  meses?: number;
  precio?: number;
  activa?: boolean;
}

export interface MembresiaWithUsers extends Membresia {
  usuarios: {
    id: string;
    usuarioId: string;
    membresiaId: string;
    fechaInicio: Date;
    fechaExpiracion: Date;
    activa: boolean;
    usuario: {
      id: string;
      nombre: string;
      email: string;
    };
  }[];
}
