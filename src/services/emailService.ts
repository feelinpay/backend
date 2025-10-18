import nodemailer from 'nodemailer';
import { getEmailConfig } from '../config/email';

/**
 * Email Service - Manejo de emails con diseño atractivo
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(getEmailConfig());
  }

  /**
   * Enviar OTP con diseño atractivo
   */
  async sendOTPEmail(email: string, otp: string, tipo: string, nombreUsuario?: string): Promise<boolean> {
    try {
      console.log('🔍 DEBUG: Iniciando envío de email...');
      console.log('📧 Email destino:', email);
      console.log('🔑 OTP:', otp);
      console.log('📝 Tipo:', tipo);
      
      const emailConfig = getEmailConfig();
      console.log('⚙️ Config email:', {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass ? '***CONFIGURADO***' : '❌ NO CONFIGURADO'
      });

      // Verificar conexión SMTP
      console.log('🔌 Verificando conexión SMTP...');
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada');

      const subject = this.getOTPSubject(tipo);
      const html = this.generateOTPEmailHTML(otp, tipo, nombreUsuario);

      console.log('📤 Enviando email...');
      const info = await this.transporter.sendMail({
        from: `"Feelin Pay" <${emailConfig.auth.user}>`,
        to: email,
        subject,
        html
      });

      console.log(`✅ Email OTP enviado a ${email}:`, info.messageId);
      console.log('📊 Respuesta completa:', info);
      return true;
    } catch (error) {
      console.error('❌ Error enviando OTP por email:', error);
      console.error('🔍 Detalles del error:', error.message);
      console.error('📋 Stack trace:', error.stack);
      return false;
    }
  }

  /**
   * Obtener asunto del email según el tipo
   */
  private getOTPSubject(tipo: string): string {
    const subjects = {
      'EMAIL_VERIFICATION': '✅ Verifica tu Email - Feelin Pay',
      'PASSWORD_RESET': '🔐 Recupera tu Contraseña - Feelin Pay',
      'EMAIL_CHANGE': '📧 Confirma Cambio de Email - Feelin Pay'
    };
    return subjects[tipo] || '🔐 Código de Verificación - Feelin Pay';
  }

  /**
   * Generar HTML moderno y atractivo para OTP
   */
  private generateOTPEmailHTML(otp: string, tipo: string, nombreUsuario?: string): string {
    const nombre = nombreUsuario || 'Usuario';
    const tipoInfo = this.getTipoInfo(tipo);
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${tipoInfo.titulo} - Feelin Pay</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          min-height: 100vh;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        
        .header-title {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .header-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 30px;
          font-weight: 500;
        }
        
        .otp-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
          border: 2px solid #e5e7eb;
          position: relative;
          overflow: hidden;
        }
        
        .otp-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
        }
        
        .otp-label {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          letter-spacing: 8px;
          background: #ffffff;
          padding: 20px 30px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          display: inline-block;
          margin: 10px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          animation: pulse 2s ease-in-out infinite;
          font-family: 'Courier New', monospace;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .otp-info {
          font-size: 14px;
          color: #6b7280;
          margin-top: 15px;
        }
        
        .security-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
        }
        
        .security-notice-icon {
          font-size: 20px;
          margin-right: 10px;
        }
        
        .security-notice-text {
          font-size: 14px;
          color: #92400e;
          font-weight: 500;
        }
        
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 15px;
        }
        
        .footer-brand {
          font-size: 16px;
          font-weight: 600;
          color: #4f46e5;
        }
        
        .social-links {
          margin-top: 20px;
        }
        
        .social-link {
          display: inline-block;
          margin: 0 10px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
        }
        
        .social-link:hover {
          color: #4f46e5;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .email-container {
            border-radius: 16px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .otp-code {
            font-size: 28px;
            letter-spacing: 6px;
            padding: 15px 20px;
          }
          
          .footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">💳 Feelin Pay</div>
          <div class="header-title">${tipoInfo.titulo}</div>
          <div class="header-subtitle">${tipoInfo.subtitulo}</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            ¡Hola <strong>${nombre}</strong>! 👋
          </div>
          
          <div class="otp-section">
            <div class="otp-label">Tu código de verificación es:</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-info">
              ⏰ Este código expira en <strong>10 minutos</strong><br>
              🔒 Úsalo solo en la aplicación oficial
            </div>
          </div>
          
          <div class="security-notice">
            <span class="security-notice-icon">🛡️</span>
            <span class="security-notice-text">
              Por tu seguridad, nunca compartas este código con nadie. 
              Si no solicitaste este código, ignora este email.
            </span>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Este email fue enviado automáticamente por Feelin Pay
          </div>
          <div class="footer-brand">💳 Feelin Pay</div>
          <div class="social-links">
            <a href="#" class="social-link">Soporte</a>
            <a href="#" class="social-link">Privacidad</a>
            <a href="#" class="social-link">Términos</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Obtener información del tipo de OTP
   */
  private getTipoInfo(tipo: string): { titulo: string; subtitulo: string } {
    const tipos = {
      'EMAIL_VERIFICATION': {
        titulo: 'Verifica tu Email',
        subtitulo: 'Confirma tu dirección de correo electrónico'
      },
      'PASSWORD_RESET': {
        titulo: 'Recupera tu Contraseña',
        subtitulo: 'Restablece el acceso a tu cuenta'
      },
      'EMAIL_CHANGE': {
        titulo: 'Confirma Cambio de Email',
        subtitulo: 'Verifica tu nueva dirección de correo'
      }
    };
    
    return tipos[tipo] || {
      titulo: 'Código de Verificación',
      subtitulo: 'Confirma tu identidad'
    };
  }
}