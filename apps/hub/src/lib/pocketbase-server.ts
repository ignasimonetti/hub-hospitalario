import PocketBase from 'pocketbase';
import { cookies, headers } from 'next/headers';

export async function getServerPocketBase() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar');

  // 1. Intentar cargar desde la cookie pb_auth
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (authCookie) {
    try {
      pb.authStore.loadFromCookie(`${authCookie.name}=${authCookie.value}`);
    } catch (e) {
      console.error('[getServerPocketBase] Error loading auth from cookie:', e);
    }
  }

  // 2. Si no es válido desde la cookie, intentar desde el Header Authorization (Bearer <token>)
  if (!pb.authStore.isValid) {
    try {
      const headerList = await headers();
      const authHeader = headerList.get('authorization') || headerList.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        pb.authStore.save(token, null);
        // Validar token cargando el registro del usuario
        try {
          const authData = await pb.collection('auth_users').authRefresh();
          pb.authStore.save(authData.token, authData.record);
        } catch {
          // Si authRefresh falla, continuar con token o fallback
        }
      }
    } catch (e) {
      console.error('[getServerPocketBase] Error checking Authorization header:', e);
    }
  }

  return pb;
}