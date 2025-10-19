# 🚀 API Routes - Feelin Pay Backend

## 📋 **Resumen de Rutas Disponibles**

### **Base URL**: `http://localhost:3000/api`

---

## 🔓 **RUTAS PÚBLICAS** (`/api/public`)

### **Autenticación**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Iniciar sesión | ❌ |
| `POST` | `/auth/register` | Registro de usuario | ❌ |
| `POST` | `/auth/verify-otp` | Verificar código OTP | ❌ |
| `POST` | `/auth/verify-registration-otp` | Verificar OTP de registro | ❌ |
| `POST` | `/auth/verify-login-otp` | Verificar OTP de login | ❌ |
| `POST` | `/auth/resend-otp` | Reenviar código OTP | ❌ |
| `POST` | `/auth/forgot-password` | Solicitar reset de contraseña | ❌ |
| `POST` | `/auth/reset-password` | Resetear contraseña | ❌ |

---

## 👤 **RUTAS DE USUARIO** (`/api/owner`)

### **Perfil del Usuario**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/profile` | Obtener perfil del usuario | ✅ |
| `PUT` | `/profile` | Actualizar perfil completo | ✅ |
| `PATCH` | `/profile/password` | Cambiar contraseña | ✅ |
| `POST` | `/profile/verify-email` | Verificar cambio de email | ✅ |
| `PUT` | `/profile/profile/name` | Actualizar nombre | ✅ |
| `PUT` | `/profile/profile/phone` | Actualizar teléfono | ✅ |
| `PUT` | `/profile/profile/password` | Actualizar contraseña | ✅ |
| `POST` | `/profile/profile/email/request` | Solicitar cambio de email | ✅ |
| `POST` | `/profile/profile/email/confirm` | Confirmar cambio de email | ✅ |

### **Dashboard**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/dashboard` | Información del dashboard | ✅ |

### **Gestión de Empleados** (`/employees`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/employees` | Obtener mis empleados | ✅ |
| `GET` | `/employees/:id` | Obtener empleado específico | ✅ |
| `POST` | `/employees` | Crear nuevo empleado | ✅ |
| `PUT` | `/employees/:id` | Actualizar empleado | ✅ |
| `PATCH` | `/employees/:id/toggle` | Activar/desactivar empleado | ✅ |
| `DELETE` | `/employees/:id` | Eliminar empleado | ✅ |
| `GET` | `/employees/search` | Buscar empleados | ✅ |
| `GET` | `/employees/filters` | Empleados con filtros | ✅ |
| `GET` | `/employees/stats` | Estadísticas de empleados | ✅ |

### **Configuración de Notificaciones** (`/employees/notifications`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/employees/notifications` | Obtener configuración | ✅ |
| `POST` | `/employees/notifications` | Crear configuración | ✅ |
| `PUT` | `/employees/notifications/:id` | Actualizar configuración | ✅ |
| `DELETE` | `/employees/notifications/:id` | Eliminar configuración | ✅ |

### **Horarios Laborales** (`/employees/schedules`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/employees/schedules` | Obtener horarios | ✅ |
| `POST` | `/employees/schedules` | Crear horario | ✅ |
| `PUT` | `/employees/schedules/:id` | Actualizar horario | ✅ |
| `DELETE` | `/employees/schedules/:id` | Eliminar horario | ✅ |

### **Breaks Laborales** (`/employees/breaks`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/employees/breaks` | Obtener breaks | ✅ |
| `POST` | `/employees/breaks` | Crear break | ✅ |
| `PUT` | `/employees/breaks/:id` | Actualizar break | ✅ |
| `DELETE` | `/employees/breaks/:id` | Eliminar break | ✅ |

---

## 💳 **RUTAS DE PAGOS** (`/api/payments`)

### **Procesamiento de Pagos**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/yape` | Procesar pago de Yape | ✅ |
| `GET` | `/usuario/:usuarioId` | Obtener pagos del usuario | ✅ |
| `GET` | `/usuario/:usuarioId/estadisticas` | Estadísticas de pagos | ✅ |

---

## 🔐 **RUTAS DE SUPER ADMIN** (`/api/super-admin`)

