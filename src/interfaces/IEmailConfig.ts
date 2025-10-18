/**
 * Interfaz para configuración de email
 */
export interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string | undefined;
    pass: string | undefined;
  };
  tls: {
    rejectUnauthorized: boolean;
    ciphers?: string;
  };
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
}
