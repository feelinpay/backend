import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MembresiaRenewalService {
    /**
     * Asigna o renueva una membresía de forma inteligente
     * - Si tiene membresía activa: extiende desde la fecha de expiración actual
     * - Si está en prueba: extiende desde la fecha fin de prueba
     * - Si no tiene nada activo: inicia desde hoy
     */
    async assignOrRenewMembership(
        usuarioId: string,
        membresiaId: string
    ) {
        // Obtener la membresía seleccionada
        const membresia = await prisma.membresia.findUnique({
            where: { id: membresiaId }
        });

        if (!membresia) {
            throw new Error('Membresía no encontrada');
        }

        if (!membresia.activa) {
            throw new Error('Esta membresía no está disponible');
        }

        // Obtener membresía activa actual del usuario
        const currentMembership = await prisma.membresiaUsuario.findFirst({
            where: {
                usuarioId,
                activa: true,
                fechaExpiracion: { gte: new Date() }
            },
            orderBy: { fechaExpiracion: 'desc' }
        });

        // Obtener fecha fin de prueba del usuario
        const user = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { fechaFinPrueba: true }
        });

        const today = new Date();
        const fechaInicio = today;
        let fechaExpiracion: Date;

        // LÓGICA INTELIGENTE DE EXTENSIÓN
        if (currentMembership) {
            // CASO 1: Tiene membresía activa → extiende desde fecha de expiración actual
            console.log(`Usuario tiene membresía activa. Extendiendo desde: ${currentMembership.fechaExpiracion}`);
            fechaExpiracion = this.addMonths(currentMembership.fechaExpiracion, membresia.meses);
        } else if (user?.fechaFinPrueba && user.fechaFinPrueba > today) {
            // CASO 2: Está en período de prueba → extiende desde fecha fin de prueba
            console.log(`Usuario en prueba. Extendiendo desde: ${user.fechaFinPrueba}`);
            fechaExpiracion = this.addMonths(user.fechaFinPrueba, membresia.meses);
        } else {
            // CASO 3: No tiene membresía activa ni prueba válida → inicia desde hoy
            console.log('Usuario sin membresía activa. Iniciando desde hoy');
            fechaExpiracion = this.addMonths(today, membresia.meses);
        }

        // Desactivar membresías anteriores
        await prisma.membresiaUsuario.updateMany({
            where: {
                usuarioId,
                activa: true
            },
            data: {
                activa: false,
                updatedAt: new Date()
            }
        });

        // Crear nueva membresía
        const newMembership = await prisma.membresiaUsuario.create({
            data: {
                usuarioId,
                membresiaId,
                fechaInicio,
                fechaExpiracion,
                activa: true
            },
            include: {
                membresia: true
            }
        });

        console.log(`Nueva membresía creada. Expira: ${fechaExpiracion}`);

        return newMembership;
    }

    /**
     * Agrega meses a una fecha
     */
    private addMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Obtiene el estado de membresía de un usuario
     */
    async getMembershipStatus(usuarioId: string) {
        const activeMembership = await prisma.membresiaUsuario.findFirst({
            where: {
                usuarioId,
                activa: true,
                fechaExpiracion: { gte: new Date() }
            },
            include: {
                membresia: true
            },
            orderBy: { fechaExpiracion: 'desc' }
        });

        const user = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { fechaFinPrueba: true }
        });

        const effectiveExpirationDate = activeMembership?.fechaExpiracion || user?.fechaFinPrueba;

        return {
            hasMembership: !!activeMembership,
            membership: activeMembership,
            trialEndDate: user?.fechaFinPrueba,
            effectiveExpirationDate,
            daysRemaining: effectiveExpirationDate
                ? Math.ceil((effectiveExpirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0
        };
    }
}
