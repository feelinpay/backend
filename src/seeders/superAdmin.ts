import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  try {
    console.log('Creando Super Administrador...');

    const superAdminRol = await prisma.rol.findUnique({
      where: { nombre: 'super_admin' }
    });

    if (!superAdminRol) {
      console.log('Error: No se encontró el rol de super_admin');
      console.log('Ejecuta primero: npm run seed:roles');
      return false;
    }

    // Verificar si ya existe un usuario con este email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: 'feelinpay@gmail.com' }
    });

    if (existingUser) {
      console.log('Usuario ya existe, actualizando a Super Admin...');

      await prisma.usuario.update({
        where: { id: existingUser.id },
        data: {
          rolId: superAdminRol.id,
          googleDriveFolderId: `folder_${uuidv4()}`,
          activo: true,
          fechaInicioPrueba: new Date(),
          fechaFinPrueba: null
        }
      });

      return true;
    }

    // Crear nuevo super admin (requiere Google Sign-In)
    // NOTA: Este usuario debe autenticarse por primera vez con Google Sign-In
    // El googleId se asignará automáticamente en el primer login
    const superAdmin = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        nombre: 'David Zapata',
        email: 'feelinpay@gmail.com',
        googleId: 'google_placeholder_superadmin', // Temporal, se reemplazará en primer login
        rolId: superAdminRol.id,
        googleDriveFolderId: `folder_${uuidv4()}`,
        activo: true,
        fechaInicioPrueba: new Date(),
        // SuperAdmin doesn't really need trial end date, but we can set it to null or far future
        fechaFinPrueba: null
      }
    });

    console.log('Super Administrador creado exitosamente');
    console.log('IMPORTANTE: Debe autenticarse con Google Sign-In la primera vez');

    return true;
  } catch (error) {
    console.error('Error creando Super Admin:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedSuperAdmin()
    .then((success) => {
      if (success) {
        console.log('Seeder de Super Admin completado');
        console.log('Email: feelinpay@gmail.com');
        console.log('Autenticación: Google Sign-In');
      } else {
        console.log('Error en seeder de Super Admin');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
