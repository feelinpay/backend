import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../models/Usuario';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) { }

  async findById(id: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true }
    });
    return user;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    });
    return user;
  }

  async findByGoogleId(googleId: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { googleId },
      include: { rol: true }
    });
    return user;
  }

  async create(data: CreateUsuarioDto): Promise<Usuario> {
    const user = await this.prisma.usuario.create({
      data,
      include: { rol: true }
    });
    return user;
  }

  async update(id: string, data: UpdateUsuarioDto): Promise<Usuario> {
    const user = await this.prisma.usuario.update({
      where: { id },
      data,
      include: { rol: true }
    });
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.usuario.delete({
      where: { id }
    });
  }

  async findAll(page: number = 1, limit: number = 20, search?: string): Promise<{ usuarios: Usuario[], total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        include: { rol: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.usuario.count({ where })
    ]);

    return { usuarios, total };
  }

  async toggleStatus(id: string, activo: boolean): Promise<Usuario> {
    const user = await this.prisma.usuario.update({
      where: { id },
      data: { activo },
      include: { rol: true }
    });
    return user;
  }
}
