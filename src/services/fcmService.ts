import * as admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin
// We use the same service-account.json for convenience if it has permissions
// Otherwise, we might need a separate file.
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export const fcmService = {
    /**
     * Send a notification to a specific topic (e.g., 'business_123')
     */
    async sendToTopic(topic: string, title: string, body: string, data: any = {}) {
        try {
            const message = {
                topic: topic,
                notification: {
                    title: title,
                    body: body,
                },
                data: data, // Custom data payload
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    },

    /**
     * Send to specific device tokens
     */
    async sendToTokens(tokens: string[], title: string, body: string) {
        if (tokens.length === 0) return;

        try {
            const message = {
                notification: { title, body },
                tokens: tokens,
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(response.successCount + ' messages were sent successfully');
        } catch (error) {
            console.log('Error sending multicast message:', error);
        }
    }
};
