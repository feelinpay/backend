# 📋 Endpoints de la API - Feelin Pay

## 🔓 **RUTAS PÚBLICAS** (`/api/public/*`)
**Acceso:** Sin autenticación requerida

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/public/auth/login` | Iniciar sesión |
| `POST` | `/api/public/auth/register` | Registrarse |
| `POST` | `/api/public/auth/verify-otp` | Verificar código OTP genérico |
| `POST` | `/api/public/auth/verify-registration-otp` | Verificar OTP de registro |
| `POST` | `/api/public/auth/verify-login-otp` | Verificar OTP de login |
| `POST` | `/api/public/auth/resend-otp` | Reenviar código OTP |
| `POST` | `/api/public/auth/forgot-password` | Recuperar contraseña |
| `POST` | `/api/public/auth/reset-password` | Restablecer contraseña |

### Sistema
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/public/health` | Estado del servidor |

---

## 🔐 **RUTAS DE PROPIETARIO** (`/api/owner/*`)
**Acceso:** Usuario autenticado (cualquier rol)

### Perfil Básico
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/owner/profile` | Obtener perfil del usuario |
| `PUT` | `/api/owner/profile` | Actualizar perfil completo |
| `PATCH` | `/api/owner/profile/password` | Cambiar contraseña |
| `POST` | `/api/owner/profile/verify-email` | Verificar cambio de email |
| `GET` | `/api/owner/profile/license` | Obtener información de licencia |

### Gestión Específica del Perfil
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `PUT` | `/api/owner/profile/profile/name` | Actualizar solo el nombre |
| `PUT` | `/api/owner/profile/profile/phone` | Actualizar solo el teléfono |
| `PUT` | `/api/owner/profile/profile/password` | Actualizar contraseña con validación |
| `POST` | `/api/owner/profile/profile/email/request` | Solicitar cambio de email |
| `POST` | `/api/owner/profile/profile/email/confirm` | Confirmar cambio de email con OTP |
| `GET` | `/api/owner/profile/profile/history` | Obtener historial del perfil |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/owner/dashboard` | Obtener datos del dashboard |

---

## 👑 **RUTAS DE SUPER ADMIN** (`/api/super-admin/*`)
**Acceso:** Usuario autenticado con rol `super_admin`

### CRUD de Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/super-admin/users` | Crear usuario |
| `GET` | `/api/super-admin/users` | Listar usuarios (con paginación) |
| `GET` | `/api/super-admin/users/:id` | Obtener usuario por ID |
| `PUT` | `/api/super-admin/users/:id` | Actualizar usuario |
| `DELETE` | `/api/super-admin/users/:id` | Eliminar usuario (soft delete) |

### Gestión de Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `PATCH` | `/api/super-admin/users/:id/password` | Cambiar contraseña de usuario |
| `PATCH` | `/api/super-admin/users/:id/toggle-status` | Activar/desactivar usuario |
| `PUT` | `/api/super-admin/users/:id/extender-prueba` | Extender período de prueba |
| `PUT` | `/api/super-admin/users/:id/verificar-email` | Verificar email de usuario |

### Estadísticas y Roles
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/super-admin/stats` | Estadísticas de usuarios |
| `GET` | `/api/super-admin/roles` | Listar roles disponibles |
| `GET` | `/api/super-admin/estadisticas-generales` | Estadísticas generales del sistema |
| `GET` | `/api/super-admin/verificar-acceso` | Verificar acceso del sistema |

---

## 📊 **Resumen de Endpoints por Rol**

| Rol | Cantidad | Descripción |
|-----|----------|-------------|
| **Público** | 9 | Login, registro, recuperación de contraseña, OTP |
| **Propietario** | 13 | Perfil, dashboard y gestión personal |
| **Super Admin** | 13 | CRUD completo de usuarios + estadísticas |

**Total: 35 endpoints** organizados por nivel de acceso.

---

## 🔒 **Sistema de Autenticación**

### Middleware
- **`authenticateToken`**: Verifica el token JWT y carga los datos del usuario
- **`requireSuperAdmin`**: Verifica que el usuario tenga rol `super_admin`

### Jerarquía de Acceso
1. **Público**: Sin autenticación
2. **Propietario**: Token válido (cualquier rol)
3. **Super Admin**: Token válido + rol `super_admin`

---

## 📝 **Ejemplos de Uso**

### Login (Público)
```bash
curl -X POST http://localhost:3001/api/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

### Obtener Perfil (Propietario)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/owner/profile
```

### Actualizar Nombre (Propietario)
```bash
curl -X PUT http://localhost:3001/api/owner/profile/profile/name \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Nombre"}'
```

### Crear Usuario (Super Admin)
```bash
curl -X POST http://localhost:3001/api/super-admin/users \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+51987654321",
    "password": "password123",
    "rolId": "rol-uuid"
  }'
```

### Listar Usuarios (Super Admin)
```bash
curl -H "Authorization: Bearer <super_admin_token>" \
  "http://localhost:3001/api/super-admin/users?page=1&limit=10&status=active"
```

---

## 🛡️ **Códigos de Respuesta**

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Datos inválidos |
| `401` | No autenticado |
| `403` | Acceso denegado (permisos insuficientes) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (email duplicado) |
| `500` | Error interno del servidor |

---

## 🔄 **Compatibilidad con Frontend**

### Rutas del Frontend Verificadas:
- ✅ `/auth/login` → `/api/public/auth/login`
- ✅ `/auth/register` → `/api/public/auth/register`
- ✅ `/auth/verify-registration-otp` → `/api/public/auth/verify-registration-otp`
- ✅ `/auth/verify-login-otp` → `/api/public/auth/verify-login-otp`
- ✅ `/auth/verify-otp` → `/api/public/auth/verify-otp`
- ✅ `/auth/resend-otp` → `/api/public/auth/resend-otp`
- ✅ `/auth/forgot-password` → `/api/public/auth/forgot-password`
- ✅ `/auth/reset-password` → `/api/public/auth/reset-password`
- ✅ `/profile/profile/name` → `/api/owner/profile/profile/name`
- ✅ `/profile/profile/phone` → `/api/owner/profile/profile/phone`
- ✅ `/profile/profile/password` → `/api/owner/profile/profile/password`
- ✅ `/profile/profile/email/request` → `/api/owner/profile/profile/email/request`
- ✅ `/profile/profile/email/confirm` → `/api/owner/profile/profile/email/confirm`
- ✅ `/profile/profile/history` → `/api/owner/profile/profile/history`

**Todas las rutas del frontend están disponibles y funcionando** ✅

---

## 🚀 **Ventajas de esta Estructura**

1. **Claridad**: Fácil identificar qué rutas requiere qué permisos
2. **Seguridad**: Separación clara de responsabilidades
3. **Escalabilidad**: Fácil agregar nuevas rutas por rol
4. **Mantenimiento**: Código organizado y fácil de mantener
5. **Documentación**: Estructura auto-documentada
6. **Sin Redundancia**: Eliminación de archivos duplicados
7. **Compatibilidad**: Todas las rutas del frontend están disponibles
8. **Autenticación Correcta**: Perfil solo para usuarios logeados
