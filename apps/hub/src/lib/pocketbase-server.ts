import PocketBase from 'pocketbase';
import { cookies } from 'next/headers'; // Para Next.js App Router

export function getServerPocketBase() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar');
  
  // Cargar el almacén de autenticación desde la cookie
  const authCookie = cookies().get('pb_auth');
  if (authCookie) {
    pb.authStore.loadFromCookie(authCookie.toString());
  }
  
  return pb;
}