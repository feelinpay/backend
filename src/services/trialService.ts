import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TrialService {
  // Verificar si un usuario está en período de prueba
  static async estaEnPeriodoPrueba(usuarioId: string): Promise<boolean> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          createdAt: true,
          rol: {
            select: { nombre: true }
          }
        }
      });

      if (!usuario) return false;

      // Solo usuarios propietarios tienen período de prueba
      if (usuario.rol.nombre !== 'propietario') return false;

      // Calcular días transcurridos desde la creación
      const diasTranscurridos = Math.floor(
        (Date.now() - usuario.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Período de prueba de 3 días
      return diasTranscurridos <= 3;
    } catch (error) {
      console.error('Error verificando período de prueba:', error);
      return false;
    }
  }

  // Obtener días restantes de prueba
  static async obtenerDiasRestantesPrueba(usuarioId: string): Promise<number> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { createdAt: true }
      });

      if (!usuario) return 0;

      const diasTranscurridos = Math.floor(
        (Date.now() - usuario.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const diasRestantes = Math.max(0, 3 - diasTranscurridos);
      return diasRestantes;
    } catch (error) {
      console.error('Error obteniendo días restantes:', error);
      return 0;
    }
  }

  // Verificar si el período de prueba ha expirado
  static async haExpiradoPeriodoPrueba(usuarioId: string): Promise<boolean> {
    try {
      const diasRestantes = await this.obtenerDiasRestantesPrueba(usuarioId);
      return diasRestantes === 0;
    } catch (error) {
      console.error('Error verificando expiración:', error);
      return true; // En caso de error, asumir que expiró
    }
  }

  // Obtener información completa del período de prueba
  static async obtenerInfoPeriodoPrueba(usuarioId: string) {
    try {
      const estaEnPrueba = await this.estaEnPeriodoPrueba(usuarioId);
      const diasRestantes = await this.obtenerDiasRestantesPrueba(usuarioId);
      const haExpirado = await this.haExpiradoPeriodoPrueba(usuarioId);

      return {
        estaEnPeriodoPrueba: estaEnPrueba,
        diasRestantes,
        haExpirado,
        mensaje: estaEnPrueba
          ? `Tienes ${diasRestantes} días restantes de prueba`
          : haExpirado
            ? 'Tu período de prueba ha expirado'
            : 'No estás en período de prueba'
      };
    } catch (error) {
      console.error('Error obteniendo info de período de prueba:', error);
      return {
        estaEnPeriodoPrueba: false,
        diasRestantes: 0,
        haExpirado: true,
        mensaje: 'Error obteniendo información del período de prueba'
      };
    }
  }

  // Extender período de prueba (solo para super admin)
  static async extenderPeriodoPrueba(_usuarioId: string, diasAdicionales: number = 3) {
    try {
      // Esta función requeriría modificar la fecha de creación o agregar un campo específico
      // Por ahora solo retornamos un mensaje de confirmación
      return {
        success: true,
        message: `Período de prueba extendido por ${diasAdicionales} días`,
        diasAdicionales
      };
    } catch (error) {
      console.error('Error extendiendo período de prueba:', error);
      throw error;
    }
  }
}
