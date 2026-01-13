import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permisosSidebar = [
    { nombre: 'Ver Dashboard', modulo: 'dashboard', ruta: '/dashboard' },
    { nombre: 'Gestión de Usuarios', modulo: 'usuarios', ruta: '/user-management' },
    { nombre: 'Mis Empleados', modulo: 'empleados', ruta: '/employee-management' },
    { nombre: 'Gestión de Membresías', modulo: 'membresias', ruta: '/membership-management' },
    { nombre: 'Gestión de Permisos', modulo: 'roles', ruta: '/permissions-management' },
    { nombre: 'Configuración del Sistema', modulo: 'sistema', ruta: '/permissions' }, // Match initDatabase route
    { nombre: 'Reportes de Membresías', modulo: 'reportes', ruta: '/membership-reports' },
];

const permisosFuncionales = [
    // Functional permissions if any, merged above for simplicity or kept separate if needed.
    // Dashboard is usually functional but listed in sidebar.
];

const todosLosPermisos = [...permisosSidebar, ...permisosFuncionales];

async function updatePermissions() {
    console.log('Iniciando actualización de permisos...');

    try {
        // 1. Limpiar permisos antiguos que no estén en la lista y que no tengan ruta (botones)
        // Actually, user wants to clean up schema.
        // Let's delete ALL permissions and recreate to be clean and safe?
        // Dangerous if IDs are used elsewhere, but permissions are linked by ID in RolPermiso.
        // Safer: Upsert based on nombre (which is now unique-ish acting as ID).
        // Or Delete all and recreate since we are redefining the system?
        // Let's stick to Upsert/Create to preserve existing links if possible, 
        // but names changed (slugs -> display names).
        // So old permissions like 'ver_usuarios' will be ORPHANED or DELETED.
        // I will DELETE everything to be clean as requested "Refine permission system".

        console.log('Eliminando permisos obsoletos...');
        // Delete all permissions to start fresh. 
        // This will cascade delete RolPermiso due to schema relations usually, 
        // or we need to delete RolPermiso first.
        await prisma.rolPermiso.deleteMany({});
        await prisma.permiso.deleteMany({});

        console.log('Creando nuevos permisos...');
        for (const p of todosLosPermisos) {
            await prisma.permiso.create({
                data: {
                    nombre: p.nombre,
                    modulo: p.modulo,
                    ruta: p.ruta,
                    activo: true
                }
            });
        }

        // Assign to Super Admin
        console.log('Asignando permisos a super_admin...');
        const superAdminRole = await prisma.rol.findUnique({ where: { nombre: 'super_admin' } });
        if (superAdminRole) {
            const allPermisos = await prisma.permiso.findMany();
            for (const p of allPermisos) {
                await prisma.rolPermiso.create({
                    data: {
                        rolId: superAdminRole.id,
                        permisoId: p.id
                    }
                });
            }
        }

        // Assign to Propietario (Example set)
        console.log('Asignando permisos a propietario...');
        const propietarioRole = await prisma.rol.findUnique({ where: { nombre: 'propietario' } });
        if (propietarioRole) {
            // Propietario gets: Dashboard, Empleados, Horarios, Sistema (partial?), Membresias (maybe?)
            // Let's give them a subset.
            const propietarioPerms = [
                'Dashboard Principal',
                'Mis Empleados',
                'Horarios y Jornadas',
                'Gestión de Membresías' // Assuming they manage their own
            ];

            const perms = await prisma.permiso.findMany({
                where: { nombre: { in: propietarioPerms } }
            });

            for (const p of perms) {
                await prisma.rolPermiso.create({
                    data: {
                        rolId: propietarioRole.id,
                        permisoId: p.id
                    }
                });
            }
        }

        console.log('Permisos actualizados correctamente.');

    } catch (error) {
        console.error('Error actualizando permisos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePermissions();
