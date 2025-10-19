import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SmsService } from '../services/smsService';
import { TrialService } from '../services/trialService';

const prisma = new PrismaClient();

// Procesar pago recibido por Yape
export const procesarPagoYape = async (req: Request, res: Response) => {
  try {
    const { 
      usuarioId, 
      nombrePagador, 
      monto, 
      codigoSeguridad, 
      numeroTelefono, 
      mensajeOriginal 
    } = req.body;

    // Validar datos requeridos
    if (!usuarioId || !nombrePagador || !monto || !codigoSeguridad) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: usuarioId, nombrePagador, monto, codigoSeguridad'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el código de seguridad ya existe (evitar duplicados)
    const pagoExistente = await prisma.pago.findUnique({
      where: { codigoSeguridad }
    });

    if (pagoExistente) {
      return res.status(409).json({
        success: false,
        message: 'Este pago ya fue procesado anteriormente'
      });
    }

    // Crear el pago en la base de datos
    const nuevoPago = await prisma.pago.create({
      data: {
        usuarioId,
        nombrePagador,
        monto: parseFloat(monto),
        fecha: new Date(),
        codigoSeguridad,
        numeroTelefono,
        mensajeOriginal,
        registradoEnSheets: false,
        notificadoEmpleados: false
      }
    });

    // Enviar SMS a empleados del usuario
    try {
      const mensajeSMS = `💰 Nuevo pago recibido: S/ ${monto} de ${nombrePagador}`;
      const resultadoSMS = await SmsService.enviarSmsAMpleados(usuarioId, mensajeSMS);
      
      // Actualizar el pago como notificado
      await prisma.pago.update({
        where: { id: nuevoPago.id },
        data: { 
          notificadoEmpleados: true,
          procesadoAt: new Date()
        }
      });

      // Verificar si el usuario está en período de prueba
      if (usuario.enPeriodoPrueba) {
        const estaEnPrueba = await TrialService.estaEnPeriodoPrueba(usuarioId);
        if (estaEnPrueba) {
          // El usuario está en período de prueba, se puede extender si es necesario
          console.log(`Usuario ${usuarioId} está en período de prueba`);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          pago: {
            id: nuevoPago.id,
            monto: nuevoPago.monto,
            nombrePagador: nuevoPago.nombrePagador,
            fecha: nuevoPago.fecha,
            codigoSeguridad: nuevoPago.codigoSeguridad
          },
          sms: {
            enviado: true,
            empleadosNotificados: resultadoSMS.data.empleadosElegibles,
            mensaje: resultadoSMS.message
          }
        },
        message: 'Pago procesado y empleados notificados exitosamente'
      });

    } catch (errorSMS: any) {
      console.error('Error enviando SMS:', errorSMS);
      
      // El pago se creó pero no se pudo notificar
      res.status(201).json({
        success: true,
        data: {
          pago: {
            id: nuevoPago.id,
            monto: nuevoPago.monto,
            nombrePagador: nuevoPago.nombrePagador,
            fecha: nuevoPago.fecha,
            codigoSeguridad: nuevoPago.codigoSeguridad
          },
          sms: {
            enviado: false,
            error: errorSMS.message
          }
        },
        message: 'Pago procesado pero error al notificar empleados'
      });
    }

  } catch (error: any) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener pagos de un usuario
export const obtenerPagosUsuario = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pagos = await prisma.pago.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.pago.count({
      where: { usuarioId }
    });

    res.json({
      success: true,
      data: {
        pagos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de pagos
export const obtenerEstadisticasPagos = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const [
      totalPagos,
      pagosHoy,
      pagosEstaSemana,
      montoTotal,
      montoHoy,
      montoEstaSemana
    ] = await Promise.all([
      prisma.pago.count({ where: { usuarioId } }),
      prisma.pago.count({ 
        where: { 
          usuarioId,
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.pago.count({
        where: {
          usuarioId,
          fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.pago.aggregate({
        where: { usuarioId },
        _sum: { monto: true }
      }),
      prisma.pago.aggregate({
        where: { 
          usuarioId,
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { monto: true }
      }),
      prisma.pago.aggregate({
        where: {
          usuarioId,
          fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { monto: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPagos,
        pagosHoy,
        pagosEstaSemana,
        montoTotal: montoTotal._sum.monto || 0,
        montoHoy: montoHoy._sum.monto || 0,
        montoEstaSemana: montoEstaSemana._sum.monto || 0
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
