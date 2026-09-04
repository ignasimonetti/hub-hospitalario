import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pocketbase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || undefined;

    const pb = await createAdminClient();

    // 1. Obtener los roles de director (coordinador, adjunto o general)
    const roles = await pb.collection('hub_roles').getFullList({
      filter: 'slug = "director_adjunto" || slug = "director_coordinador" || slug = "director" || name ~ "Director" || name ~ "director"',
      requestKey: null,
    });

    if (roles.length === 0) {
      return NextResponse.json({ directores: [] });
    }

    const roleIds = roles.map((r) => `role = "${r.id}"`).join(' || ');
    let filter = `(${roleIds})`;
    if (tenantId) {
      filter += ` && (tenant = "${tenantId}" || tenant = "" || tenant = null)`;
    }

    // 2. Obtener las asignaciones de roles expandiendo user y role con adminPB
    const userRoles = await pb.collection('hub_user_roles').getFullList({
      filter: filter,
      expand: 'user,role',
      requestKey: null,
    });

    const directoresMap = new Map<string, { id: string; nombre: string; email: string; rol?: string }>();

    for (const ur of userRoles) {
      const u = (ur as any).expand?.user;
      const r = (ur as any).expand?.role;
      if (u && !directoresMap.has(u.id)) {
        const rolSlug = (r?.slug || '').toLowerCase();
        const rolName = (r?.name || '').toLowerCase();
        
        let rolLabel = 'Dir. Adjunto';
        if (rolSlug === 'director_coordinador' || rolName.includes('coordinador')) {
          rolLabel = 'Dir. Coordinador';
        } else if (rolSlug === 'director_adjunto' || rolName.includes('adjunto')) {
          rolLabel = 'Dir. Adjunto';
        } else {
          rolLabel = r?.name || 'Dirección';
        }

        directoresMap.set(u.id, {
          id: u.id,
          nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          rol: rolLabel,
        });
      }
    }

    return NextResponse.json({ directores: Array.from(directoresMap.values()) });
  } catch (error: any) {
    console.error('Error fetching directores in API route:', error);
    return NextResponse.json({ error: error?.message || 'Error al obtener directores' }, { status: 500 });
  }
}
