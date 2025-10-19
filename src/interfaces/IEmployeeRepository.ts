import { PrismaClient, Empleado } from '@prisma/client';

export interface IEmployeeRepository {
  // Operaciones básicas CRUD
  create(data: CreateEmployeeData): Promise<Empleado>;
  findById(id: string): Promise<Empleado | null>;
  findByUserId(usuarioId: string, page?: number, limit?: number): Promise<{ empleados: Empleado[], total: number }>;
  update(id: string, data: UpdateEmployeeData): Promise<Empleado>;
  delete(id: string): Promise<Empleado>;
  
  // Operaciones de búsqueda y filtrado
  searchByUserId(usuarioId: string, searchTerm: string, page?: number, limit?: number): Promise<{ empleados: Empleado[], total: number }>;
  findByPhone(usuarioId: string, telefono: string): Promise<Empleado | null>;
  
  // Operaciones de estado
  toggleStatus(id: string): Promise<Empleado>;
  getActiveByUserId(usuarioId: string): Promise<Empleado[]>;
  getInactiveByUserId(usuarioId: string): Promise<Empleado[]>;
  
  // Estadísticas
  getStatsByUserId(usuarioId: string): Promise<EmployeeStats>;
}

export interface CreateEmployeeData {
  usuarioId: string;
  nombre: string;
  telefono: string;
}

export interface UpdateEmployeeData {
  nombre?: string;
  telefono?: string;
  activo?: boolean;
}

export interface EmployeeStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  empleadosRecientes: number; // Últimos 30 días
}
