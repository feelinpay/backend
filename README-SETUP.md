# 🚀 Feelin Pay Backend - Setup Completo

## 📋 Comandos Disponibles

### 🔧 Configuración Inicial
```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npx prisma generate

# 3. Aplicar migraciones
npx prisma db push

# 4. Inicializar base de datos completa
npm run seed:init
```

### 🧪 Pruebas del Sistema
```bash
# Ejecutar todas las pruebas del sistema
npm run test:system

# Limpiar archivos de prueba
npm run cleanup
```

### 🏃‍♂️ Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## 🗄️ Base de Datos

### 📊 Estructura Creada
- **Roles**: `super_admin`, `propietario`
- **Permisos**: Sistema granular de permisos
- **Usuarios**: Super admin + propietario de ejemplo
- **Empleados**: 3 empleados de ejemplo
- **Pagos**: 2 pagos de ejemplo
- **Licencias**: 1 licencia de ejemplo
- **Auditoría**: Logs de ejemplo

### 🔑 Credenciales de Acceso
```
Super Admin:
- Email: davidzapata.dz051099@gmail.com
- Contraseña: admin123

Propietario:
- Email: juan.perez@ejemplo.com
- Contraseña: propietario123
```

## 🧹 Limpieza

### Eliminar Archivos de Prueba
```bash
npm run cleanup
```

### Resetear Base de Datos
```bash
# Eliminar base de datos
rm feelin_pay.db

# Recrear desde cero
npm run seed:init
```

## 📁 Estructura de Seeders

```
src/seeders/
├── index.ts           # Orquestador principal
├── initDatabase.ts    # Inicialización completa
├── roles.ts          # Creación de roles
└── superAdmin.ts    # Usuario super admin
```

## ⚠️ Importante

- **Cambiar contraseñas** después del primer login
- **Eliminar archivos de prueba** con `npm run cleanup`
- **No usar scripts** fuera de la carpeta seeders
- **Usar solo seeders** para configuración de BD
