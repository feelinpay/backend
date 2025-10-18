const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const password = 'admin123';
    const hash = bcrypt.hashSync(password, 10);
    
    await prisma.usuario.update({
      where: { email: 'davidzapata.dz051099@gmail.com' },
      data: { password: hash }
    });
    
    console.log('Contraseña actualizada exitosamente');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
