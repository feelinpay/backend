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
            return null;
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
     * Checks if a daily payment sheet exists in the specified folder.
     * If not, creates one with the correct headers.
     * @param folderId The Google Drive Folder ID
     * @returns The Spreadsheet ID of the daily sheet
     */
    async ensureDailyPaymentSheet(folderId: string): Promise<string> {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const sheetName = `Yapeos-${dateString}`;

        try {
            // 1. Search for existing file
            // query: name = 'Yapeos-2024-05-20' and 'folderId' in parents and trash = false
            const query = `name = '${sheetName}' and '${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`;

            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (res.data.files && res.data.files.length > 0) {
                // Found it
                const sheetId = res.data.files[0].id!;
                console.log(`Found existing daily sheet: ${sheetId}`);
                return sheetId;
            }

            // 2. Not found, create it
            console.log(`Creating new daily sheet: ${sheetName}`);

            // Create spreadsheet
            const spreadsheet = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: sheetName,
                    },
                },
                fields: 'spreadsheetId',
            });

            const spreadsheetId = spreadsheet.data.spreadsheetId!;

            // 3. Move/Add it to the correct folder
            // (The 'create' method for sheets creates it in root by default, we need to move it)
            // Retrieve the current parents to remove them
            const file = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'parents',
            });

            const previousParents = file.data.parents?.join(',') || '';

            await drive.files.update({
                fileId: spreadsheetId,
                addParents: folderId,
                removeParents: previousParents,
                fields: 'id, parents',
            });

            // 4. Initialize Headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'A1:D1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Nombre del yapeador', 'Monto', 'Fecha y hora exacta', 'Código de seguridad']],
                },
            });

            return spreadsheetId;

        } catch (error) {
            console.error('Error ensuring daily payment sheet:', error);
            throw error;
        }
    },
};
