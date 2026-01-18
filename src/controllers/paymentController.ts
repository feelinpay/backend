import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleSheetService } from '../services/googleSheetService';
import { googleDriveService } from '../services/googleDriveService'; // Import necesario para Auto-Healing
import { TrialService } from '../services/trialService';
import { fcmService } from '../services/fcmService';
import { MembresiaUsuarioService } from '../services/membresiaUsuarioService';
import { googleTokenService } from '../services/googleTokenService';

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
      medioDePago, // 'Yape' o 'Plin'
      googleAccessToken // NUEVO: Token para operaciones privadas
    } = req.body;

    console.log('Datos extraídos:', { usuarioId, nombrePagador, monto, codigoSeguridad, medioDePago });

    if (googleAccessToken) {
      console.log('🔑 Token de acceso de Google recibido. Usando almacenamiento del usuario.');
    } else {
      console.log('⚠️ Sin token de acceso de Google. Usando almacenamiento del sistema (Service Account).');
    }

    // Validar datos requeridos (codigoSeguridad es opcional para medioDePago 'plin')
    const esPlin = medioDePago?.toLowerCase() === 'plin';
    const hasRequired = usuarioId && nombrePagador && (monto !== undefined && monto !== null && monto !== '') && (esPlin || codigoSeguridad);

    if (!hasRequired) {
      console.log('❌ VALIDACIÓN FALLIDA - Datos faltantes');
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: usuarioId, nombrePagador, monto, codigoSeguridad (solo para Yape)'
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
    // OBTENER TOKEN DE GOOGLE VÁLIDO (CON REFRESH AUTOMÁTICO)
    // ==========================================
    let finalGoogleAccessToken = googleAccessToken; // Token del cliente (fallback)

    // Priorizar token de BD con refresh automático
    try {
      const dbToken = await googleTokenService.getValidToken(usuario.id);
      if (dbToken) {
        finalGoogleAccessToken = dbToken;
        console.log('🔑 Usando token de BD (refrescado automáticamente si era necesario)');
      } else if (googleAccessToken) {
        console.log('⚠️ No hay token en BD. Usando token del cliente como fallback.');
      } else {
        console.log('⚠️ Sin token de Google. Usando Service Account (cuota limitada).');
      }
    } catch (tokenError) {
      console.error('❌ Error obteniendo token de BD:', tokenError);
      if (!googleAccessToken) {
        console.log('⚠️ Fallback a Service Account.');
      }
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

    // ==========================================
    // 1. LÓGICA DE SMS (VERIFICAR HORARIOS) - PRIORIDAD 1
    // ==========================================
    console.log('📱 Iniciando lógica de SMS...');
    const numerosParaSMS: string[] = [];

    try {
      // Obtener empleados activos del usuario
      console.log(`🔍 Buscando empleados activos para usuario: ${usuarioId}`);
      const empleados = await prisma.empleado.findMany({
        where: {
          usuarioId: usuarioId,
          activo: true
        }
      });

      console.log(`   Empleados encontrados: ${empleados.length}`);

      // Calcular hora actual en Perú (UTC-5)
      const now = new Date();
      const peruTimeData = now.toLocaleString("en-US", { timeZone: "America/Lima" });
      const peruDate = new Date(peruTimeData);
      console.log(`⏰ Hora actual en Perú: ${peruDate.toLocaleTimeString('es-PE')}`);

      // Filtrar por Horario
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

        // Mapear día ISO a nombre en español
        const diasSemanaMap: { [key: string]: string } = {
          '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves',
          '5': 'Viernes', '6': 'Sábado', '7': 'Domingo'
        };
        const diaNombre = diasSemanaMap[String(currentIsoDay)];

        // Obtener horarios del JSON
        const horarioLaboral = emp.horarioLaboral as any;
        const horariosHoy = (horarioLaboral && horarioLaboral[diaNombre])
          ? (horarioLaboral[diaNombre] as any[]).filter(h => h.activo)
          : [];

        console.log(`      Horarios hoy (${diaNombre}): ${horariosHoy.length}`);

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


    // ==========================================
    // 2. REGISTRO EN GOOGLE SHEETS
    // ==========================================
    console.log('📊 Intentando registrar en Google Sheets...');
    console.log(`   Folder ID Reference: ${usuario.googleDriveFolderId}`);
    let driveSuccess = false;
    let driveErrorMsg: string | null = null;

    try {
      await googleSheetService.addPaymentRow(
        usuario.googleDriveFolderId,
        {
          nombrePagador,
          monto: parseFloat(monto),
          fecha: new Date().toLocaleString('es-PE'),
          codigoSeguridad,
          medioDePago: medioDePago || 'Yape'
        },
        finalGoogleAccessToken // Usar token de BD (con refresh automático)
      );
      console.log('✅ Pago registrado en Google Sheets exitosamente');
      driveSuccess = true;
      driveErrorMsg = null;
    } catch (sheetError: any) {
      console.error('❌ Error registrando en Sheets:', sheetError.message);

      // ==========================================
      // AUTO-HEALING: Recrear carpeta si no existe
      // ==========================================
      // Nota: Con User Auth, esto es menos probable ya que ensureDailyPaymentSheet crea la carpeta si no existe.
      // Pero mantenemos la lógica por si el ID guardado es incorrecto o para flujos legacy.
      if (sheetError.message?.includes('Report folder not accessible') ||
        sheetError.message?.includes('404') ||
        sheetError.message?.includes('not found')) {

        console.log('🛠️ Iniciando Auto-Healing de carpeta Drive...');
        try {
          let newFolderId: string | null = null;

          if (finalGoogleAccessToken) {
            // Si tenemos token de usuario, aseguramos que exista la carpeta en SU drive
            newFolderId = await googleDriveService.findFolderByName('Reporte de Pagos - Feelin Pay', finalGoogleAccessToken);
            if (!newFolderId) {
              newFolderId = await googleDriveService.createFolder('Reporte de Pagos - Feelin Pay', finalGoogleAccessToken);
            }
          } else {
            // Fallback Service Account
            newFolderId = await googleDriveService.findFolderByName('Reporte de Pagos - Feelin Pay');
            if (!newFolderId) {
              newFolderId = await googleDriveService.createFolder('Reporte de Pagos - Feelin Pay');
            }
          }

          if (newFolderId) {
            // Solo compartir si es Service Account (el usuario ya es dueño si usa su token)
            if (!finalGoogleAccessToken) {
              await googleDriveService.shareFolder(newFolderId, usuario.email);
            }

            // 4. Actualizar en BD para el futuro
            await prisma.usuario.update({
              where: { id: usuario.id },
              data: { googleDriveFolderId: newFolderId }
            });

            console.log(`✅ Carpeta recuperada: ${newFolderId}. Reintentando registro...`);

            // 5. REINTENTAR el registro una última vez con el nuevo ID
            await googleSheetService.addPaymentRow(
              newFolderId,
              {
                nombrePagador,
                monto: parseFloat(monto),
                fecha: new Date().toLocaleString('es-PE'),
                codigoSeguridad,
                medioDePago: medioDePago || 'Yape'
              },
              finalGoogleAccessToken // Usar token de BD
            );

            driveSuccess = true;
            driveErrorMsg = null;
          }
        } catch (repairError: any) {
          console.error('❌ Error crítico en Auto-Healing:', repairError.message);
          driveSuccess = false;
          driveErrorMsg = `Fallo en Auto-Healing: ${repairError.message}`;
        }
      } else {
        driveSuccess = false;
        driveErrorMsg = sheetError.message || String(sheetError);
      }
    }

    // NOTIFICAR A EMPLEADOS (FCM) - Mantenemos esto activo
    try {
      const topic = `business_${usuarioId}`;
      const title = `💰 Nuevo Pago ${medioDePago || 'Yape'} Recibido`;
      const codeMsg = codigoSeguridad ? `. Código: ${codigoSeguridad}` : '';
      const body = `${nombrePagador} ha pagado S/ ${monto}${codeMsg}`;

      await fcmService.sendToTopic(topic, title, body, {
        type: 'PAYMENT_RECEIVED',
        amount: String(monto),
        payer: nombrePagador,
        code: codigoSeguridad
      });
      console.log(`Notificación enviada al topic ${topic}`);
    } catch (fcmError) {
      console.error('Error enviando notificación FCM:', fcmError);
    }


    res.status(201).json({
      success: true,
      message: 'Pago procesado exitosamente.',
      data: {
        nombrePagador,
        monto,
        codigoSeguridad,
        registradoEnDrive: driveSuccess,
        driveError: driveErrorMsg,
        notificado: true,
        smsTargets: numerosParaSMS
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
