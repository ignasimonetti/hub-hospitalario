#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN AUTOMATIZADA - HUB HOSPITALARIO
 * Aplicar campos de perfil extendidos en PocketBase
 * 
 * Ejecución:
 * node scripts/migrate-profile-fields.js
 */

const PocketBase = require('pocketbase');

// Configuración
const POCKETBASE_URL = 'https://pocketbase.manta.com.ar';
const ADMIN_EMAIL = 'admin@cisb.com'; // Necesitamos credenciales de admin
const ADMIN_PASSWORD = ''; // Contraseña de admin (se solicitará)

class ProfileMigration {
  constructor() {
    this.pb = new PocketBase(POCKETBASE_URL);
    this.admin = null;
    this.migrationLog = [];
  }

  // Iniciar sesión como administrador
  async authenticateAdmin() {
    try {
      console.log('🔑 Autenticando como administrador...');
      const authData = await this.pb.admins.authWithPassword(
        ADMIN_EMAIL, 
        ADMIN_PASSWORD
      );
      this.admin = authData;
      console.log('✅ Autenticación exitosa');
      this.log('ADMIN_AUTH_SUCCESS', 'Autenticación de administrador exitosa');
    } catch (error) {
      console.error('❌ Error de autenticación:', error.message);
      throw new Error('No se pudo autenticar como administrador. Verifique las credenciales.');
    }
  }

  // Verificar si ya existe un campo
  async fieldExists(fieldName) {
    try {
      const schema = await this.pb.collection('auth_users').getSchema();
      return schema.some(field => field.name === fieldName);
    } catch (error) {
      console.warn(`⚠️ No se pudo verificar el campo ${fieldName}:`, error.message);
      return false;
    }
  }

  // Agregar un campo a la colección auth_users
  async addField(fieldConfig) {
    try {
      const { name, type, required = false, options = {}, validation = '', helpText = '' } = fieldConfig;
      
      if (await this.fieldExists(name)) {
        console.log(`ℹ️ Campo '${name}' ya existe, saltando...`);
        this.log('FIELD_SKIPPED', `Campo '${name}' ya existe`);
        return;
      }

      console.log(`📝 Creando campo '${name}' (${type})...`);
      
      // Crear el campo usando la API de PocketBase
      await this.pb.collection('auth_users').createField({
        name,
        type,
        required,
        options,
        ...(validation && { validation }),
        ...(helpText && { helpText })
      });

      console.log(`✅ Campo '${name}' creado exitosamente`);
      this.log('FIELD_CREATED', `Campo '${name}' creado exitosamente`);
      
    } catch (error) {
      console.error(`❌ Error creando campo '${fieldConfig.name}':`, error.message);
      this.log('FIELD_ERROR', `Error creando campo '${fieldConfig.name}': ${error.message}`);
      throw error;
    }
  }

  // Configurar API Rules para la colección
  async configureAPIRules() {
    try {
      console.log('🔧 Configurando API Rules...');
      
      const rules = {
        list: '@request.auth.id != ""',
        view: '@request.auth.id = @collection.id',
        create: '@request.auth.id != ""',
        update: '@request.auth.id = @collection.id || @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"',
        delete: '@request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"'
      };

      // Nota: En la práctica, esto se haría desde el Admin UI de PocketBase
      // ya que la API REST no permite modificar rules directamente
      console.log('ℹ️ API Rules que deben configurarse manualmente:');
      Object.entries(rules).forEach(([action, rule]) => {
        console.log(`  ${action}: ${rule}`);
      });
      
      this.log('API_RULES_CONFIGURED', 'API Rules documentadas para configuración manual');
      
    } catch (error) {
      console.error('❌ Error configurando API Rules:', error.message);
      this.log('API_RULES_ERROR', `Error configurando API Rules: ${error.message}`);
    }
  }

  // Verificar la migración
  async verifyMigration() {
    try {
      console.log('🔍 Verificando migración...');
      
      const schema = await this.pb.collection('auth_users').getSchema();
      const createdFields = schema.filter(field => 
        ['dni', 'phone', 'professional_id', 'specialty', 'department', 'position'].includes(field.name)
      );

      console.log(`✅ Campos encontrados: ${createdFields.length}/6`);
      createdFields.forEach(field => {
        console.log(`  ✓ ${field.name} (${field.type})`);
      });

      this.log('MIGRATION_VERIFIED', `Verificación completa: ${createdFields.length} campos creados`);

      if (createdFields.length < 6) {
        throw new Error(`Migración incompleta: solo ${createdFields.length} campos creados de 6 esperados`);
      }

    } catch (error) {
      console.error('❌ Error en verificación:', error.message);
      this.log('VERIFICATION_ERROR', `Error en verificación: ${error.message}`);
      throw error;
    }
  }

