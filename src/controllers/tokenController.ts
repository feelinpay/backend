import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleTokenService } from '../services/googleTokenService';

const prisma = new PrismaClient();

/**
 * Verificar el estado del token de Google del usuario actual
 * Útil para debugging y monitoreo en producción
 */
export const checkTokenStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            select: {
                email: true,
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiresAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const now = new Date();
        const hasAccessToken = !!user.googleAccessToken;
        const hasRefreshToken = !!user.googleRefreshToken;
        const isValid = user.googleTokenExpiresAt && user.googleTokenExpiresAt > now;

        // Calcular minutos restantes
        let minutesRemaining = 0;
        if (user.googleTokenExpiresAt && isValid) {
            minutesRemaining = Math.floor(
                (user.googleTokenExpiresAt.getTime() - now.getTime()) / (1000 * 60)
            );
        }

        res.json({
            success: true,
            data: {
                email: user.email,
                hasAccessToken,
                hasRefreshToken,
                tokenValid: isValid,
                expiresAt: user.googleTokenExpiresAt,
                minutesRemaining,
                status: isValid ? 'VALID' : hasRefreshToken ? 'EXPIRED_CAN_REFRESH' : 'NEEDS_REAUTH'
            }
        });
    } catch (error: any) {
        console.error('Error checking token status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar estado del token'
        });
    }
};

/**
 * Forzar refresh del token de Google
 * Útil para testing y recuperación manual
 */
export const forceRefreshToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log(`🔄 Forzando refresh de token para: ${user.email}`);

        const newToken = await googleTokenService.refreshUserToken(userId);

        if (newToken) {
            return res.json({
                success: true,
                message: 'Token refrescado exitosamente',
                data: {
                    email: user.email,
                    tokenRefreshed: true
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No se pudo refrescar el token. Es posible que necesites volver a autenticarte.',
                code: 'REFRESH_FAILED'
            });
        }
    } catch (error: any) {
        console.error('Error forcing token refresh:', error);
        res.status(500).json({
            success: false,
            message: 'Error al refrescar token'
        });
    }
};
