import https from 'https';
import http from 'http';

export class ConnectivityService {
  /**
   * Verificar conectividad a internet
   */
  static async checkInternetConnection(): Promise<{
    isConnected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        const latency = Date.now() - startTime;
        resolve({
          isConnected: true,
          latency
        });
      });

      req.on('error', (error) => {
        resolve({
          isConnected: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          isConnected: false,
          error: 'Timeout de conexión'
        });
      });

      req.setTimeout(5000);
      req.end();
    });
  }

  /**
   * Verificar conectividad a servicios específicos
   */
  static async checkServiceConnectivity(serviceUrl: string): Promise<{
    isConnected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const url = new URL(serviceUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        timeout: 5000
      };

      const req = client.request(options, (res) => {
        const latency = Date.now() - startTime;
        resolve({
          isConnected: res.statusCode! < 400,
          latency
        });
      });

      req.on('error', (error) => {
        resolve({
          isConnected: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          isConnected: false,
          error: 'Timeout de conexión'
        });
      });

      req.setTimeout(5000);
      req.end();
    });
  }

  /**
   * Verificar múltiples servicios
   */
  static async checkMultipleServices(services: string[]): Promise<{
    results: Array<{ service: string; isConnected: boolean; latency?: number; error?: string }>;
    allConnected: boolean;
  }> {
    const promises = services.map(async (service) => {
      const result = await this.checkServiceConnectivity(service);
      return {
        service,
        ...result
      };
    });

    const results = await Promise.all(promises);
    const allConnected = results.every(result => result.isConnected);

    return {
      results,
      allConnected
    };
  }

  /**
   * Verificar conectividad completa del sistema
   */
  static async checkSystemConnectivity(): Promise<{
    internet: boolean;
    database: boolean;
    email: boolean;
    sms: boolean;
    overall: boolean;
    details: {
      internet?: { latency?: number; error?: string };
      database?: { error?: string };
      email?: { error?: string };
      sms?: { error?: string };
    };
  }> {
    const results = {
      internet: false,
      database: false,
      email: false,
      sms: false,
      overall: false,
      details: {} as any
    };

    try {
      // Verificar internet
      const internetCheck = await this.checkInternetConnection();
      results.internet = internetCheck.isConnected;
      results.details.internet = {
        latency: internetCheck.latency,
        error: internetCheck.error
      };

      // Verificar base de datos (simulado)
      try {
        // En un sistema real, aquí harías una consulta simple a la BD
        results.database = true;
      } catch (error) {
        results.database = false;
        results.details.database = { error: 'Error de conexión a BD' };
      }

      // Verificar servicio de email (simulado)
      try {
        // En un sistema real, aquí verificarías la configuración SMTP
        results.email = true;
      } catch (error) {
        results.email = false;
        results.details.email = { error: 'Error de configuración SMTP' };
      }

      // Verificar servicio de SMS (simulado)
      try {
        // En un sistema real, aquí verificarías la configuración SMS
        results.sms = true;
      } catch (error) {
        results.sms = false;
        results.details.sms = { error: 'Error de configuración SMS' };
      }

      results.overall = results.internet && results.database && results.email && results.sms;

    } catch (error) {
      console.error('Error verificando conectividad:', error);
    }

    return results;
  }
}
