import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed para Google Auth...');

  // 1. Roles
  const rolPropietario = await prisma.rol.upsert({
    where: { nombre: 'propietario' },
    update: {},
    create: {
      nombre: 'propietario',
      descripcion: 'Dueño del negocio',
      activo: true
    }
  });

  const rolEmpleado = await prisma.rol.upsert({
    where: { nombre: 'empleado' },
    update: {},
    create: {
      nombre: 'empleado',
      descripcion: 'Empleado regular',
      activo: true
    }
  });

  console.log('Roles creados/verificados.');

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
