import { initDatabase } from './initDatabase';

async function runAllSeeders() {
  try {
    console.log('Ejecutando inicialización completa de la base de datos...');

    // Ejecutar inicialización completa
    await initDatabase();

    console.log('Base de datos inicializada completamente');
    
    return true;
  } catch (error) {
    console.error('Error ejecutando seeders:', error);
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
      console.error('Error:', error);
      process.exit(1);
    });
}

export { runAllSeeders };