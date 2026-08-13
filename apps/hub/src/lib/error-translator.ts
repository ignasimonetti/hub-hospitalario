/**
 * Diccionario centralizado de traducción de errores de PocketBase al español.
 * Cualquier error que llegue desde el backend pasa por aquí antes de mostrarse al usuario.
 */

const ERROR_MAP: [RegExp, string][] = [
  // Autenticación
  [/failed to authenticate/i, "Email o contraseña incorrectos"],
  [/invalid login credentials/i, "Email o contraseña incorrectos"],
  [/invalid record/i, "Email o contraseña incorrectos"],
  [/something went wrong while processing your request/i, "Email o contraseña incorrectos"],
  [/email not confirmed/i, "Debes confirmar tu correo electrónico antes de iniciar sesión"],
  [/not verified/i, "Tu cuenta aún no ha sido verificada"],
  [/user not found/i, "No existe una cuenta registrada con este correo"],
  [/record does not exist/i, "No se encontró el registro solicitado"],
  [/too many requests/i, "Demasiados intentos fallidos. Intenta nuevamente más tarde"],

  // Red / Conexión
  [/failed to fetch/i, "No se pudo conectar con el servidor. Revisa tu conexión a internet"],
  [/networkerror/i, "Error de red. Verifica tu conexión e intenta de nuevo"],
  [/timeout/i, "La solicitud tardó demasiado. Intenta de nuevo"],
  [/abort/i, "La solicitud fue cancelada"],

  // Validación de campos
  [/must be unique/i, "Este valor ya está en uso por otro registro"],
  [/must not be empty/i, "Este campo no puede estar vacío"],
  [/must be a valid email/i, "Ingresa un correo electrónico válido"],
  [/must be at least/i, "El valor ingresado es demasiado corto"],
  [/cannot be less than/i, "El valor ingresado es demasiado bajo"],
  [/password.*length/i, "La contraseña debe tener al menos 6 caracteres"],

  // Permisos
  [/not allowed/i, "No tienes permisos para realizar esta acción"],
  [/unauthorized/i, "Tu sesión ha expirado. Inicia sesión nuevamente"],
  [/forbidden/i, "Acceso denegado"],

  // Archivos
  [/file too large/i, "El archivo es demasiado grande"],
  [/unsupported file type/i, "Tipo de archivo no soportado"],

  // Admin
  [/failed to authenticate as admin/i, "Error de autenticación del servidor. Contacta al administrador"],
];

/**
 * Traduce un mensaje de error de PocketBase o de red al español.
 * Si no se encuentra una traducción específica, devuelve el fallback proporcionado.
 *
 * @param rawMessage - Mensaje original del error (en inglés, normalmente de PocketBase SDK).
 * @param fallback - Mensaje por defecto si no hay traducción. Default: "Ocurrió un error inesperado".
 * @returns Mensaje traducido al español.
 */
export function translateError(rawMessage: string | undefined | null, fallback = "Ocurrió un error inesperado"): string {
  if (!rawMessage) return fallback;

  for (const [pattern, translation] of ERROR_MAP) {
    if (pattern.test(rawMessage)) {
      return translation;
    }
  }

  // Si el mensaje parece ser una URL interna o contiene stacktrace, ocultar detalles técnicos
  if (rawMessage.includes("http") || rawMessage.includes("Error:") || rawMessage.length > 200) {
    return fallback;
  }

  return rawMessage;
}
