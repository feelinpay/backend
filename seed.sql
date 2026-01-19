-- =============================================
-- SEED DATA: Datos Iniciales para Feelin Pay
-- Basado en src/seeders/initDatabase.ts
-- =============================================
-- Ejecutar DESPUÉS del migration.sql

-- 1. ROLES
INSERT INTO "roles" ("id", "nombre", "descripcion", "activo", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'super_admin', 'Super Administrador', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'propietario', 'Propietario de Negocio', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. MEMBRESÍAS (según initDatabase.ts)
INSERT INTO "membresias" ("id", "nombre", "meses", "precio", "activa", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Membresía Básica', 1, 15.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Membresía Crece', 6, 80.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Membresía Premium', 12, 150.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. PERMISOS (solo los que tienen ruta válida)
INSERT INTO "permisos" ("id", "nombre", "modulo", "ruta", "activo", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Ver Dashboard', 'dashboard', '/dashboard', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Gestión de Usuarios', 'usuarios', '/user-management', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Mis Empleados', 'empleados', '/employee-management', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Gestión de Membresías', 'membresias', '/membership-management', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Gestión de Permisos', 'roles', '/permissions-management', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Configuración del Sistema', 'sistema', '/permissions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Reportes de Membresías', 'reportes', '/membership-reports', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. ASIGNAR PERMISOS A ROLES

-- Super Admin: Todos los permisos
INSERT INTO "rol_permisos" ("id", "rolId", "permisoId", "createdAt")
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permisos" p
WHERE r.nombre = 'super_admin';

-- Propietario: Dashboard, Empleados, Sistema
INSERT INTO "rol_permisos" ("id", "rolId", "permisoId", "createdAt")
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permisos" p
WHERE r.nombre = 'propietario'
AND p.nombre IN ('Ver Dashboard', 'Mis Empleados', 'Configuración del Sistema');

-- 5. USUARIO SUPER ADMIN
INSERT INTO "usuarios" (
    "id", 
    "nombre", 
    "email", 
    "googleId", 
    "rolId", 
    "activo", 
    "fechaInicioPrueba", 
    "fechaFinPrueba", 
    "imagen",
    "createdAt", 
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    'Feelin Pay',
    'feelinpay@gmail.com',
    '104068593847385938457',
    r.id,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '100 years',
    'https://lh3.googleusercontent.com/a/default',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "roles" r
WHERE r.nombre = 'super_admin';

-- =============================================
-- SEED COMPLETADO
-- =============================================
-- Datos iniciales cargados (según initDatabase.ts):
-- - 2 Roles (super_admin, propietario)
-- - 3 Membresías (Básica S/15, Crece S/80, Premium S/150)
-- - 7 Permisos de navegación
-- - 1 Usuario Super Admin (feelinpay@gmail.com)
-- =============================================
