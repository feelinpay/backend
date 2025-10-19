import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMembresias() {
  console.log('Iniciando seeder de membresías...');

  try {
    // Limpiar membresías existentes
    await prisma.membresia.deleteMany();

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
    const tiposMembresia = ['basica', 'premium', 'empresarial'];
    const precios = [29.90, 59.90, 99.90];

    for (let i = 0; i < Math.min(usuariosPropietarios.length, 3); i++) {
      const usuario = usuariosPropietarios[i];
      const tipo = tiposMembresia[i % tiposMembresia.length];
      const precio = precios[i % precios.length];

      const fechaInicio = new Date();
      const fechaExpiracion = new Date();
      fechaExpiracion.setMonth(fechaInicio.getMonth() + 1);

      await prisma.membresia.create({
        data: {
          usuarioId: usuario.id,
          tipo,
          fechaInicio,
          fechaExpiracion,
          diasRestantes: 30,
          precio,
          activadaAt: new Date()
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