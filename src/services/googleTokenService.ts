import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const googleTokenService = {
    /**
     * Refrescar el access token de un usuario usando su refresh token
     */
    async refreshUserToken(userId: string): Promise<string | null> {
        try {
            const user = await prisma.usuario.findUnique({
                where: { id: userId },
                select: { googleRefreshToken: true, email: true }
            });

            if (!user?.googleRefreshToken) {
                logger.warn(`Usuario ${userId} sin refresh token guardado`);
                return null;
            }

            logger.debug(`Refrescando token para usuario: ${user.email}`);

            // Configurar refresh token
            oauth2Client.setCredentials({
                refresh_token: user.googleRefreshToken
            });

            // Obtener nuevo access token
            const { credentials } = await oauth2Client.refreshAccessToken();
            const newAccessToken = credentials.access_token;

            if (newAccessToken) {
                // Calcular fecha de expiración (típicamente 1 hora)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);

                // Guardar nuevo token en BD
                await prisma.usuario.update({
                    where: { id: userId },
                    data: {
                        googleAccessToken: newAccessToken,
                        googleTokenExpiresAt: expiresAt
                    }
                });

                logger.success(`Token refrescado exitosamente para ${user.email}`);
                return newAccessToken;
            }

            return null;
        } catch (error: any) {
            logger.error('Error refrescando token de Google:', error.message);
            return null;
        }
    },

    /**
     * Obtener token válido (refrescar automáticamente si es necesario)
     */
    async getValidToken(userId: string): Promise<string | null> {
        try {
            const user = await prisma.usuario.findUnique({
                where: { id: userId },
                select: {
                    googleAccessToken: true,
                    googleTokenExpiresAt: true,
                    email: true
                }
            });

            if (!user) {
                logger.warn(`Usuario ${userId} no encontrado`);
                return null;
            }

            const now = new Date();

            // Si el token está vigente (con margen de 5 minutos), retornarlo
            if (user.googleAccessToken && user.googleTokenExpiresAt) {
                const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

                if (user.googleTokenExpiresAt > fiveMinutesFromNow) {
                    logger.debug(`Token vigente para ${user.email}`);
                    return user.googleAccessToken;
                }
            }

            // Si expiró o está por expirar, intentar refrescar
            logger.info(`Token expirado/próximo a expirar para ${user.email}. Refrescando...`);
            return await this.refreshUserToken(userId);
        } catch (error: any) {
            logger.error('Error obteniendo token válido:', error.message);
            return null;
        }
    },

    /**
     * Guardar tokens de Google en la base de datos
     */
    async saveTokens(
        userId: string,
        accessToken: string,
        refreshToken?: string
    ): Promise<void> {
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            const updateData: any = {
                googleAccessToken: accessToken,
                googleTokenExpiresAt: expiresAt
            };

            // Solo actualizar refresh token si se proporciona uno nuevo
            if (refreshToken) {
                updateData.googleRefreshToken = refreshToken;
            }

            await prisma.usuario.update({
                where: { id: userId },
                data: updateData
            });

            logger.debug(`Tokens guardados para usuario ${userId}`);
        } catch (error: any) {
            logger.error('Error guardando tokens:', error.message);
            throw error;
        }
    }
};
