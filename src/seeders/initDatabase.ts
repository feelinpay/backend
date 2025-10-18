import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🚀 Iniciando inicialización completa de la base de datos...');

    // 1. Limpiar base de datos existente
    console.log('🧹 Limpiando base de datos...');
    await prisma.otpCode.deleteMany();
    await prisma.membresia.deleteMany();
    await prisma.pago.deleteMany();
    await prisma.empleado.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.rolPermiso.deleteMany();
    await prisma.permiso.deleteMany();
    await prisma.rol.deleteMany();

    // 2. Crear roles
    console.log('👥 Creando roles...');
    const superAdminRole = await prisma.rol.create({
      data: {
        nombre: 'super_admin',
        descripcion: 'Super Administrador del sistema',
        activo: true,
      }
    });

    const propietarioRole = await prisma.rol.create({
      data: {
        nombre: 'propietario',
        descripcion: 'Propietario de negocio',
        activo: true,
      }
    });

    console.log('✅ Roles creados:', superAdminRole.nombre, propietarioRole.nombre);

    // 3. Crear permisos del sistema
    console.log('🔐 Creando permisos del sistema...');
    const permisos = [
      // Permisos de usuarios
      { nombre: 'gestionar_usuarios', descripcion: 'Gestionar usuarios del sistema', modulo: 'usuarios', accion: 'create' },
      { nombre: 'ver_usuarios', descripcion: 'Ver lista de usuarios', modulo: 'usuarios', accion: 'read' },
      { nombre: 'editar_usuarios', descripcion: 'Editar usuarios', modulo: 'usuarios', accion: 'update' },
      { nombre: 'eliminar_usuarios', descripcion: 'Eliminar usuarios', modulo: 'usuarios', accion: 'delete' },
      { nombre: 'inhabilitar_usuarios', descripcion: 'Inhabilitar usuarios', modulo: 'usuarios', accion: 'inhabilitar' },
      { nombre: 'reactivar_usuarios', descripcion: 'Reactivar usuarios', modulo: 'usuarios', accion: 'reactivar' },

      // Permisos de empleados
      { nombre: 'gestionar_empleados', descripcion: 'Gestionar empleados', modulo: 'empleados', accion: 'create' },
      { nombre: 'ver_empleados', descripcion: 'Ver lista de empleados', modulo: 'empleados', accion: 'read' },
      { nombre: 'editar_empleados', descripcion: 'Editar empleados', modulo: 'empleados', accion: 'update' },
      { nombre: 'eliminar_empleados', descripcion: 'Eliminar empleados', modulo: 'empleados', accion: 'delete' },

      // Permisos de pagos
      { nombre: 'ver_pagos', descripcion: 'Ver pagos', modulo: 'pagos', accion: 'read' },
      { nombre: 'gestionar_pagos', descripcion: 'Gestionar pagos', modulo: 'pagos', accion: 'create' },
      { nombre: 'editar_pagos', descripcion: 'Editar pagos', modulo: 'pagos', accion: 'update' },

      // Permisos de reportes
      { nombre: 'ver_reportes', descripcion: 'Ver reportes', modulo: 'reportes', accion: 'read' },
      { nombre: 'exportar_reportes', descripcion: 'Exportar reportes', modulo: 'reportes', accion: 'export' },

      // Permisos de membresías
      { nombre: 'gestionar_membresias', descripcion: 'Gestionar membresías', modulo: 'membresias', accion: 'create' },
      { nombre: 'ver_membresias', descripcion: 'Ver membresías', modulo: 'membresias', accion: 'read' },
      { nombre: 'activar_membresias', descripcion: 'Activar membresías', modulo: 'membresias', accion: 'activate' },

      // Permisos de sistema
      { nombre: 'ver_sistema', descripcion: 'Ver información del sistema', modulo: 'sistema', accion: 'read' },
      { nombre: 'gestionar_permisos', descripcion: 'Gestionar permisos', modulo: 'sistema', accion: 'manage' },
    ];

    const permisosCreados = [];
    for (const permiso of permisos) {
      const permisoCreado = await prisma.permiso.create({
        data: permiso
      });
      permisosCreados.push(permisoCreado);
    }

    console.log('✅ Permisos creados:', permisosCreados.length);

    // 4. Asignar permisos a roles
    console.log('🔗 Asignando permisos a roles...');
    
    // Super Admin tiene todos los permisos
    for (const permiso of permisosCreados) {
      await prisma.rolPermiso.create({
        data: {
          rolId: superAdminRole.id,
          permisoId: permiso.id
        }
      });
    }

    // Propietario tiene permisos limitados
    const permisosPropietario = permisosCreados.filter(p => 
      p.modulo === 'empleados' || 
      p.modulo === 'pagos' || 
      p.modulo === 'reportes' ||
      (p.modulo === 'sistema' && p.accion === 'read')
    );

    for (const permiso of permisosPropietario) {
      await prisma.rolPermiso.create({
        data: {
          rolId: propietarioRole.id,
          permisoId: permiso.id
        }
      });
    }

    console.log('✅ Permisos asignados a roles');

    // 5. Crear usuario super admin
    console.log('👤 Creando usuario super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await prisma.usuario.create({
      data: {
        nombre: 'David Zapata',
        email: 'davidzapata.dz051099@gmail.com',
        telefono: '+51987654321',
        password: hashedPassword,
        rolId: superAdminRole.id,
        googleSpreadsheetId: `sheet_${Date.now()}_admin`,
        activo: true,
        emailVerificado: true,
        enPeriodoPrueba: false,
        diasPruebaRestantes: 0,
        otpAttemptsToday: 0,
      }
    });

    console.log('✅ Usuario super admin creado:', superAdmin.email);

    // 6. Crear usuario propietario de ejemplo
    console.log('👤 Creando usuario propietario de ejemplo...');
    const propietarioPassword = await bcrypt.hash('propietario123', 10);
    
    const propietario = await prisma.usuario.create({
      data: {
        nombre: 'Juan Pérez',
        email: 'juan.perez@ejemplo.com',
        telefono: '+51987654322',
        password: propietarioPassword,
        rolId: propietarioRole.id,
        googleSpreadsheetId: `sheet_${Date.now()}_propietario`,
        activo: true,
        emailVerificado: true,
        enPeriodoPrueba: false,
        diasPruebaRestantes: 0,
        otpAttemptsToday: 0,
      }
    });

    console.log('✅ Usuario propietario creado:', propietario.email);

    // 7. Crear empleados de ejemplo
    console.log('👥 Creando empleados de ejemplo...');
    const empleados = [
      { paisCodigo: '+51', telefono: '987654321' },
      { paisCodigo: '+51', telefono: '987654322' },
      { paisCodigo: '+51', telefono: '987654323' },
    ];

    for (const empleado of empleados) {
      await prisma.empleado.create({
        data: {
          propietarioId: propietario.id,
          paisCodigo: empleado.paisCodigo,
          telefono: empleado.telefono,
          activo: true,
        }
      });
    }

    console.log('✅ Empleados creados:', empleados.length);

    // 8. Crear pagos de ejemplo
    console.log('💰 Creando pagos de ejemplo...');
    const pagos = [
      {
        nombrePagador: 'María García',
        monto: 50.00,
        fecha: new Date('2024-01-15'),
        codigoSeguridad: '123456',
        numeroTelefono: '+51987654324',
        mensajeOriginal: 'Pago por servicios',
      },
      {
        nombrePagador: 'Carlos López',
        monto: 75.50,
        fecha: new Date('2024-01-16'),
        codigoSeguridad: '789012',
        numeroTelefono: '+51987654325',
        mensajeOriginal: 'Pago mensual',
      },
    ];

    for (const pago of pagos) {
      await prisma.pago.create({
        data: {
          propietarioId: propietario.id,
          nombrePagador: pago.nombrePagador,
          monto: pago.monto,
          fecha: pago.fecha,
          codigoSeguridad: pago.codigoSeguridad,
          numeroTelefono: pago.numeroTelefono,
          mensajeOriginal: pago.mensajeOriginal,
          registradoEnSheets: false,
          notificadoEmpleados: false,
        }
      });
    }

    console.log('✅ Pagos creados:', pagos.length);

    // 9. Crear membresía de ejemplo
    console.log('📄 Creando membresía de ejemplo...');
    const membresia = await prisma.membresia.create({
      data: {
        usuarioId: propietario.id,
        tipo: 'premium',
        fechaInicio: new Date(),
        fechaExpiracion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        diasRestantes: 365,
        precio: 29.90,
        activa: true,
        activadaAt: new Date(),
      }
    });

    console.log('✅ Membresía creada:', membresia.id);

    // 10. Crear códigos OTP de ejemplo
    console.log('🔐 Creando códigos OTP de ejemplo...');
    const otpCodes = [
      {
        email: 'davidzapata.dz051099@gmail.com',
        codigo: '123456',
        tipo: 'EMAIL_VERIFICATION',
        expiraEn: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        usado: false,
        intentos: 0,
        maxIntentos: 3
      }
    ];

    for (const otp of otpCodes) {
      await prisma.otpCode.create({
        data: {
          email: otp.email,
          codigo: otp.codigo,
          tipo: otp.tipo,
          expiraEn: otp.expiraEn,
          usado: otp.usado,
          intentos: otp.intentos,
          maxIntentos: otp.maxIntentos
        }
      });
    }

    console.log('✅ Códigos OTP creados:', otpCodes.length);

    console.log('🎉 ¡Base de datos inicializada completamente!');
    console.log('\n📋 Resumen:');
    console.log(`- Roles: 2 (super_admin, propietario)`);
    console.log(`- Permisos: ${permisosCreados.length}`);
    console.log(`- Usuarios: 2 (super admin + propietario)`);
    console.log(`- Empleados: ${empleados.length}`);
    console.log(`- Pagos: ${pagos.length}`);
    console.log(`- Licencias: 1`);
    console.log(`- Códigos OTP: ${otpCodes.length}`);
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('Super Admin: davidzapata.dz051099@gmail.com / admin123');
    console.log('Propietario: juan.perez@ejemplo.com / propietario123');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase();
}

export { initDatabase };
