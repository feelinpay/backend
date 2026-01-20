import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

// Load credentials from environment
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
];

// Lazy Initialization or Optional Service Account
let driveServiceAccount: any;
let sheetsServiceAccount: any;

try {
    const auth = new GoogleAuth({
        keyFile: 'service-account.json',
        scopes: SCOPES,
    });
    // We don't initialize clients here immediately to avoid file read if not needed, 
    // OR we can leave it if GoogleAuth is lazy. 
    // But the error 'ENOENT' suggests it reads immediately.
    // So we should check if we really need it.
    // However, simplest fix for now regarding the USER's specific error:

    // Changing to:
    driveServiceAccount = google.drive({ version: 'v3', auth });
    sheetsServiceAccount = google.sheets({ version: 'v4', auth });
} catch (e) {
    // logger.warn('Service Account file missing or invalid. Service Account features will be disabled.');
}


export const googleDriveService = {
    /**
     * Helper to get authenticated clients (User or Service Account)
     */
    getClients(accessToken?: string) {
        if (accessToken) {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            return {
                drive: google.drive({ version: 'v3', auth: oauth2Client }),
                sheets: google.sheets({ version: 'v4', auth: oauth2Client }),
                isUserAuth: true
            };
        }
        if (!driveServiceAccount || !sheetsServiceAccount) {
            throw new Error("Google Service Account not initialized (missing service-account.json) and no User AccessToken provided.");
        }
        return {
            drive: driveServiceAccount,
            sheets: sheetsServiceAccount,
            isUserAuth: false
        };
    },

    /**
     * Creates a new folder in Google Drive.
     */
    async createFolder(folderName: string, accessToken?: string): Promise<string> {
        const { drive } = this.getClients(accessToken);
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            logger.debug(`Folder created: ${file.data.id} (UserAuth: ${!!accessToken})`);
            return file.data.id!;
        } catch (error) {
            logger.error('Error creating Drive folder:', error);
            throw error;
        }
    },

    /**
     * Finds a folder by name.
     */
    async findFolderByName(folderName: string, accessToken?: string): Promise<string | null> {
        const { drive } = this.getClients(accessToken);
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
            logger.error('Error searching for folder:', error);
            throw error;
        }
    },

    /**
     * Shares a file or folder with a specific user email.
     * (Only relevant for Service Account flow)
     */
    async shareFolder(fileId: string, email: string): Promise<void> {
        try {
            await driveServiceAccount.permissions.create({
                fileId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: email,
                },
                fields: 'id',
            });
            logger.debug(`Folder ${fileId} shared with ${email}`);
        } catch (error) {
            logger.error(`Error sharing folder with ${email}:`, error);
        }
    },

    /**
     * Checks if a folder exists and is not in trash.
     */
    async checkFolderExists(folderId: string, accessToken?: string): Promise<boolean> {
        const { drive } = this.getClients(accessToken);
        try {
            const file = await drive.files.get({
                fileId: folderId,
                fields: 'trashed',
            });
            return !file.data.trashed;
        } catch (error) {
            return false;
        }
    },

    /**
     * Ensures a "Reporte de Pagos - Feelin Pay" folder exists.
     * If accessToken is provided, it looks in the USER'S Drive directly.
     */
    async ensureDailyPaymentSheet(userFolderId: string, accessToken?: string): Promise<string> {
        const { drive, sheets, isUserAuth } = this.getClients(accessToken);

        // FIX: Force Peru Timezone (UTC-5) regardless of server location
        const formatter = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        // Format returns "DD/MM/YYYY" (e.g., "19/01/2026")
        const parts = formatter.formatToParts(new Date());
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const year = parts.find(p => p.type === 'year')?.value;

        const sheetName = `${day}-${month}-${year}`;

        try {
            let targetFolderId = userFolderId;

            // IS USER AUTH (PRIVACY MODE)
            // If we are acting as the user, we ignore the 'userFolderId' passed from DB (which might be the old shared one)
            // and instead search/create the folder in THEIR Drive to ensure ownership.
            if (isUserAuth) {
                const folderName = 'Reporte de Pagos - Feelin Pay';
                const foundId = await this.findFolderByName(folderName, accessToken);

                if (foundId) {
                    targetFolderId = foundId;
                    logger.debug(`[UserAuth] Found existing folder: ${targetFolderId}`);
                } else {
                    logger.debug(`[UserAuth] Creating new private folder...`);
                    targetFolderId = await this.createFolder(folderName, accessToken);
                }
            } else {
                // FALLBACK: Service Account Logic (Legacy)
                const exists = await this.checkFolderExists(targetFolderId);
                if (!exists) throw new Error("Report folder not accessible (Service Account)");
            }

            // 2. Search for Daily Sheet
            const sheetQuery = `name = '${sheetName}' and '${targetFolderId}' in parents and trashed = false`;

            logger.debug(`[Drive Service] Searching for file with query: [${sheetQuery}]`);

            const res = await drive.files.list({
                q: sheetQuery,
                fields: 'files(id, name, mimeType)',
                spaces: 'drive',
            });

            logger.debug(`[Drive Service] Found ${res.data.files?.length || 0} files.`);

            if (res.data.files && res.data.files.length > 0) {
                const existingFile = res.data.files[0];
                const sheetId = existingFile.id!;
                logger.debug(`[Drive Service] Found existing daily sheet: ${sheetId} (${existingFile.name})`);
                return sheetId;
            }

            // 3. Create Sheet
            logger.debug(`[Drive Service] Creating NEW daily sheet: ${sheetName}`);

            const fileMetadata = {
                name: sheetName,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [targetFolderId]
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            const spreadsheetId = file.data.id!;
            logger.debug(`Sheet created: ${spreadsheetId}`);

            // 4. Initialize Headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'A1:E1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Nombre del yapeador', 'Monto', 'Fecha y hora exacta', 'Código de seguridad', 'Medio de Pago']],
                },
            });

            return spreadsheetId;

        } catch (error) {
            logger.error('Error ensuring daily payment sheet:', error);
            throw error;
        }
    },
};
