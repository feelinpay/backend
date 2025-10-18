import nodemailer from 'nodemailer';
import { IEmailConfig } from '../interfaces/IEmailConfig';

/**
 * Configuración de email
 */
export function getEmailConfig(): IEmailConfig {
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  };
}