### **Gestión de Usuarios**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/users` | Crear usuario | ✅ + Super Admin |
| `GET` | `/users` | Obtener todos los usuarios | ✅ + Super Admin |
| `GET` | `/users/:id` | Obtener usuario por ID | ✅ + Super Admin |
| `PUT` | `/users/:id` | Actualizar usuario | ✅ + Super Admin |
| `DELETE` | `/users/:id` | Desactivar usuario | ✅ + Super Admin |
| `PATCH` | `/users/:id/reactivate` | Reactivar usuario | ✅ + Super Admin |
| `PATCH` | `/users/:id/password` | Cambiar contraseña | ✅ + Super Admin |
| `PATCH` | `/users/:id/toggle-status` | Toggle estado usuario | ✅ + Super Admin |
| `PATCH` | `/users/:id/extender-prueba` | Extender período de prueba | ✅ + Super Admin |
| `GET` | `/users/stats` | Estadísticas de usuarios | ✅ + Super Admin |
| `GET` | `/users/roles` | Obtener todos los roles | ✅ + Super Admin |

### **Estadísticas Generales**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/stats` | Estadísticas generales | ✅ + Super Admin |
| `GET` | `/access/:usuarioId` | Verificar acceso usuario | ✅ + Super Admin |
| `PATCH` | `/extender-prueba/:usuarioId` | Extender prueba | ✅ + Super Admin |
| `GET` | `/verify-email/:usuarioId` | Verificar email usuario | ✅ + Super Admin |
| `POST` | `/activar-membresia/:usuarioId` | Activar membresía | ✅ + Super Admin |
| `POST` | `/desactivar-membresia/:usuarioId` | Desactivar membresía | ✅ + Super Admin |
| `GET` | `/estadisticas-membresias` | Estadísticas de membresías | ✅ + Super Admin |

### **Gestión de Empleados por Usuario** (`/users/:userId/employees`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/users/:userId/employees` | Empleados del usuario | ✅ + Super Admin |
| `GET` | `/users/:userId/employees/:id` | Empleado específico | ✅ + Super Admin |
| `POST` | `/users/:userId/employees` | Crear empleado para usuario | ✅ + Super Admin |
| `PUT` | `/users/:userId/employees/:id` | Actualizar empleado | ✅ + Super Admin |
| `PATCH` | `/users/:userId/employees/:id/toggle` | Toggle estado empleado | ✅ + Super Admin |
| `DELETE` | `/users/:userId/employees/:id` | Eliminar empleado | ✅ + Super Admin |
| `GET` | `/users/:userId/employees/search` | Buscar empleados | ✅ + Super Admin |
| `GET` | `/users/:userId/employees/stats` | Estadísticas empleados | ✅ + Super Admin |

### **Configuración de Notificaciones** (`/users/:userId/employees/notifications`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/users/:userId/employees/notifications` | Configuración del usuario | ✅ + Super Admin |
| `POST` | `/users/:userId/employees/notifications` | Crear configuración | ✅ + Super Admin |
| `PUT` | `/users/:userId/employees/notifications/:id` | Actualizar configuración | ✅ + Super Admin |
| `DELETE` | `/users/:userId/employees/notifications/:id` | Eliminar configuración | ✅ + Super Admin |

### **Horarios Laborales** (`/users/:userId/employees/schedules`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/users/:userId/employees/schedules` | Horarios del usuario | ✅ + Super Admin |
| `POST` | `/users/:userId/employees/schedules` | Crear horario | ✅ + Super Admin |
| `PUT` | `/users/:userId/employees/schedules/:id` | Actualizar horario | ✅ + Super Admin |
| `DELETE` | `/users/:userId/employees/schedules/:id` | Eliminar horario | ✅ + Super Admin |

### **Breaks Laborales** (`/users/:userId/employees/breaks`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/users/:userId/employees/breaks` | Breaks del usuario | ✅ + Super Admin |
| `POST` | `/users/:userId/employees/breaks` | Crear break | ✅ + Super Admin |
| `PUT` | `/users/:userId/employees/breaks/:id` | Actualizar break | ✅ + Super Admin |
| `DELETE` | `/users/:userId/employees/breaks/:id` | Eliminar break | ✅ + Super Admin |

### **Gestión de Membresías** (`/membresias`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/membresias` | Obtener todas las membresías | ✅ + Super Admin |
| `GET` | `/membresias/activas` | Membresías activas | ✅ + Super Admin |
| `GET` | `/membresias/:id` | Obtener membresía por ID | ✅ + Super Admin |
| `POST` | `/membresias` | Crear nueva membresía | ✅ + Super Admin |
| `PUT` | `/membresias/:id` | Actualizar membresía | ✅ + Super Admin |
| `DELETE` | `/membresias/:id` | Eliminar membresía | ✅ + Super Admin |

