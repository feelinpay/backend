# ⚙️ Feelin Pay - Backend (API)

Este es el núcleo de procesamiento de **Feelin Pay**, una API robusta y escalable diseñada para gestionar la lógica de negocio, seguridad y persistencia de datos del ecosistema.

## 🔑 Funcionalidades Principales

### 🛡️ Seguridad y Control de Acceso (RBAC)
- **Roles Dinámicos:** El sistema diferencia entre `super_admin` (gestión de plataforma), `propietario` (cliente B2B) y `empleado`.
- **Permisos Granulares:** Las capacidades del usuario en la app están determinadas por una matriz de permisos almacenada en la base de datos.
- **Autenticación:** Sistema basado en tokens para comunicaciones seguras con la app móvil.

### 💳 Gestión de Suscripciones (SaaS-Ready)
- Ciclo de vida completo de membresías: **Prueba -> Activa -> Vencida**.
- Monitor de salud de clientes: Identificación automática de usuarios con membresías por vencer para acciones preventivas.
- Planes configurables: Flexibilidad para definir precios y duraciones (Mensual, Semestral, Anual).

### 📊 Procesamiento de Datos
- **Recepción de Notificaciones:** Procesamiento de las transacciones enviadas por el servicio de escucha móvil.
- **Integración con Google APIs:** Lógica para la creación y gestión de carpetas y archivos en Google Drive para reportes de negocio.

## 🛠️ Stack Tecnológico
- **Runtime:** Node.js
- **Lenguaje:** TypeScript
- **Web Framework:** Express.js
- **Persistencia:** MySQL con **Prisma ORM** para una gestión de esquemas segura y eficiente.

## 🚀 Configuración del Entorno

### 1. Variables de Entorno
Crea un archivo `.env` siguiendo el ejemplo:
```env
DATABASE_URL="mysql://user:pass@localhost:3306/feelin_pay"
JWT_SECRET="tu_secreto_seguro"
PORT=3001
```

### 2. Inicialización
El sistema depende de una estructura de base de datos específica para los permisos y roles:
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed # CRÍTICO: Crea los roles y permisos necesarios para que el frontend funcione.
```

## 🔍 Herramientas Útiles
- **Prisma Studio:** Ejecuta `npx prisma studio` para explorar y editar los datos de forma visual.

---
*Parte del ecosistema Feelin Pay.*
