import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MembresiaService {
  // Asignar membresía mensual a usuario
  static async asignarMembresia(usuarioId: string, tipo: string, precio: number) {
    const fechaInicio = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setMonth(fechaInicio.getMonth() + 1); // 1 mes

    // Desactivar membresías anteriores del usuario
    await prisma.membresia.updateMany({
      where: { usuarioId, activa: true },
      data: { activa: false }
    });

    // Crear nueva membresía
    return await prisma.membresia.create({
      data: {
        usuarioId,
        tipo,
        fechaInicio,
        fechaExpiracion,
        diasRestantes: 30, // 30 días por defecto
        precio
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });
  }

  // Obtener membresía activa de usuario
  static async obtenerMembresiaActiva(usuarioId: string) {
    return await prisma.membresia.findFirst({
      where: {
        usuarioId,
        activa: true,
        fechaExpiracion: { gt: new Date() }
      }
    });
  }

  // Actualizar días restantes de membresías
  static async actualizarDiasRestantes() {
    const membresiasActivas = await prisma.membresia.findMany({
      where: {
        activa: true,
        fechaExpiracion: { gt: new Date() }
      }
    });

    const hoy = new Date();
    let actualizadas = 0;

    for (const membresia of membresiasActivas) {
      const diasRestantes = Math.ceil(
        (membresia.fechaExpiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasRestantes <= 0) {
        // Desactivar membresía expirada
        await prisma.membresia.update({
          where: { id: membresia.id },
          data: { 
            activa: false,
            diasRestantes: 0
          }
        });
      } else {
        // Actualizar días restantes
        await prisma.membresia.update({
          where: { id: membresia.id },
          data: { diasRestantes }
        });
        actualizadas++;
      }
    }

    return { actualizadas, expiradas: membresiasActivas.length - actualizadas };
  }

  // Verificar si usuario tiene acceso (membresía activa o período de prueba)
  static async verificarAcceso(usuarioId: string): Promise<{
    tieneAcceso: boolean;
    tipoAcceso: 'membresia' | 'prueba' | 'sin_acceso';
    diasRestantes: number;
    mensaje?: string;
  }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        membresias: {
          where: { activa: true },
          orderBy: { fechaExpiracion: 'desc' },
          take: 1
        }
      }
    });

    if (!usuario) {
      return {
        tieneAcceso: false,
        tipoAcceso: 'sin_acceso',
        diasRestantes: 0,
        mensaje: 'Usuario no encontrado'
      };
    }

    // Super Admin tiene acceso ilimitado
    if (usuario.rolId === 'super_admin') {
      return {
        tieneAcceso: true,
        tipoAcceso: 'membresia',
        diasRestantes: 999999,
        mensaje: 'Acceso ilimitado (Super Admin)'
      };
    }

    // Verificar membresía activa
    if (usuario.membresias.length > 0) {
      const membresia = usuario.membresias[0];
      const diasRestantes = Math.ceil(
        (membresia.fechaExpiracion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasRestantes > 0) {
        return {
          tieneAcceso: true,
          tipoAcceso: 'membresia',
          diasRestantes,
          mensaje: `Membresía ${membresia.tipo} activa`
        };
      }
    }

    // Verificar período de prueba
    if (usuario.enPeriodoPrueba && usuario.diasPruebaRestantes > 0) {
      return {
        tieneAcceso: true,
        tipoAcceso: 'prueba',
        diasRestantes: usuario.diasPruebaRestantes,
        mensaje: 'Período de prueba activo'
      };
    }

    return {
      tieneAcceso: false,
      tipoAcceso: 'sin_acceso',
      diasRestantes: 0,
      mensaje: 'Sin membresía activa ni período de prueba'
    };
  }

  // Obtener estadísticas de membresías
  static async obtenerEstadisticas() {
    const [
      totalMembresias,
      membresiasActivas,
      membresiasExpiradas
    ] = await Promise.all([
      prisma.membresia.count(),
      prisma.membresia.count({
        where: {
          activa: true,
          fechaExpiracion: { gt: new Date() }
        }
      }),
      prisma.membresia.count({
        where: {
          OR: [
            { activa: false },
            { fechaExpiracion: { lte: new Date() } }
          ]
        }
      })
    ]);

    return {
      totalMembresias,
      membresiasActivas,
      membresiasExpiradas
    };
  }

  // Obtener tipos de membresía disponibles
  static obtenerTiposMembresia() {
    return [
      {
        tipo: 'basica',
        descripcion: 'Membresía básica - 30 días',
        precio: 29.90,
        duracionDias: 30
      },
      {
        tipo: 'premium',
        descripcion: 'Membresía premium - 30 días con funciones avanzadas',
        precio: 59.90,
        duracionDias: 30
      },
      {
        tipo: 'empresarial',
        descripcion: 'Membresía empresarial - 30 días con soporte prioritario',
        precio: 99.90,
        duracionDias: 30
      }
    ];
  }
}