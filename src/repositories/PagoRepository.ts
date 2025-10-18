import { PrismaClient } from '@prisma/client';
import { IPagoRepository } from '../interfaces/IPagoRepository';
import { Pago, CreatePagoDto } from '../models/Pago';

export class PagoRepository implements IPagoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePagoDto): Promise<Pago> {
    const pago = await this.prisma.pago.create({
      data
    });
    return pago;
  }

  async findById(id: string): Promise<Pago | null> {
    const pago = await this.prisma.pago.findUnique({
      where: { id }
    });
    return pago;
  }

  async findByPropietario(propietarioId: string, page: number = 1, limit: number = 20): Promise<{ pagos: Pago[], total: number }> {
    const skip = (page - 1) * limit;

    const [pagos, total] = await Promise.all([
      this.prisma.pago.findMany({
        where: { propietarioId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.pago.count({
        where: { propietarioId }
      })
    ]);

    return { pagos, total };
  }

  async update(id: string, data: Partial<CreatePagoDto>): Promise<Pago> {
    const pago = await this.prisma.pago.update({
      where: { id },
      data
    });
    return pago;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pago.delete({
      where: { id }
    });
  }

  async getStats(propietarioId?: string): Promise<{ total: number, montoTotal: number, promedio: number }> {
    const where = propietarioId ? { propietarioId } : {};

    const [total, result] = await Promise.all([
      this.prisma.pago.count({ where }),
      this.prisma.pago.aggregate({
        where,
        _sum: { monto: true },
        _avg: { monto: true }
      })
    ]);

    return {
      total,
      montoTotal: result._sum.monto || 0,
      promedio: result._avg.monto || 0
    };
  }
}
