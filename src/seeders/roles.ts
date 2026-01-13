import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function seedRoles() {
  try {
    console.log('Creando roles del sistema...');

    const roles = [
      {
        nombre: 'super_admin',
        descripcion: 'Super Administrador con acceso completo al sistema',
        permisos: [
          'GESTION_USUARIOS',
          'GESTION_EMPLEADOS',
          'GESTION_PAGOS',
          'GESTION_REPORTES',
          'GESTION_CONFIGURACION',
          'GESTION_LICENCIAS',
          'ACCESO_TOTAL'
        ]
      },
      {
        nombre: 'propietario',
        descripcion: 'Propietario de negocio con acceso a su empresa',
        permisos: [
          'GESTION_EMPLEADOS',
          'GESTION_PAGOS',
          'GESTION_REPORTES',
          'GESTION_CONFIGURACION'
        ]
      },

    ];

    for (const rol of roles) {
      const existingRol = await prisma.rol.findUnique({
        where: { nombre: rol.nombre }
      });

      if (!existingRol) {
        await prisma.rol.create({
          data: {
            id: uuidv4(),
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            activo: true
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error creando roles:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedRoles()
    .then((success) => {
      if (success) {
        console.log('Seeders de roles completados');
      } else {
        console.log('Error en seeders de roles');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
