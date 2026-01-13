import { Request, Response } from 'express';

export const getPendingNotifications = async (req: Request, res: Response) => {
    res.json({ success: true, data: [] });
};

export const processYapeNotification = async (req: Request, res: Response) => {
    // El procesamiento de Yape real ya se hace en paymentController.procesarPagoYape
    // Este endpoint es usado por el servicio de escucha de notificaciones
    res.json({ success: true, message: 'Notificación procesada' });
};