  // Log de migración
  log(action, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      message
    };
    this.migrationLog.push(logEntry);
    console.log(`📝 [${action}] ${message}`);
  }

  // Ejecutar migración completa
  async runMigration() {
    try {
      console.log('🚀 INICIANDO MIGRACIÓN DE PERFIL HOSPITALARIO');
      console.log('=' .repeat(60));
      
      // Autenticar
      await this.authenticateAdmin();
      
      // Campos a crear
      const fields = [
        {
          name: 'dni',
          type: 'text',
          required: true,
          validation: 'regex("^[0-9]{7,8}$")',
          helpText: 'DNI de 7-8 dígitos numéricos',
          options: { min: 0, max: 255 }
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
          validation: 'regex("^[+]?[0-9\\s\\-\\(\\)]{10,}$")',
          helpText: 'Formato de teléfono argentino',
          options: { min: 0, max: 255 }
        },
        {
          name: 'professional_id',
          type: 'text',
          required: false,
          validation: 'regex("^[A-Z0-9\\-]{5,20}$")',
          helpText: 'Matrícula profesional (MP, MNO, etc.)',
          options: { min: 0, max: 50 }
        },
        {
          name: 'specialty',
          type: 'select',
          required: false,
          options: {
            values: [
              'Medicina General',
              'Cardiología',
              'Neurología',
              'Pediatría',
              'Ginecología',
              'Traumatología',
              'Medicina Interna',
              'Medicina de Urgencias',
              'Anestesiología',
              'Radiología',
              'Laboratorio',
              'Farmacia',
              'Enfermería',
              'Técnico en Radiología',
              'Técnico en Laboratorio',
              'Administración Hospitalaria',
              'Servicios Generales',
              'Otro'
            ]
          },
          helpText: 'Especialidad médica o profesional'
        },
        {
          name: 'department',
          type: 'text',
          required: false,
          validation: 'regex("^[A-Za-záéíóúñÑ\\s]{2,50}$")',
          helpText: 'Departamento del hospital',
          options: { min: 0, max: 100 }
        },
        {
          name: 'position',
          type: 'select',
          required: false,
          options: {
            values: [
              'Jefe de Servicio',
              'Médico Senior',
              'Médico Residente',
              'Enfermero/a',
              'Técnico',
              'Administrativo',
              'Servicios Generales',
              'Otro'
            ]
          },
          helpText: 'Cargo o posición en el hospital'
        }
      ];

      // Crear campos
      for (const field of fields) {
        await this.addField(field);
      }

      // Configurar API Rules
      await this.configureAPIRules();
      
      // Verificar
      await this.verifyMigration();

      console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
      console.log('=' .repeat(60));
      
      // Guardar log
      await this.saveMigrationLog();
      
      return {
        success: true,
        fieldsCreated: fields.length,
        log: this.migrationLog
      };

    } catch (error) {
      console.error('\n💥 MIGRACIÓN FALLIDA');
      console.error('=' .repeat(60));
      console.error(`Error: ${error.message}`);
      
      this.log('MIGRATION_FAILED', `Migración falló: ${error.message}`);
      await this.saveMigrationLog();
      
      return {
        success: false,
        error: error.message,
        log: this.migrationLog
      };
    }
  }

  // Guardar log de migración
  async saveMigrationLog() {
    const fs = require('fs');
    const path = require('path');
    
    const logPath = path.join(__dirname, '../logs/migration-profile-log.json');
    
    // Crear directorio si no existe
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logData = {
      timestamp: new Date().toISOString(),
      pocketbaseUrl: POCKETBASE_URL,
      adminEmail: ADMIN_EMAIL,
      success: this.migrationLog.some(log => log.action === 'MIGRATION_VERIFIED'),
      logs: this.migrationLog
    };
    
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`📄 Log guardado en: ${logPath}`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  // Solicitar contraseña de admin
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🔑 Ingrese la contraseña de administrador: ', async (password) => {
    rl.close();
    
    // Configurar contraseña
    global.ADMIN_PASSWORD = password;
    
    const migration = new ProfileMigration();
    const result = await migration.runMigration();
    
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = ProfileMigration;