import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { googleDriveService } from './googleDriveService';
import { logger } from '../utils/logger';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];



export interface PaymentData {
    nombrePagador: string;
    monto: number;
    fecha: string; // ISO string or formatted date
    codigoSeguridad: string;
    medioDePago?: string; // 'Yape' o 'Plin'
}

export const googleSheetService = {
    /**
     * Appends a payment row to the daily sheet in the user's specific folder.
     */
    async addPaymentRow(folderId: string, data: PaymentData, accessToken?: string): Promise<void> {
        try {
            // 1. Get current daily sheet ID (or create it if needed)
            const spreadsheetId = await googleDriveService.ensureDailyPaymentSheet(folderId, accessToken);

            // 2. Prepare Row Data
            const values = [
                [
                    data.nombrePagador,
                    data.monto,
                    data.fecha,
                    data.codigoSeguridad,
                    data.medioDePago || 'Yape'
                ]
            ];

            // 3. Append to Sheet
            // Get correct client (User's or System's)
            const { sheets } = googleDriveService.getClients(accessToken);

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values,
                },
            });

        } catch (error) {
            logger.error('Error adding payment row to Sheet:', error);
            throw error;
        }
    },
};
