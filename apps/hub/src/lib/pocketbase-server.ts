import PocketBase from 'pocketbase';
import { cookies } from 'next/headers'; // Para Next.js App Router

export async function getServerPocketBase() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar');

  // Cargar el almacén de autenticación desde la cookie
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  console.log('[getServerPocketBase] Cookie found:', !!authCookie);

  if (authCookie) {
    try {
      pb.authStore.loadFromCookie(`${authCookie.name}=${authCookie.value}`);
      console.log('[getServerPocketBase] Auth loaded. Valid:', pb.authStore.isValid, 'User:', pb.authStore.model?.id);
    } catch (e) {
      console.error('[getServerPocketBase] Error loading auth from cookie:', e);
    }
  } else {
    console.log('[getServerPocketBase] No pb_auth cookie found');
  }

  return pb;
}