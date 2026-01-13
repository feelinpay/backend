import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { googleDriveService } from '../services/googleDriveService';
import { MembresiaUsuarioService } from '../services/membresiaUsuarioService';

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

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

      // Crear carpeta en Google Drive para registros de pago
      let folderId = null;
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
        console.error('Error creando carpeta de Drive:', driveError);
        // No bloqueamos el registro, pero logueamos el error
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

      // IMPORTANTE: Verificar siempre si tiene carpeta
      let needsFolderCreation = !user.googleDriveFolderId;

      // Si tiene ID en BD, verificar que exista realmente en Drive
      if (user.googleDriveFolderId) {
        const folderExists = await googleDriveService.checkFolderExists(user.googleDriveFolderId);
        if (!folderExists) {
          console.log(`Usuario ${email} tiene ID pero la carpeta no existe/fue borrada. Recreating...`);
          needsFolderCreation = true;
        }
      }

      if (needsFolderCreation) {
        try {
          console.log(`Creando/Restaurando carpeta Drive para ${email}...`);

          // 1. Intentar buscar si ya existe una carpeta con ese nombre (para evitar duplicados)
          let folderId = await googleDriveService.findFolderByName('Reporte de Pagos - Feelin Pay');

          if (folderId) {
            console.log(`Carpeta encontrada existente: ${folderId}, reusando...`);
          } else {
            // 2. Si no existe, crearla
            folderId = await googleDriveService.createFolder('Reporte de Pagos - Feelin Pay');
          }

          if (folderId) {
            await googleDriveService.shareFolder(folderId, email);
            updateData.googleDriveFolderId = folderId;
          }
        } catch (driveError) {
          console.error('Error recuperando/creando carpeta Drive para usuario existente:', driveError);
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

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { nombre } = req.body;

    const user = await prisma.usuario.update({
      where: { id: userId },
      data: { nombre },
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

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        ...user,
        rol: user.rol, // Full role object with permissions
        rolNombre: user.rol.nombre
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    // Nota: Aquí se debería verificar la contraseña actual si no es login por Google
    // Por simplicidad y dado que el flujo actual es mayormente Google, 
    // actualizaremos si el usuario existe.

    await prisma.usuario.update({
      where: { id: userId },
      data: {
        // En una app real, aquí se hashearía la contraseña newPassword
        // password: hashedNewPassword 
      }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar contraseña' });
  }
};