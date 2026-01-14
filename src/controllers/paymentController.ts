import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleSheetService } from '../services/googleSheetService';
import { TrialService } from '../services/trialService';
import { fcmService } from '../services/fcmService';
import { MembresiaUsuarioService } from '../services/membresiaUsuarioService';

const prisma = new PrismaClient();

// Procesar pago recibido por Yape (Logging a Google Sheets)
export const procesarPagoYape = async (req: Request, res: Response) => {
  try {
    console.log('🔥🔥🔥 PAYMENT CONTROLLER - INICIO 🔥🔥🔥');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const {
      usuarioId,
      nombrePagador,
      monto,
      codigoSeguridad,
      medioDePago // 'Yape' o 'Plin'
    } = req.body;

    console.log('Datos extraídos:', { usuarioId, nombrePagador, monto, codigoSeguridad, medioDePago });

    // Validar datos requeridos
    if (!usuarioId || !nombrePagador || !monto || !codigoSeguridad) {
      console.log('❌ VALIDACIÓN FALLIDA - Datos faltantes');
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: usuarioId, nombrePagador, monto, codigoSeguridad'
      });
    }

    console.log('✅ Validación de datos OK');

    // Verificar que el usuario existe y obtener Folder ID
    console.log(`🔍 Buscando usuario: ${usuarioId}`);
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rol: true
      }
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Usuario encontrado: ${usuario.nombre} (${usuario.email})`);
    console.log(`   Rol: ${usuario.rol.nombre}`);
    console.log(`   Google Drive Folder ID: ${usuario.googleDriveFolderId || 'NO CONFIGURADO'}`);

    if (!usuario.googleDriveFolderId) {
      console.log('❌ Usuario sin carpeta de Google Drive configurada');
      return res.status(500).json({
        success: false,
        message: 'El usuario no tiene configurada una carpeta de Google Drive.'
      });
    }

    // ==========================================
    // VALIDACIÓN ESTRICTA DE MEMBRESÍA/PRUEBA
    // ==========================================
    if (usuario.rol.nombre === 'propietario') {
      const now = new Date();
      let isAuthorized = false;

      // 1. Verificar Periodo de Prueba
      if (usuario.fechaFinPrueba && usuario.fechaFinPrueba > now) {
        isAuthorized = true;
        console.log('✅ Autorizado por Periodo de Prueba vigente');
      }

      // 2. Verificar Membresía Activa (si prueba venció)
      if (!isAuthorized) {
        const tieneMembresia = await MembresiaUsuarioService.tieneMembresiaActiva(usuario.id);
        if (tieneMembresia) {
          isAuthorized = true;
          console.log('✅ Autorizado por Membresía Activa');
        }
      }

      if (!isAuthorized) {
        console.log('⛔ PAGO BLOQUEADO: Prueba y Membresía vencidas');
        return res.status(403).json({
          success: false,
          message: 'El servicio ha sido suspendido por falta de pago o prueba vencida.',
          error: 'MEMBRESIA_VENCIDA'
        });
      }
    }
    // ==========================================

    // Registrar en Google Sheet Diario
    console.log('📊 Intentando registrar en Google Sheets...');
    console.log(`   Folder ID: ${usuario.googleDriveFolderId}`);
    try {
      await googleSheetService.addPaymentRow(usuario.googleDriveFolderId, {
        nombrePagador,
        monto: parseFloat(monto),
        fecha: new Date().toLocaleString('es-PE'), // Formato local
        codigoSeguridad,
        medioDePago: medioDePago || 'Yape' // Default a Yape si no se especifica
      });
      console.log('✅ Pago registrado en Google Sheets exitosamente');

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
    console.log('📱 Iniciando lógica de SMS...');
    const numerosParaSMS: string[] = [];

    try {
      // 1. Obtener empleados activos del usuario
      console.log(`🔍 Buscando empleados activos para usuario: ${usuarioId}`);
      const empleados = await prisma.empleado.findMany({
        where: {
          usuarioId: usuarioId,
          activo: true
        },
        include: {
          horariosLaborales: true
        }
      });
      console.log(`   Empleados encontrados: ${empleados.length}`);

      // 2. Calcular hora actual en Perú (UTC-5)
      // Usamos una fecha base y ajustamos
      const now = new Date();
      const peruTimeData = now.toLocaleString("en-US", { timeZone: "America/Lima" });
      const peruDate = new Date(peruTimeData);
      console.log(`⏰ Hora actual en Perú: ${peruDate.toLocaleTimeString('es-PE')}`);

      // 3. Filtrar por Horario
      // Prisma usa 1=Lunes, 7=Domingo (ISO)
      // JS getDay() usa 0=Domingo, 1=Lunes...
      const jsDay = peruDate.getDay();
      const currentIsoDay = jsDay === 0 ? 7 : jsDay;
      console.log(`   Día de la semana (ISO): ${currentIsoDay}`);

      const currentHours = peruDate.getHours();
      const currentMinutes = peruDate.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;
      console.log(`   Minutos desde medianoche: ${currentTimeVal}`);

      for (const emp of empleados) {
        console.log(`   Procesando empleado: ${emp.nombre}`);
        if (!emp.telefono) {
          console.log(`      ⚠️ Sin teléfono registrado, saltando...`);
          continue;
        }
        console.log(`      Teléfono: ${emp.telefono}`);

        // Comparar con Int (1-7)
        const horariosHoy = emp.horariosLaborales.filter(h => (h.diaSemana as any) === currentIsoDay && h.activo);
        console.log(`      Horarios hoy: ${horariosHoy.length}`);

        let isWorking = false;
        for (const h of horariosHoy) {
          if (!h.horaInicio || !h.horaFin) continue;

          const [hInicio, mInicio] = h.horaInicio.split(':').map(Number);
          const startVal = hInicio * 60 + mInicio;

          const [hFin, mFin] = h.horaFin.split(':').map(Number);
          const endVal = hFin * 60 + mFin;

          console.log(`         Horario: ${h.horaInicio} - ${h.horaFin} (${startVal} - ${endVal})`);
          console.log(`         Hora actual: ${currentTimeVal}`);

          if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
            console.log(`         ✅ EMPLEADO TRABAJANDO AHORA`);
            isWorking = true;
            break;
          } else {
            console.log(`         ❌ Fuera de horario`);
          }
        }

        if (isWorking) {
          console.log(`      ✅ Agregando ${emp.telefono} a lista SMS`);
          numerosParaSMS.push(emp.telefono);
        } else {
          console.log(`      ❌ No está trabajando, no se enviará SMS`);
        }
      }
      console.log(`📱 [SMS LOGIC] Total destinatarios: ${numerosParaSMS.length}`);
      console.log(`   Números: ${numerosParaSMS.join(', ') || 'NINGUNO'}`);

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
