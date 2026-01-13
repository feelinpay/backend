import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMembershipReports = async (req: Request, res: Response) => {
    try {
        const { filter = 'all', search } = req.query;

        // Get all propietarios with their membership status
        const propietarios = await prisma.usuario.findMany({
            where: {
                rol: {
                    nombre: 'propietario'
                },
                ...(search && {
                    OR: [
                        { nombre: { contains: search as string } },
                        { email: { contains: search as string } }
                    ]
                })
            },
            include: {
                membresias: {
                    where: { activa: true },
                    include: { membresia: true },
                    orderBy: { fechaExpiracion: 'desc' }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        // Calculate status for each propietario
        const now = new Date();
        const reports = propietarios.map(user => {
            const activeMembership = user.membresias[0];

            let status: 'expired' | 'urgent' | 'soon' | 'active' | 'trial';
            let daysRemaining = 0;
            let expirationDate: Date | null = null;
            let membershipName = 'Sin Membresía';

            if (activeMembership) {
                expirationDate = activeMembership.fechaExpiracion;
                membershipName = activeMembership.membresia.nombre;
                daysRemaining = Math.ceil(
                    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysRemaining < 0) {
                    status = 'expired';
                } else if (daysRemaining < 7) {
                    status = 'urgent';
                } else if (daysRemaining < 30) {
                    status = 'soon';
                } else {
                    status = 'active';
                }
            } else if (user.fechaFinPrueba) {
                expirationDate = user.fechaFinPrueba;
                membershipName = 'Período de Prueba';
                daysRemaining = Math.ceil(
                    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                status = daysRemaining < 0 ? 'expired' : 'trial';
            } else {
                status = 'expired';
                daysRemaining = 0;
            }

            return {
                userId: user.id,
                nombre: user.nombre,
                email: user.email,
                membershipName,
                status,
                daysRemaining,
                expirationDate,
                activo: user.activo
            };
        });

        // Apply filter
        const filtered = filter === 'all' ? reports : reports.filter(r => {
            switch (filter) {
                case 'expired':
                    return r.status === 'expired';
                case 'urgent':
                    return r.status === 'urgent';
                case 'soon':
                    return r.status === 'soon';
                case 'active':
                    return r.status === 'active';
                case 'trial':
                    return r.status === 'trial';
                default:
                    return true;
            }
        });

        // Calculate statistics
        const stats = {
            total: reports.length,
            expired: reports.filter(r => r.status === 'expired').length,
            urgent: reports.filter(r => r.status === 'urgent').length,
            soon: reports.filter(r => r.status === 'soon').length,
            active: reports.filter(r => r.status === 'active').length,
            trial: reports.filter(r => r.status === 'trial').length
        };

        res.json({
            success: true,
            data: {
                reports: filtered,
                statistics: stats
            }
        });
    } catch (error: any) {
        console.error('Error getting membership reports:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
