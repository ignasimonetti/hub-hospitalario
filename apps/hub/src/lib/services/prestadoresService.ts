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
      .getFirstListItem<PrestadorPerfil>(`user = "${user.id}"`);

    return record;
  } catch (error: any) {
    if (error?.status === 404) {
      return null; // Aún no tiene perfil cargado
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
        .update<PrestadorPerfil>(existing.id, data);
      return updated;
    } else {
      const created = await pocketbase
        .collection('prestadores_perfiles')
        .create<PrestadorPerfil>({
          ...data,
          user: user.id,
        });
      return created;
    }
  } catch (error: any) {
    console.error('Error saving prestador perfil:', error);
    throw new Error(error?.message || 'Error al guardar el perfil de prestador');
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

    const records = await pocketbase
      .collection('prestaciones_presentaciones')
      .getFullList<PrestacionPresentacion>({
        filter,
        sort: '-created',
        expand: 'tenant,user',
      });

    return records;
  } catch (error: any) {
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
