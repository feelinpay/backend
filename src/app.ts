import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar middleware de seguridad
import { generalLimiter, authLimiter, registerLimiter, otpLimiter } from './middleware/rateLimiter';
import { checkSecurityHeaders, checkBlockedIPs } from './middleware/security';

// Importar rutas
import authRoutes from './routes/authRoutes';
import userManagementRoutes from './routes/userManagementRoutes';
import systemRoutes from './routes/systemRoutes';
import employeeAccessRoutes from './routes/employeeAccessRoutes';
import adminRoutes from './routes/adminRoutes';
import otpStatusRoutes from './routes/otpStatusRoutes';
import profileRoutes from './routes/profileRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userCleanupRoutes from './routes/userCleanupRoutes';
import membresiaRoutes from './routes/membresiaRoutes';

// Importar servicios
import { Scheduler } from './jobs/scheduler';

// Importar middleware de errores
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Configuración de CORS más segura
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicar middleware de seguridad
app.use(checkSecurityHeaders);
app.use(checkBlockedIPs);
// Importar middlewares de seguridad
import { sqlInjectionProtection, sanitizeInputs } from './middleware/sqlInjectionProtection';

// Aplicar middlewares de seguridad
app.use(sqlInjectionProtection);
app.use(sanitizeInputs);
app.use(generalLimiter);

// Middleware para obtener IP real (opcional)
app.use((req, res, next) => {
  // Obtener IP real si está disponible
  const realIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (realIp) {
    (req as any).realIp = realIp;
  }
  next();
});

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'Backend de Feelin Pay funcionando correctamente 🚀' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes con rate limiting específico
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/empleado-access', employeeAccessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp-status', otpStatusRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user-cleanup', userCleanupRoutes);
app.use('/api/membresias', membresiaRoutes);

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configurado' : '⚠️  No configurado'}`);
  console.log(`📧 Email: ${process.env.EMAIL_HOST ? '✅ Configurado' : '⚠️  No configurado'}`);
  
  // Iniciar tareas programadas
  Scheduler.init();
});