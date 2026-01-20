import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import prisma from '../config/database';
import { googleDriveService } from '../services/googleDriveService';
import { MembresiaUsuarioService } from '../services/membresiaUsuarioService';
import { googleTokenService } from '../services/googleTokenService';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, accessToken, refreshToken } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de Google requerido'
      });
    }

    // Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const { email, name, sub: googleId, picture } = payload;

    // console.log('🔍 [GoogleLogin] Payload received:', { email, name, hasPicture: !!picture, pictureUrl: picture });

    // Extraer Folder ID si viene desde el cliente
    const { googleDriveFolderId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El token no contiene email'
      });
    }

    // Buscar usuario existente
    let user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      // Opcional: Solo permitir registro si el usuario ya fue invitado o si es el propietario inicial
      // Por ahora permitiremos registro abierto como 'propietario' si no hay usuarios, o error

      // Buscar rol propietario
      const rolPropietario = await prisma.rol.findFirst({
        where: { nombre: 'propietario' }
      });

      if (!rolPropietario) {
        return res.status(500).json({ success: false, message: 'Rol propietario no encontrado' });
      }

      // Crear carpeta en Google Drive para registros de pago (Fallback si la app no la envió)
      let folderId = googleDriveFolderId || null;

      if (!folderId) {
        try {
          // Nombre más amigable para el usuario
          // Primero verificamos si ya existe para no crear duplicados
          folderId = await googleDriveService.findFolderByName('Reporte de Pagos - Feelin Pay');

          if (!folderId) {
            folderId = await googleDriveService.createFolder('Reporte de Pagos - Feelin Pay');
          }

          if (folderId) {
            // Compartir la carpeta con el usuario para que la vea en su Drive
            await googleDriveService.shareFolder(folderId, email);
          }
        } catch (driveError) {
          console.error('Error creando carpeta de Drive (Fallback):', driveError);
          // No bloqueamos el registro, pero logueamos el error
        }
      } else {
        console.log('✅ Usando Folder ID provisto por la App:', folderId);
      }

      // Crear nuevo usuario
      const now = new Date();
      const fechaFinPrueba = new Date(now);
      fechaFinPrueba.setDate(fechaFinPrueba.getDate() + 3); // 3 días de prueba

      user = await prisma.usuario.create({
        data: {
          email,
          nombre: name || 'Usuario Google',
          googleId,
          imagen: picture, // Guardar imagen de Google
          rolId: rolPropietario.id,
          googleDriveFolderId: folderId,
          activo: true,
          fechaInicioPrueba: now,
          fechaFinPrueba: fechaFinPrueba // Registramos fecha fin exacta
        },
        include: {
          rol: {
            include: {
              permisos: {
                include: {
                  permiso: true
                }
              }
            }
          }
        }
      });
    } else {
      // Actualizar información de Google en cada login
      const updateData: any = {};

      // Actualizar googleId si no existía o si es un ID temporal del seeder
      if (!user.googleId || user.googleId.startsWith('google_')) {
        updateData.googleId = googleId;
      }

      // Actualizar nombre si viene de Google y es diferente
      if (name && name !== user.nombre) {
        updateData.nombre = name;
      }

      // Actualizar imagen si ha cambiado
      if (picture && user.imagen !== picture) {
        updateData.imagen = picture;
      }

      // IMPORTANTE: Actualizar Folder ID si la app envió uno nuevo/diferente
      if (googleDriveFolderId && googleDriveFolderId !== user.googleDriveFolderId) {
        console.log('🔄 Actualizando Folder ID desde App:', googleDriveFolderId);
        updateData.googleDriveFolderId = googleDriveFolderId;
      }

      // NUEVO: Guardar tokens de Google para acceso privado a Drive
      if (accessToken) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Los tokens de Google expiran en ~1 hora
        updateData.googleAccessToken = accessToken;
        updateData.googleTokenExpiresAt = expiresAt;
        console.log('🔑 Token de Google guardado en BD');
      }

      if (refreshToken) {
        updateData.googleRefreshToken = refreshToken;
        console.log('🔄 Refresh token de Google guardado en BD');
      }

      // IMPORTANTE: Verificar siempre si tiene carpeta
      let needsFolderCreation = !user.googleDriveFolderId && !googleDriveFolderId;

      // Si tiene ID en BD, verificar que exista realmente en Drive (Wrapped in try-catch for safety)
      if (user.googleDriveFolderId) {
        try {
          const folderExists = await googleDriveService.checkFolderExists(user.googleDriveFolderId);
          if (!folderExists) {
            console.log(`Usuario ${email} tiene ID pero la carpeta no existe/fue borrada. Recreating...`);
            needsFolderCreation = true;
          }
        } catch (checkError: any) {
          // Suppress "Service Account not initialized" error as it is expected in User Auth mode
          if (checkError.message && (checkError.message.includes('Google Service Account') || checkError.message.includes('service-account'))) {
            console.log('ℹ️ [Auth] Verificación de carpeta omitida (Modo Usuario/Sin Service Account).');
          } else {
            console.warn('⚠️ [Auth] Warning checking folder existence:', checkError.message);
          }
        }
      }

      if (needsFolderCreation) {
        try {
          console.log(`📂 [Auth] Verifying Drive folder for ${email}...`);

          // 1. CRITICAL: Search for EXISTING folder first to avoid duplicates
          // Use exact name match inside 'findFolderByName'
          let folderId = await googleDriveService.findFolderByName('Reporte de Pagos - Feelin Pay');

          if (folderId) {
            console.log(`✅ [Auth] Found existing folder: ${folderId}. Reusing.`);
          } else {
            // 2. Only create if absolutely NOT found
            console.log(`✨ [Auth] No folder found. Creating new 'Reporte de Pagos - Feelin Pay'...`);
            folderId = await googleDriveService.createFolder('Reporte de Pagos - Feelin Pay');
            console.log(`✅ [Auth] New folder created: ${folderId}`);
          }

          if (folderId) {
            // 3. Ensure shared permission
            console.log(`🔗 [Auth] Ensuring folder is shared with ${email}...`);
            await googleDriveService.shareFolder(folderId, email);
            updateData.googleDriveFolderId = folderId;
          }
        } catch (driveError) {
          // Silently fail - Drive folder management is optional
        }
      }

      // Solo hacer update si hay cambios
      if (Object.keys(updateData).length > 0) {
        user = await prisma.usuario.update({
          where: { id: user.id },
          data: updateData,
          include: {
            rol: {
              include: {
                permisos: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        });
      }
    }

    // ==========================================
    // LÓGICA DE ACCESO POR ROL
    // ==========================================

    // 1. Super Admin: Acceso total siempre (si está activo)
    if (!user.activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' });
    }

    if (user.rol.nombre === 'super_admin') {
      // Pasa libre
    } else if (user.rol.nombre === 'propietario') {
      // 2. Propietario: Verificar Prueba o Membresía
      const now = new Date();
      let accessGranted = false;
      let reason = '';

      // A) Verificar periodo de prueba
      if (user.fechaFinPrueba && user.fechaFinPrueba > now) {
        accessGranted = true;
        reason = 'Periodo de prueba activo';
      }

      // B) Si prueba vencida, verificar membresía
      if (!accessGranted) {
        const tieneMembresia = await MembresiaUsuarioService.tieneMembresiaActiva(user.id);
        if (tieneMembresia) {
          accessGranted = true;
          reason = 'Membresía activa';
        } else {
          reason = 'Prueba finalizada y sin membresía activa';
        }
      }

      if (!accessGranted) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Su periodo de prueba ha finalizado y no posee una membresía activa.',
          code: 'TRIAL_EXPIRED'
        });
      }
    }

    // Generar JWT propio
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol.nombre
      },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token: jwtToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol, // Full role object with permissions
        activo: user.activo,
        imagen: user.imagen, // Usar imagen guardada
        googleDriveFolderId: user.googleDriveFolderId
      }
    });

  } catch (error) {
    console.error('Error en Google Login:', error);
    res.status(500).json({
      success: false,
      message: 'Error de autenticación con Google'
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        rol: user.rol, // Full role object with permissions
        rolNombre: user.rol.nombre
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

// Method removed: updateProfile was unused.

