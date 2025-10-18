import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  try {
    console.log('👑 Creando Super Administrador...');
    
    const superAdminRol = await prisma.rol.findUnique({
      where: { nombre: 'super_admin' }
    });

    if (!superAdminRol) {
      console.log('❌ Error: No se encontró el rol de super_admin');
      console.log('   Ejecuta primero: npm run seed:roles');
      return false;
    }

    // Verificar si ya existe un usuario con este email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: 'davidzapata.dz051099@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Usuario ya existe, actualizando a Super Admin...');
      
      await prisma.usuario.update({
        where: { id: existingUser.id },
        data: {
          rolId: superAdminRol.id,
          googleSpreadsheetId: `sheet_${uuidv4()}`,
          activo: true,
          emailVerificado: true,
          emailVerificadoAt: new Date(),
          enPeriodoPrueba: false,
          diasPruebaRestantes: 0
        }
      });
      
      console.log('✅ Usuario actualizado a Super Administrador');
      return true;
    }

    // Crear nuevo super admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        nombre: 'David Zapata',
        telefono: '+51949325565',
        email: 'davidzapata.dz051099@gmail.com',
        password: hashedPassword,
        rolId: superAdminRol.id,
        googleSpreadsheetId: `sheet_${uuidv4()}`,
        activo: true,
        emailVerificado: true,
        emailVerificadoAt: new Date(),
        enPeriodoPrueba: false,
        diasPruebaRestantes: 0
      }
    });

    console.log('✅ Super Administrador creado exitosamente');
    console.log(`   - ID: ${superAdmin.id}`);
    console.log(`   - Nombre: ${superAdmin.nombre}`);
    console.log(`   - Email: ${superAdmin.email}`);
    console.log(`   - Teléfono: ${superAdmin.telefono}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error creando Super Admin:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedSuperAdmin()
    .then((success) => {
      if (success) {
        console.log('✅ Seeder de Super Admin completado');
        console.log('');
        console.log('🔐 Credenciales de acceso:');
        console.log('   - Email: davidzapata.dz051099@gmail.com');
        console.log('   - Contraseña: admin123');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
      } else {
        console.log('❌ Error en seeder de Super Admin');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}
