import { pocketbase } from '@/lib/auth';
import { PrestadorPerfil, PrestacionPresentacion } from '@/types/prestadores';

/**
 * Obtiene el perfil de prestador del usuario logueado
 */
export async function getPrestadorPerfil(): Promise<PrestadorPerfil | null> {
  try {
    const user = pocketbase.authStore.model;
    if (!user) return null;

    const record = await pocketbase
      .collection('prestadores_perfiles')
      .getFirstListItem<PrestadorPerfil>(`user = "${user.id}"`, {
        requestKey: null, // Desactiva la autocancelación por re-render de React
      });

    return record;
  } catch (error: any) {
    if (error?.status === 404) {
      return null; // Aún no tiene perfil cargado
    }
    if (error?.isAbort || error?.message?.includes('autocancelled')) {
      return null; // Cancelación benigna por desmontaje de componente
    }
    console.error('Error fetching prestador perfil:', error);
    return null;
  }
}

/**
 * Guarda o actualiza el perfil de prestador
 */
export async function savePrestadorPerfil(
  data: Partial<Omit<PrestadorPerfil, 'id' | 'created' | 'updated' | 'user'>>
): Promise<PrestadorPerfil> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error('Usuario no autenticado');

  try {
    const existing = await getPrestadorPerfil();

    if (existing) {
      const updated = await pocketbase
        .collection('prestadores_perfiles')
        .update<PrestadorPerfil>(existing.id, data, {
          requestKey: null,
        });
      return updated;
    } else {
      const created = await pocketbase
        .collection('prestadores_perfiles')
        .create<PrestadorPerfil>(
          {
            ...data,
            user: user.id,
          },
          {
            requestKey: null,
          }
        );
      return created;
    }
  } catch (error: any) {
    console.error('Error saving prestador perfil:', error);
    throw new Error(error?.message || 'Error al guardar el perfil de prestador');
  }
}

/**
 * Genera el próximo número correlativo de trámite con sigla institucional
 * Formato: {SIGLA}-{TIPO}-{AÑO}-{00001} (Ej: CISB-G-2026-00042)
 */
export async function getNextFormNumber(
  serviceType: 'guardia' | 'extension_horaria',
  tenantCode: string = 'CISB'
): Promise<string> {
  const year = new Date().getFullYear();
  const typeCode = serviceType === 'guardia' ? 'G' : 'EH';
  const prefix = `${tenantCode.toUpperCase()}-${typeCode}-${year}`;

  try {
    // Buscar la última presentación creada con este prefijo
    const lastRecords = await pocketbase
      .collection('prestaciones_presentaciones')
      .getList<PrestacionPresentacion>(1, 1, {
        filter: `form_number ~ "${prefix}"`,
        sort: '-created',
        requestKey: null,
      });

    let nextNumber = 1;
    if (lastRecords && lastRecords.items.length > 0) {
      const lastCode = lastRecords.items[0].form_number;
      if (lastCode) {
        const parts = lastCode.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextNumber = lastSeq + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(5, '0');
    return `${prefix}-${paddedNumber}`;
  } catch (error) {
    // Si falla o no existe registro previo, generar con fallback seguro
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-0${randomDigits}`;
  }
}

/**
 * Obtiene las presentaciones del usuario actual para el tenant seleccionado
 */
export async function getMisPrestaciones(tenantId?: string): Promise<PrestacionPresentacion[]> {
  try {
    const user = pocketbase.authStore.model;
    if (!user) return [];

    let filter = `user = "${user.id}"`;
    if (tenantId) {
      filter += ` && tenant = "${tenantId}"`;
    }

    try {
      const records = await pocketbase
        .collection('prestaciones_presentaciones')
        .getFullList<PrestacionPresentacion>({
          filter,
          sort: '-created',
          requestKey: null, // Desactiva la autocancelación por re-render
        });

      return records;
    } catch (innerErr: any) {
      if (innerErr?.isAbort || innerErr?.message?.includes('autocancelled')) return [];
      if (innerErr?.status === 404) return [];

      // Si falla por el filtro de tenant, reintentar solo por usuario
      const records = await pocketbase
        .collection('prestaciones_presentaciones')
        .getFullList<PrestacionPresentacion>({
          filter: `user = "${user.id}"`,
          sort: '-created',
          requestKey: null,
        });

      return records;
    }
  } catch (error: any) {
    if (error?.isAbort || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Error fetching presentaciones:', error);
    return [];
  }
}

/**
 * Envía una nueva presentación de honorarios con archivos PDF
 */
export async function submitPrestacion(
  formData: FormData
): Promise<PrestacionPresentacion> {
  const user = pocketbase.authStore.model;
  if (!user) throw new Error('Usuario no autenticado');

  formData.append('user', user.id);
  formData.append('status', 'pendiente');
  formData.append('submitted_at', new Date().toISOString());

  try {
    const created = await pocketbase
      .collection('prestaciones_presentaciones')
      .create<PrestacionPresentacion>(formData, {
        expand: 'tenant,user',
      });

    return created;
  } catch (error: any) {
    console.error('Error submitting prestacion:', error);
    throw new Error(error?.message || 'Error al enviar la presentación de honorarios');
  }
}

/**
 * Reenvía una presentación que fue previamente observada por Tesorería
 */
export async function resubmitPrestacion(
  id: string,
  formData: FormData
): Promise<PrestacionPresentacion> {
  formData.append('status', 'pendiente');
  formData.append('submitted_at', new Date().toISOString());

  try {
    const updated = await pocketbase
      .collection('prestaciones_presentaciones')
      .update<PrestacionPresentacion>(id, formData, {
        expand: 'tenant,user',
      });

    return updated;
  } catch (error: any) {
    console.error('Error resubmitting prestacion:', error);
    throw new Error(error?.message || 'Error al reenviar la corrección');
  }
}

/**
 * Obtiene la URL completa para previsualizar/descargar un archivo de PocketBase
 */
export function getPrestacionFileUrl(
  record: PrestacionPresentacion,
  filename: string
): string {
  if (!filename) return '';
  return pocketbase.files.getURL(record, filename);
}
