import PocketBase from 'pocketbase';

async function checkPocketBaseFields() {
  console.log('🔍 Verificando campos en auth_users de PocketBase...\n');

  const pb = new PocketBase('https://pocketbase.manta.com.ar');
  const ADMIN_PASSWORD = 'Millonarios10$';

  try {
    // Autenticar como admin
    console.log('🔑 Autenticando como administrador...');
    await pb.admins.authWithPassword('ignaciosimonetti1984@gmail.com', ADMIN_PASSWORD);
    console.log('✅ Autenticación exitosa!\n');

    // Obtener esquema de la colección auth_users
    console.log('📋 Obteniendo esquema de auth_users...');
    const collection = await pb.collections.getOne('auth_users');
    const schema = collection.schema || [];

    console.log(`📊 Se encontraron ${schema.length} campos:`);
    console.log('=' .repeat(50));

    schema.forEach((field, index) => {
      const required = field.required ? '✅' : '❌';
      const type = field.type || 'unknown';
      console.log(`${index + 1}. ${required} ${field.name} (${type})`);
      if (field.options?.helpText) {
        console.log(`   💡 ${field.options.helpText}`);
      }
      if (field.options?.pattern) {
        console.log(`   🔍 Validación: ${field.options.pattern}`);
      }
    });

    // Verificar campos esperados
    const expectedFields = ['dni', 'phone'];
    const existingFields = schema.map(f => f.name);
    
    console.log('\n🎯 ANÁLISIS DE MIGRACIÓN:');
    console.log('=' .repeat(50));
    
    const present = expectedFields.filter(field => existingFields.includes(field));
    const missing = expectedFields.filter(field => !existingFields.includes(field));
    
    console.log(`✅ Campos presentes: ${present.join(', ') || 'Ninguno'}`);
    console.log(`❌ Campos faltantes: ${missing.join(', ') || 'Ninguno'}`);
    
    const progress = Math.round((present.length / expectedFields.length) * 100);
    console.log(`📈 Progreso: ${progress}%`);
    
    if (missing.length === 0) {
      console.log('\n🎉 ¡MIGRACIÓN COMPLETA! Todos los campos están presentes.');
    } else {
      console.log(`\n⚠️ Se necesitan ${missing.length} campos adicionales.`);
      console.log('📝 Campos que faltan:');
      missing.forEach(field => {
        console.log(`   • ${field}`);
      });
    }
    
    // Obtener API Rules si es posible
    try {
      const collectionInfo = await pb.collection('auth_users').get();
      console.log('\n🔧 API RULES STATUS:');
      console.log('=' .repeat(30));
      console.log('✅ Colección accesible para verificación');
      
      // Intentar obtener reglas (esto puede fallar según permisos)
      if (collectionInfo.type === 'auth') {
        console.log('✅ Tipo: auth (colección de autenticación)');
      }
      
    } catch (rulesError) {
      console.log('\n⚠️ No se pudo verificar API Rules directamente');
      console.log('💡 Verifica manualmente en Admin UI que las reglas estén configuradas');
    }
    
    return {
      total: schema.length,
      expected: expectedFields.length,
      present: present.length,
      missing: missing,
      fields: existingFields
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message?.includes('Invalid login credentials')) {
      console.log('\n🔧 Solución: Verificar credenciales de administrador');
      console.log('   Usuario: admin@cisb.com');
      console.log('   Contraseña: Usar la contraseña correcta');
    }
    
    return { error: error.message };
  }
}

// Ejecutar verificación
checkPocketBaseFields().then(result => {
  console.log('\n📋 Resultado:', result);
  process.exit(0);
}).catch(error => {
  console.error('💥 Error ejecutando verificación:', error);
  process.exit(1);
});