### **Gestión de Membresías de Usuarios** (`/usuarios/:usuarioId/membresias`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/usuarios/membresias` | Todas las relaciones usuario-membresía | ✅ + Super Admin |
| `GET` | `/usuarios/:usuarioId/membresias` | Membresías del usuario | ✅ + Super Admin |
| `GET` | `/usuarios/:usuarioId/membresias/activa` | Membresía activa del usuario | ✅ + Super Admin |
| `GET` | `/usuarios/:usuarioId/membresias/verificar` | Verificar membresía activa | ✅ + Super Admin |
| `POST` | `/usuarios/:usuarioId/membresias` | Crear membresía para usuario | ✅ + Super Admin |
| `PUT` | `/usuarios/membresias/:id` | Actualizar membresía de usuario | ✅ + Super Admin |
| `PATCH` | `/usuarios/membresias/:id/extender` | Extender membresía | ✅ + Super Admin |
| `DELETE` | `/usuarios/membresias/:id` | Eliminar membresía de usuario | ✅ + Super Admin |

### **Gestión de Roles** (`/roles`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/roles` | Obtener todos los roles | ✅ + Super Admin |
| `GET` | `/roles/:id` | Obtener rol por ID | ✅ + Super Admin |
| `GET` | `/roles/:id/permisos` | Obtener rol con permisos | ✅ + Super Admin |
| `GET` | `/roles/:id/permisos-lista` | Lista de permisos del rol | ✅ + Super Admin |
| `POST` | `/roles` | Crear nuevo rol | ✅ + Super Admin |
| `PUT` | `/roles/:id` | Actualizar rol | ✅ + Super Admin |
| `DELETE` | `/roles/:id` | Eliminar rol | ✅ + Super Admin |
| `POST` | `/roles/:id/permisos` | Asignar permiso a rol | ✅ + Super Admin |
| `DELETE` | `/roles/:id/permisos` | Desasignar permiso de rol | ✅ + Super Admin |

### **Gestión de Permisos** (`/permisos`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/permisos` | Obtener todos los permisos | ✅ + Super Admin |
| `GET` | `/permisos/:id` | Obtener permiso por ID | ✅ + Super Admin |
| `GET` | `/permisos/filtrar/modulo/:modulo` | Filtrar por módulo | ✅ + Super Admin |
| `GET` | `/permisos/filtrar/accion/:accion` | Filtrar por acción | ✅ + Super Admin |
| `POST` | `/permisos` | Crear nuevo permiso | ✅ + Super Admin |
| `PUT` | `/permisos/:id` | Actualizar permiso | ✅ + Super Admin |
| `DELETE` | `/permisos/:id` | Eliminar permiso | ✅ + Super Admin |

---

## 🔧 **Funcionalidades Especiales**

### **Sistema de SMS Inteligente**
- **Envío automático**: SMS a empleados basado en horarios laborales
- **Configuración de breaks**: No envío durante descansos
- **Notificaciones directas**: Control manual de activación/desactivación

### **Sistema de Pagos Yape**
- **Procesamiento automático**: Recepción de notificaciones de pago
- **SMS a empleados**: Notificación automática a empleados elegibles
- **Verificación de trial**: Control de período de prueba

### **Sistema de Membresías**
- **Membresías configurables**: 1-12 meses de duración
- **Asignación por usuario**: Fechas independientes por usuario
- **Extensión de trial**: Super Admin puede extender períodos de prueba

### **Sistema de Roles y Permisos**
- **Roles personalizables**: Creación de roles específicos
- **Permisos granulares**: Control detallado de acceso
- **Asignación flexible**: Roles con múltiples permisos

---

## 📊 **Estadísticas de la API**

### **Total de Endpoints**: 120+
- **Públicos**: 8 endpoints
- **Usuario**: 25+ endpoints
- **Pagos**: 3 endpoints
- **Super Admin**: 85+ endpoints

### **Módulos Implementados**:
- ✅ **Autenticación y Perfil**
- ✅ **Gestión de Empleados** (Dual CRUD)
- ✅ **Sistema de Notificaciones**
- ✅ **Horarios Laborales**
- ✅ **Breaks Laborales**
- ✅ **Procesamiento de Pagos**
- ✅ **Sistema de Membresías**
- ✅ **Roles y Permisos**
- ✅ **SMS Inteligente**
- ✅ **Trial Management**

---

## 🚀 **Estado del Backend**

**✅ COMPLETAMENTE FUNCIONAL**
- Sin errores de compilación
- Código limpio y organizado
- Patrón Repository implementado
- Terminología consistente
- Sin archivos redundantes
- Estructura modular

**¡El backend de Feelin Pay está listo para producción!** 🎉
