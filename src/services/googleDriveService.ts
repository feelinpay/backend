import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Load credentials from environment
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
];

const auth = new GoogleAuth({
    keyFile: 'service-account.json', // Ensure this file exists in root
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

export const googleDriveService = {
    /**
     * Creates a new folder in Google Drive.
     * @param folderName Name of the folder to create
     * @returns The ID of the created folder
     */
    async createFolder(folderName: string): Promise<string> {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            console.log(`Folder created: ${file.data.id}`);
            return file.data.id!;
        } catch (error) {
            console.error('Error creating Drive folder:', error);
            throw error;
        }
    },

    /**
     * Finds a folder by name.
     * @param folderName Name of the folder to search
     * @returns The ID of the folder if found, null otherwise
     */
    async findFolderByName(folderName: string): Promise<string | null> {
        try {
            const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (res.data.files && res.data.files.length > 0) {
                return res.data.files[0].id!;
            }
            return null;
        } catch (error) {
            console.error('Error searching for folder:', error);
            throw error; // Re-throw to prevent false negatives in controller logic
        }
    },

    /**
     * Shares a file or folder with a specific user email.
     * @param fileId ID of the file or folder
     * @param email User's email address
     */
    async shareFolder(fileId: string, email: string): Promise<void> {
        try {
            await drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: email,
                },
                fields: 'id',
            });
            console.log(`Folder ${fileId} shared with ${email}`);
        } catch (error) {
            console.error(`Error sharing folder with ${email}:`, error);
            // Don't throw, just log. We don't want to break registration if sharing fails.
        }
    },

    /**
     * Checks if a folder exists and is not in trash.
     * @param folderId The ID of the folder to check
     */
    async checkFolderExists(folderId: string): Promise<boolean> {
        try {
            const file = await drive.files.get({
                fileId: folderId,
                fields: 'trashed',
            });
            return !file.data.trashed;
        } catch (error) {
            // 404 means it doesn't exist or we lost access
            return false;
        }
    },

    /**
     * Ensures a "Reporte de Pagos - Feelin Pay" folder exists in the user's folder.
     * Creates daily payment sheets inside this folder only when payments are received.
     * @param userFolderId The Google Drive Folder ID of the user
     * @returns The Spreadsheet ID of the daily sheet
     */
    async ensureDailyPaymentSheet(userFolderId: string): Promise<string> {
        const today = new Date();
        // Formato DD-MM-YYYY para el nombre del archivo
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        const dateString = `${day}-${month}-${year}`; // 13-01-2026
        const sheetName = dateString; // Solo la fecha como nombre

        try {
            // 1. Asumimos que userFolderId YA ES la carpeta de reportes (guardada en BD desde authController)
            const reportFolderId = userFolderId;
            // console.log(`Using Report Folder ID: ${reportFolderId}`);

            // Verificar si tenemos acceso básico (opcional, pero útil para depurar)
            // const exists = await this.checkFolderExists(reportFolderId);
            // if (!exists) throw new Error("Report folder not accessible");

            // 2. Buscar sheet del día dentro de la carpeta de reportes
            const sheetQuery = `name = '${sheetName}' and '${reportFolderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`;

            const res = await drive.files.list({
                q: sheetQuery,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (res.data.files && res.data.files.length > 0) {
                // Found it
                const sheetId = res.data.files[0].id!;
                console.log(`Found existing daily sheet: ${sheetId}`);
                return sheetId;
            }

            // 3. No existe, crear sheet del día
            console.log(`Creating new daily sheet: ${sheetName}`);

            // 3. No existe, crear sheet del día
            console.log(`Creating new daily sheet (via Drive API): ${sheetName}`);

            // Usamos Drive API para crear el archivo directamente en la carpeta
            // Esto evita errores de permisos de Sheets API en la creación y el movimiento
            const fileMetadata = {
                name: sheetName,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [reportFolderId]
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            const spreadsheetId = file.data.id!;
            console.log(`Sheet created via Drive API: ${spreadsheetId}`);

            // Omitimos el paso de mover porque ya lo creamos en parents: [reportFolderId]

            // 5. Inicializar Headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'A1:E1', // Agregamos columna E para Medio de Pago
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Nombre del yapeador', 'Monto', 'Fecha y hora exacta', 'Código de seguridad', 'Medio de Pago']],
                },
            });

            console.log(`Daily sheet created: ${spreadsheetId} in folder ${reportFolderId}`);
            return spreadsheetId;

        } catch (error) {
            console.error('Error ensuring daily payment sheet:', error);
            throw error;
        }
    },
};
