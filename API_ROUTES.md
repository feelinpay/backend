# 🚀 Feelin Pay Backend - API Routes Documentation

## 📋 **Información General**

- **Base URL:** `http://localhost:3000`
- **Versión:** 1.0.0
- **Autenticación:** JWT Token (Bearer Token)

---

## 🌐 **Rutas Públicas** (`/api/public/*`)

### **Autenticación**
```http
POST   /api/public/auth/register          # Registro de usuario
POST   /api/public/auth/login             # Inicio de sesión
POST   /api/public/auth/forgot-password   # Solicitar recuperación de contraseña
POST   /api/public/auth/reset-password    # Restablecer contraseña
POST   /api/public/auth/verify-email      # Verificar email con OTP
POST   /api/public/auth/resend-otp        # Reenviar código OTP
```

---

## 👤 **Rutas de Usuario Autenticado** (`/api/owner/*`)

> **Requerido:** JWT Token válido

### **Dashboard**
```http
GET    /api/owner/dashboard               # Información completa del dashboard
```

### **Gestión de Perfil**
```http
GET    /api/owner/profile                 # Obtener perfil del usuario
PUT    /api/owner/profile                 # Actualizar perfil completo
PATCH  /api/owner/profile/password        # Cambiar contraseña
POST   /api/owner/profile/verify-email    # Verificar cambio de email
GET    /api/owner/profile/license         # Información de licencia

# Rutas específicas del frontend
PUT    /api/owner/profile/profile/name    # Actualizar nombre
PUT    /api/owner/profile/profile/phone   # Actualizar teléfono
PUT    /api/owner/profile/profile/password # Actualizar contraseña
POST   /api/owner/profile/profile/email/request  # Solicitar cambio email
POST   /api/owner/profile/profile/email/confirm  # Confirmar cambio email
GET    /api/owner/profile/profile/history # Historial de cambios
```

### **Gestión de Empleados Propios**
```http
GET    /api/owner/employees               # Listar mis empleados
GET    /api/owner/employees/stats         # Estadísticas de mis empleados
GET    /api/owner/employees/search        # Buscar mis empleados
GET    /api/owner/employees/filter        # Filtrar mis empleados
GET    /api/owner/employees/:employeeId   # Obtener mi empleado específico
POST   /api/owner/employees               # Crear mi empleado
PUT    /api/owner/employees/:employeeId   # Actualizar mi empleado
PATCH  /api/owner/employees/:employeeId/status # Cambiar estado de mi empleado
DELETE /api/owner/employees/:employeeId   # Eliminar mi empleado
```

---

## 🔧 **Rutas de Super Admin** (`/api/super-admin/*`)

> **Requerido:** JWT Token válido + Rol de Super Admin

### **Gestión de Usuarios**
```http
POST   /api/super-admin/users                    # Crear usuario
GET    /api/super-admin/users                    # Listar todos los usuarios
GET    /api/super-admin/users/:id                # Obtener usuario específico
PUT    /api/super-admin/users/:id                # Actualizar usuario
DELETE /api/super-admin/users/:id                # Desactivar usuario
PATCH  /api/super-admin/users/:id/reactivate     # Reactivar usuario
PATCH  /api/super-admin/users/:id/password       # Cambiar contraseña de usuario
PATCH  /api/super-admin/users/:id/toggle-status  # Activar/Desactivar usuario
PATCH  /api/super-admin/users/:id/extender-prueba # Extender período de prueba
```

### **Estadísticas y Roles**
```http
GET    /api/super-admin/stats                    # Estadísticas generales
GET    /api/super-admin/roles                    # Listar roles disponibles
```

### **Funcionalidades Avanzadas de Admin**
```http
GET    /api/super-admin/estadisticas-generales   # Estadísticas generales
GET    /api/super-admin/verificar-acceso         # Verificar acceso
PUT    /api/super-admin/users/:id/extender-prueba # Extender prueba
PUT    /api/super-admin/users/:id/verificar-email # Verificar email de usuario
```

### **Gestión de Empleados de Usuarios**
```http
GET    /api/super-admin/users/:userId/employees           # Listar empleados del usuario
GET    /api/super-admin/users/:userId/employees/stats     # Estadísticas del usuario
GET    /api/super-admin/users/:userId/employees/search    # Buscar empleados del usuario
GET    /api/super-admin/users/:userId/employees/:employeeId # Obtener empleado específico
POST   /api/super-admin/users/:userId/employees           # Crear empleado para el usuario
PUT    /api/super-admin/users/:userId/employees/:employeeId # Actualizar empleado del usuario
PATCH  /api/super-admin/users/:userId/employees/:employeeId/status # Cambiar estado
DELETE /api/super-admin/users/:userId/employees/:employeeId # Eliminar empleado del usuario
```

---

## 📊 **Estructura de Respuestas**

### **Respuesta Exitosa**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### **Respuesta de Error**
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo",
      "message": "Mensaje de error específico"
    }
  ]
}
```

---

## 🔐 **Sistema de Autenticación**

### **Headers Requeridos**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Roles Disponibles**
- `super_admin`: Acceso completo a todas las rutas
- `propietario`: Acceso solo a rutas de `/api/owner/*`
- `empleado`: Acceso limitado (futuro)

---

## 📝 **Modelos de Datos Principales**

### **Usuario**
```json
{
  "id": "uuid",
  "nombre": "string",
  "telefono": "string",
  "email": "string",
  "rolId": "uuid",
  "activo": "boolean",
  "emailVerificado": "boolean",
  "enPeriodoPrueba": "boolean",
  "diasPruebaRestantes": "number"
}
```

### **Empleado**
```json
{
  "id": "uuid",
  "usuarioId": "uuid",
  "nombre": "string",
  "telefono": "string",
  "activo": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### **Pago**
```json
{
  "id": "uuid",
  "usuarioId": "uuid",
  "nombrePagador": "string",
  "monto": "number",
  "fecha": "datetime",
  "codigoSeguridad": "string",
  "registradoEnSheets": "boolean",
  "notificadoEmpleados": "boolean"
}
```

---

## 🆕 **Nuevas Funcionalidades (Próximamente)**

### **Sistema de Notificaciones y Horarios**
- Configuración de notificaciones por empleado
- Horarios laborales por día de la semana
- Breaks y descansos programados
- Historial de notificaciones enviadas

---

## 🚀 **Estado del Proyecto**

- ✅ **Sistema de autenticación** completo
- ✅ **CRUD de usuarios** (Super Admin)
- ✅ **CRUD dual de empleados** (Dashboard + Super Admin)
- ✅ **Gestión de perfil** con cambio de email seguro
- ✅ **Sistema de licencias** y períodos de prueba
- ✅ **Validaciones** con Zod
- ✅ **Manejo de errores** centralizado
- ✅ **Base de datos** con Prisma ORM

---

## 📞 **Soporte**

Para más información o soporte técnico, contacta al equipo de desarrollo.

**Versión del documento:** 1.0.0  
**Última actualización:** $(date)
