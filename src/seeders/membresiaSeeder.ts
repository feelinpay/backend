import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMembresias() {
  console.log('Iniciando seeder de membresías...');

  try {
    // Limpiar membresías y relaciones existentes
    await prisma.membresiaUsuario.deleteMany();
    await prisma.membresia.deleteMany();

    // Crear catálogo de membresías
    const membresias = [
      { nombre: 'Membresía Básica', meses: 1, precio: 29.90 },
      { nombre: 'Membresía Premium', meses: 3, precio: 79.90 },
      { nombre: 'Membresía Empresarial', meses: 6, precio: 149.90 },
      { nombre: 'Membresía Anual', meses: 12, precio: 299.90 }
    ];

    const membresiasCreadas = [];
    for (const membresia of membresias) {
      const creada = await prisma.membresia.create({
        data: {
          nombre: membresia.nombre,
          meses: membresia.meses,
          precio: membresia.precio,
          activa: true
        }
      });
      membresiasCreadas.push(creada);
    }

    // Obtener usuarios propietarios
    const usuariosPropietarios = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'propietario'
        }
      },
      select: {
        id: true,
        nombre: true,
        email: true
      }
    });

    // Asignar membresías de prueba a algunos usuarios
    for (let i = 0; i < Math.min(usuariosPropietarios.length, 3); i++) {
      const usuario = usuariosPropietarios[i];
      const membresia = membresiasCreadas[i % membresiasCreadas.length];

      const fechaInicio = new Date();
      const fechaExpiracion = new Date();
      fechaExpiracion.setMonth(fechaInicio.getMonth() + membresia.meses);

      await prisma.membresiaUsuario.create({
        data: {
          usuarioId: usuario.id,
          membresiaId: membresia.id,
          fechaInicio,
          fechaExpiracion,
          activa: true
        }
      });
    }

    console.log('Seeder de membresías completado exitosamente');
  } catch (error) {
    console.error('Error en seeder de membresías:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMembresias()
    .then(() => {
      console.log('Seeder ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error ejecutando seeder:', error);
      process.exit(1);
    });
}