import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleSheetService } from '../services/googleSheetService';
import { TrialService } from '../services/trialService';
import { fcmService } from '../services/fcmService';

const prisma = new PrismaClient();

// Procesar pago recibido por Yape (Logging a Google Sheets)
export const procesarPagoYape = async (req: Request, res: Response) => {
  try {
    const {
      usuarioId,
      nombrePagador,
      monto,
      codigoSeguridad
    } = req.body;

    // Validar datos requeridos
    if (!usuarioId || !nombrePagador || !monto || !codigoSeguridad) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: usuarioId, nombrePagador, monto, codigoSeguridad'
      });
    }

    // Verificar que el usuario existe y obtener Folder ID
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!usuario.googleDriveFolderId) {
      return res.status(500).json({
        success: false,
        message: 'El usuario no tiene configurada una carpeta de Google Drive.'
      });
    }

    // Registrar en Google Sheet Diario
    try {
      await googleSheetService.addPaymentRow(usuario.googleDriveFolderId, {
        nombrePagador,
        monto: parseFloat(monto),
        fecha: new Date().toLocaleString('es-PE'), // Formato local
        codigoSeguridad
      });

      // NOTIFICAR A EMPLEADOS (FCM)
      try {
        // Enviar al topic del negocio (business_{usuarioId})
        const topic = `business_${usuarioId}`;
        const title = '💰 Nuevo Pago Yape Recibido';
        const body = `${nombrePagador} ha pagado S/ ${monto}. Código: ${codigoSeguridad}`;

        await fcmService.sendToTopic(topic, title, body, {
          type: 'PAYMENT_RECEIVED',
          amount: String(monto),
          payer: nombrePagador,
          code: codigoSeguridad
        });

        console.log(`Notificación enviada al topic ${topic}`);
      } catch (fcmError) {
        console.error('Error enviando notificación FCM:', fcmError);
        // No fallamos la request si la notificación falla, pero lo logeamos
      }

    } catch (sheetError) {
      console.error('Error registrando en Sheets:', sheetError);
      return res.status(500).json({
        success: false,
        message: 'Error registrando el pago en Google Sheets',
        error: sheetError instanceof Error ? sheetError.message : String(sheetError)
      });
    }


    // ==========================================
    // LÓGICA DE SMS (VERIFICAR HORARIOS)
    // ==========================================
    const numerosParaSMS: string[] = [];

    try {
      // 1. Obtener empleados activos del usuario
      const empleados = await prisma.empleado.findMany({
        where: {
          usuarioId: usuarioId,
          activo: true
        },
        include: {
          horariosLaborales: true
        }
      });

      // 2. Calcular hora actual en Perú (UTC-5)
      // Usamos una fecha base y ajustamos
      const now = new Date();
      const peruTimeData = now.toLocaleString("en-US", { timeZone: "America/Lima" });
      const peruDate = new Date(peruTimeData);

      // 3. Filtrar por Horario
      // Prisma usa 1=Lunes, 7=Domingo (ISO)
      // JS getDay() usa 0=Domingo, 1=Lunes...
      const jsDay = peruDate.getDay();
      const currentIsoDay = jsDay === 0 ? 7 : jsDay;

      const currentHours = peruDate.getHours();
      const currentMinutes = peruDate.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      for (const emp of empleados) {
        if (!emp.telefono) continue;

        // Comparar con Int (1-7)
        const horariosHoy = emp.horariosLaborales.filter(h => (h.diaSemana as any) === currentIsoDay && h.activo);

        let isWorking = false;
        for (const h of horariosHoy) {
          if (!h.horaInicio || !h.horaFin) continue;

          const [hInicio, mInicio] = h.horaInicio.split(':').map(Number);
          const startVal = hInicio * 60 + mInicio;

          const [hFin, mFin] = h.horaFin.split(':').map(Number);
          const endVal = hFin * 60 + mFin;

          if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
            isWorking = true;
            break;
          }
        }

        if (isWorking) {
          numerosParaSMS.push(emp.telefono);
        }
      }
      console.log(`[SMS LOGIC] Enviar a: ${numerosParaSMS.join(', ')} (Hora Peru: ${peruDate.toLocaleTimeString()})`);

    } catch (smsLogicError) {
      console.error('Error calculando destinatarios SMS:', smsLogicError);
    }
    // ==========================================

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente en Google Drive, notificado y procesado para SMS',
      data: {
        nombrePagador,
        monto,
        codigoSeguridad,
        registradoEnDrive: true,
        notificado: true,
        smsTargets: numerosParaSMS // Devolver lista para que el Frontend envíe el SMS
      }
    });

  } catch (error: any) {
    console.error('Error general procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Endpoints obsoletos (Stubbed para evitar errores de frontend)
export const obtenerPagosUsuario = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      pagos: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    }
  });
};

export const obtenerEstadisticasPagos = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalPagos: 0,
      pagosHoy: 0,
      pagosEstaSemana: 0,
      montoTotal: 0,
      montoHoy: 0,
      montoEstaSemana: 0
    }
  });
};
