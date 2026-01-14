import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('Iniciando carga de datos (SÓLO RUTAS VÁLIDAS)...');

    // 1. Limpieza
    console.log('Limpiando base de datos...');
    await prisma.membresiaUsuario.deleteMany();
    await prisma.rolPermiso.deleteMany();
    await prisma.horarioLaboral.deleteMany();

    await prisma.empleado.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.membresia.deleteMany();
    await prisma.permiso.deleteMany();
    await prisma.rol.deleteMany();

    // 2. Roles
    console.log('Creando roles...');
    const superAdminRole = await prisma.rol.create({
      data: { nombre: 'super_admin', descripcion: 'Super Administrador', activo: true }
    });

    const propietarioRole = await prisma.rol.create({
      data: { nombre: 'propietario', descripcion: 'Propietario de Negocio', activo: true }
    });

    // 3. Membresías
    console.log('Creando membresías...');
    // Básica: 1 mes, 15 soles
    await prisma.membresia.create({
      data: { nombre: 'Membresía Básica', precio: 15.00, meses: 1, activa: true }
    });

    // Crece: 6 meses, 80 soles
    await prisma.membresia.create({
      data: { nombre: 'Membresía Crece', precio: 80.00, meses: 6, activa: true }
    });

    // Premium: 12 meses, 150 soles
    await prisma.membresia.create({
      data: { nombre: 'Membresía Premium', precio: 150.00, meses: 12, activa: true }
    });

    // 4. Permisos (SÓLO LOS QUE TIENEN RUTA, OMITIENDO NULL)
    console.log('Creando permisos de navegación...');
    const permisosData = [
      // Dashboard
      { nombre: 'Ver Dashboard', modulo: 'dashboard', ruta: '/dashboard' },

      // Usuarios
      { nombre: 'Gestión de Usuarios', modulo: 'usuarios', ruta: '/user-management' },

      // Empleados
      { nombre: 'Mis Empleados', modulo: 'empleados', ruta: '/employee-management' },

      // Membresías
      { nombre: 'Gestión de Membresías', modulo: 'membresias', ruta: '/membership-management' },

      // Roles / Permisos
      { nombre: 'Gestión de Permisos', modulo: 'roles', ruta: '/permissions-management' },

      // Sistema (Apunta a permisos de Android)
      { nombre: 'Configuración del Sistema', modulo: 'sistema', ruta: '/permissions' },

      // Reportes
      { nombre: 'Reportes de Membresías', modulo: 'reportes', ruta: '/membership-reports' },
    ];

    const permisosMap = new Map();
    for (const p of permisosData) {
      const permiso = await prisma.permiso.create({
        data: {
          nombre: p.nombre,
          modulo: p.modulo,
          ruta: p.ruta,
          activo: true
        }
      });
      permisosMap.set(p.nombre, permiso.id);
    }

    // 5. Asignar Permisos
    console.log('Asignando permisos...');

    const asignar = async (rolId, nombres) => {
      for (const nombre of nombres) {
        const id = permisosMap.get(nombre);
        if (id) await prisma.rolPermiso.create({ data: { rolId, permisoId: id } });
      }
    };

    // SUPER ADMIN: Todo
    await asignar(superAdminRole.id, permisosData.map(p => p.nombre));

    // PROPIETARIO: Dashboard, Empleados, Configuración Sistema
    await asignar(propietarioRole.id, [
      'Ver Dashboard',
      'Mis Empleados',
      'Configuración del Sistema'
    ]);

    // 6. Usuario Super Admin
    console.log('Creando usuario...');
    await prisma.usuario.create({
      data: {
        nombre: 'Feelin Pay',
        email: 'feelinpay@gmail.com',
        googleId: '104068593847385938457',
        rolId: superAdminRole.id,
        activo: true,
        fechaInicioPrueba: new Date(),
        fechaFinPrueba: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
        imagen: 'https://lh3.googleusercontent.com/a/ACg8ocLabc...' // Placeholder
      }
    });

    console.log('--- SEED COMPLETADO (MODO LIMPIO) ---');
    console.log('Sólo se registraron permisos con ruta válida.');
    console.log('Membresías actualizadas.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initDatabase();
}

export { initDatabase };
