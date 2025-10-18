import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppConfig } from './config/appConfig';

// Importar rutas
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import profileRoutes from './routes/profileRoutes';
import systemRoutes from './routes/systemRoutes';
import userManagementRoutes from './routes/userManagementRoutes';
import userCleanupRoutes from './routes/userCleanupRoutes';
import membresiaRoutes from './routes/membresiaRoutes';
import otpStatusRoutes from './routes/otpStatusRoutes';
import employeeAccessRoutes from './routes/employeeAccessRoutes';

// Importar middleware de errores
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Importar scheduler para tareas programadas
import { Scheduler } from './jobs/scheduler';

dotenv.config();

const app = express();

// Configuración básica
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas básicas
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


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/user-cleanup', userCleanupRoutes);
app.use('/api/membresias', membresiaRoutes);
app.use('/api/otp-status', otpStatusRoutes);
app.use('/api/employee-access', employeeAccessRoutes);

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = AppConfig.server.port;
const HOST = AppConfig.server.host;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor backend corriendo en ${AppConfig.server.url}`);
  console.log(`🌍 Entorno: ${AppConfig.server.nodeEnv}`);
  
  // Inicializar tareas programadas
  Scheduler.init();
});