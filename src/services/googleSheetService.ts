import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { googleDriveService } from './googleDriveService';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new GoogleAuth({
    keyFile: 'service-account.json', // Ensure this file exists
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

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
     * @param folderId The Google Drive Folder ID of the user.
     * @param data Payment data (Name, Amount, Date, Code, Payment Method).
     */
    async addPaymentRow(folderId: string, data: PaymentData): Promise<void> {
        try {
            // 1. Get current daily sheet ID (or create it if needed)
            const spreadsheetId = await googleDriveService.ensureDailyPaymentSheet(folderId);

            // 2. Prepare Row Data
            // Order: 'Nombre del yapeador', 'Monto', 'Fecha y hora exacta', 'Código de seguridad', 'Medio de Pago'
            const values = [
                [
                    data.nombrePagador,
                    data.monto,
                    data.fecha,
                    data.codigoSeguridad,
                    data.medioDePago || 'Yape' // Default a Yape si no se especifica
                ]
            ];

            // 3. Append to Sheet
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'A:E', // Append to columns A-E (agregamos columna E para Medio de Pago)
                valueInputOption: 'USER_ENTERED', // Allow formatting (e.g. number for amount)
                requestBody: {
                    values,
                },
            });

            // console.log(`Payment logged to sheet ${spreadsheetId}`);

        } catch (error) {
            console.error('Error adding payment row to Sheet:', error);
            throw error;
        }
    },
};
