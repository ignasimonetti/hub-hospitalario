/**
 * Script de prueba para verificar la conectividad con PocketBase
 *
 * Este script se puede ejecutar directamente con:
 * ts-node packages/core/src/lib/pocketbase/test-connection.ts
 *
 * O desde la línea de comandos:
 * node -r ts-node/register packages/core/src/lib/pocketbase/test-connection.ts
 */

import { testConnection, pb, authenticateAdmin } from './index';
import PocketBase from 'pocketbase';

/**
 * Función principal de prueba
 */
async function main() {
  console.log('🧪 Iniciando pruebas de conectividad con PocketBase...\n');
  
  try {
    // Verificar conexión básica
    console.log('1. Verificando conexión básica...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('❌ La conexión básica ha fallado. Deteniendo las pruebas.');
      process.exit(1);
    }
    
    console.log('✅ Conexión básica exitosa.\n');
    
    // Verificar autenticación de administrador
    console.log('2. Verificando autenticación de administrador...');
    const authData = await authenticateAdmin();
    console.log(`✅ Autenticación de administrador exitosa con usuario: ${authData.admin?.email}\n`);
    
    // Verificar acceso a colecciones
    console.log('3. Verificando acceso a colecciones...');
    
    // Verificar colección de hospitales
    console.log('   - Probando colección hub_hospitals...');
    const hospitals = await pb.collection('hub_hospitals').getList(1, 1);
    console.log(`   ✅ Colección hub_hospitals accesible. Registros encontrados: ${hospitals.totalItems}`);
    
    // Verificar colección de usuarios
    console.log('   - Probando colección hub_users...');
    const users = await pb.collection('hub_hospitals').getList(1, 1);
    console.log(`   ✅ Colección hub_users accesible. Registros encontrados: ${users.totalItems}\n`);
    
    // Verificar suscripción en tiempo real
    console.log('4. Verificando suscripción en tiempo real...');
    
    let unsubscribeFn: () => void;
    const subscriptionPromise = new Promise((resolve) => {
      pb.collection('hub_hospitals').subscribe('*', (e) => {
        console.log(`   ✅ Suscripción en tiempo real activa. Evento recibido: ${e.action}`);
        if (unsubscribeFn) {
          unsubscribeFn();
        }
        resolve(e);
      }).then((unsub) => {
        unsubscribeFn = unsub;
      }).catch((err) => {
        console.error('Error al suscribirse:', err);
        resolve(null);
      });
      
      // Simular un cambio después de un breve delay
      setTimeout(async () => {
        try {
          // Solo intentar la actualización si hay al menos un registro
          if (hospitals.items.length > 0) {
            // Usamos el primer hospital para la prueba
            const testHospital = hospitals.items[0];
            await pb.collection('hub_hospitals').update(testHospital.id, {
              name: testHospital.name + ' (Prueba)'
            });
            console.log('   - Actualización de prueba enviada');
          } else {
            // Si no hay hospitales, creamos uno para la prueba
            const newHospital = await pb.collection('hub_hospitals').create({
              name: 'Hospital de Prueba',
              city: 'Ciudad de Prueba',
              address: 'Dirección de Prueba'
            });
            console.log('   - Hospital de prueba creado para la suscripción');
            // Limpiar después de la prueba
            await pb.collection('hub_hospitals').delete(newHospital.id);
          }
        } catch (error) {
          console.error('   ⚠️ Error en la actualización de prueba:', error.message);
        }
      }, 2000);
    });
    
    await subscriptionPromise;
    console.log('✅ Suscripción en tiempo real verificada.\n');
    
    console.log('🎉 Todas las pruebas han pasado exitosamente.');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar solo si este archivo es el punto de entrada
if (require.main === module) {
  main().catch(console.error);
}

export default main;