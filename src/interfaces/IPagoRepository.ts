import { Pago, CreatePagoDto } from '../models/Pago';

export interface IPagoRepository {
  create(data: CreatePagoDto): Promise<Pago>;
  findById(id: string): Promise<Pago | null>;
  findByPropietario(propietarioId: string, page?: number, limit?: number): Promise<{ pagos: Pago[], total: number }>;
  update(id: string, data: Partial<CreatePagoDto>): Promise<Pago>;
  delete(id: string): Promise<void>;
  getStats(propietarioId?: string): Promise<{ total: number, montoTotal: number, promedio: number }>;
}
