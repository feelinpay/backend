import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppConfig } from './config/appConfig';

// Importar rutas organizadas por roles
import publicRoutes from './routes/publicRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Importar middleware de errores
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Global Error Handler for Vercel debugging
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

try {
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
} catch (error) {
  console.error('❌ Error configuring middleware:', error);
}

// Debug Middleware: Log all requests
app.use((req, res, next) => {
  // console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  // console.log('Headers:', req.headers); // Descomentar si es necesario
  next();
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Backend de Feelin Pay funcionando correctamente 🚀',
    version: '1.0.0',
    endpoints: {
      public: '/api/public/*',
      auth: '/api/auth/*',
      payments: '/api/payments/*'
    }
  });
});

// Rutas de gestión administrativa (Super Admin)
import adminUserRoutes from './routes/adminUserRoutes';
import adminRolRoutes from './routes/adminRolRoutes';
import adminPermisoRoutes from './routes/adminPermisoRoutes';
import adminMembresiaRoutes from './routes/adminMembresiaRoutes';
import adminMembresiaUsuarioRoutes from './routes/adminMembresiaUsuarioRoutes';
import adminEmployeeRoutes from './routes/adminEmployeeRoutes';
import membershipReportsRoutes from './routes/membershipReportsRoutes';

app.use('/api/user-management', adminUserRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/super-admin', adminUserRoutes);
app.use('/api/super-admin/roles', adminRolRoutes);
app.use('/api/super-admin/permisos', adminPermisoRoutes);
app.use('/api/super-admin/membresias', adminMembresiaRoutes);
app.use('/api/super-admin/membresias-usuarios', adminMembresiaUsuarioRoutes);
app.use('/api/super-admin/membership-reports', membershipReportsRoutes);
app.use('/api/super-admin', adminEmployeeRoutes);

// ========================================
// RUTAS PARA CONFIGURACIÓN DE NOTIFICACIONES
// ========================================

// ========================================
// RUTAS ORGANIZADAS POR ROLES
// ========================================

// Rutas públicas (sin autenticación)
app.use('/api/public', publicRoutes);
app.use('/api', publicRoutes); // Alias for backward compatibility

// Rutas de pagos (usuarios autenticados)
// Rutas de pagos (usuarios autenticados)
app.use('/api/payments', paymentRoutes);

// Rutas de dashboard/owner (usuarios autenticados)
import dashboardEmployeeRoutes from './routes/dashboardEmployeeRoutes';
import smsRoutes from './routes/smsRoutes';
import notificationRoutes from './routes/notificationRoutes';

app.use('/api/owner', dashboardEmployeeRoutes);
app.use('/api/dashboard', dashboardEmployeeRoutes); // Alias
app.use('/api/sms', smsRoutes);
app.use('/api/notifications', notificationRoutes);

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = AppConfig.server.port;
const HOST = AppConfig.server.host;

app.listen(PORT, HOST, () => {
  console.log(`Servidor backend corriendo en ${AppConfig.server.url}`);
  console.log(`Entorno: ${AppConfig.server.nodeEnv}`);
});