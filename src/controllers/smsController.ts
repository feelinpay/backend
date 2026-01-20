import { Request, Response } from 'express';
import prisma from '../config/database';

// Estos son stubs básicos para que el frontend no falle con 404
// La lógica real de envío de SMS la maneja el dispositivo móvil (Modo Puente)

export const createSMS = async (req: Request, res: Response) => {
    try {
        // Como no hay modelo SMS aún, devolvemos éxito para que el frontend continúe
        res.status(201).json({
            success: true,
            data: { id: 'temp-sms-id-' + Date.now() }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const getPendingSMS = async (req: Request, res: Response) => {
    res.json({ success: true, data: [] });
};

export const markSMSAsSent = async (req: Request, res: Response) => {
    res.json({ success: true, message: 'SMS marcado como enviado' });
};

export const sendPendingSMS = async (req: Request, res: Response) => {
    // El frontend llama a esto, pero el envío real lo hace el propio Flutter
    res.json({ success: true, message: 'Procesando SMS pendientes' });
};

export const getSMSStatistics = async (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            smsHoy: 0,
            smsTotal: 0,
            smsPendientes: 0
        }
    });
};

export const getSMSStatus = async (req: Request, res: Response) => {
    res.json({
        success: true,
        data: { status: 'sent' }
    });
};
