/**
 * Validación y verificación de variables de entorno críticas en arranque del sistema.
 * En producción (NODE_ENV === 'production'), el proceso falla inmediatamente si alguna
 * variable obligatoria falta o se encuentra vacía.
 */

interface EnvRequirement {
  key: string;
  description: string;
  isSecret?: boolean;
}

const REQUIRED_SERVER_ENV: EnvRequirement[] = [
  { key: 'NEXT_PUBLIC_POCKETBASE_URL', description: 'URL del servidor PocketBase' },
  { key: 'POCKETBASE_ADMIN_EMAIL', description: 'Email del Administrador / Superuser de PocketBase' },
  { key: 'POCKETBASE_ADMIN_PASSWORD', description: 'Contraseña del Administrador de PocketBase', isSecret: true },
  { key: 'RESEND_API_KEY', description: 'Clave de API de Resend para envío de correos', isSecret: true },
  { key: 'JWT_SECRET', description: 'Secreto para la firma criptográfica de tokens JWT', isSecret: true },
];

let hasValidated = false;

export function validateServerEnv(): void {
  if (hasValidated) return;
  hasValidated = true;

  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  for (const item of REQUIRED_SERVER_ENV) {
    const value = process.env[item.key];
    if (!value || value.trim() === '') {
      missing.push(`• ${item.key}: ${item.description}`);
    }
  }

  if (missing.length > 0) {
    const errorBanner = [
      '==============================================================================',
      '🚨 ERROR CRÍTICO: VARIABLES DE ENTORNO FALTANTES O NO CONFIGURADAS',
      '==============================================================================',
      ...missing,
      '------------------------------------------------------------------------------',
      'Por favor configure las variables requeridas en su entorno o en .env.local',
      'Consulte .env.example para ver los nombres y formatos requeridos.',
      '==============================================================================',
    ].join('\n');

    if (isProduction) {
      console.error(errorBanner);
      throw new Error(
        `Faltan ${missing.length} variable(s) de entorno obligatoria(s) en producción: ${missing.map((m) => m.split(':')[0].replace('• ', '')).join(', ')}`
      );
    } else {
      console.warn(
        `⚠️ [AVISO DE DESARROLLO LOCAL] Las siguientes variables no están configuradas:\n${missing.join('\n')}`
      );
    }
  }
}
