import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppConfig } from './config/appConfig';

// Importar rutas organizadas por roles
import publicRoutes from './routes/publicRoutes';
import ownerRoutes from './routes/ownerRoutes';
import superAdminRoutes from './routes/superAdminRoutes';

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

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend de Feelin Pay funcionando correctamente 🚀',
    version: '1.0.0',
    endpoints: {
      public: '/api/public/*',
      owner: '/api/owner/*',
      superAdmin: '/api/super-admin/*'
    }
  });
});

// ========================================
// RUTAS ORGANIZADAS POR ROLES
// ========================================

// Rutas públicas (sin autenticación)
app.use('/api/public', publicRoutes);

// Rutas de propietario (usuarios autenticados)
app.use('/api/owner', ownerRoutes);

// Rutas de super admin (solo super_admin)
app.use('/api/super-admin', superAdminRoutes);

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