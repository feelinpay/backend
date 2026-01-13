import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../models/Usuario';

export interface IUserRepository {
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findByGoogleId?(googleId: string): Promise<Usuario | null>;
  create(data: CreateUsuarioDto): Promise<Usuario>;
  update(id: string, data: UpdateUsuarioDto): Promise<Usuario>;
  delete(id: string): Promise<void>;
  findAll(page?: number, limit?: number, search?: string): Promise<{ usuarios: Usuario[], total: number }>;
  toggleStatus(id: string, activo: boolean): Promise<Usuario>;
}
