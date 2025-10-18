import { initDatabase } from './initDatabase';

async function runAllSeeders() {
  try {
    console.log('🚀 Ejecutando inicialización completa de la base de datos...');
    console.log('');

    // Ejecutar inicialización completa
    await initDatabase();

    console.log('🎉 Base de datos inicializada completamente');
    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log('   - Super Admin: davidzapata.dz051099@gmail.com / admin123');
    console.log('   - Propietario: juan.perez@ejemplo.com / propietario123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia estas contraseñas después del primer login');

    return true;
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllSeeders()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

export { runAllSeeders };