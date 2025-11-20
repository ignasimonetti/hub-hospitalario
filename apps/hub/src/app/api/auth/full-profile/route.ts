
import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server'; // Importar la nueva utilidad

export async function GET(request: NextRequest) {
  try {
    // Obtener la instancia de PocketBase configurada para el servidor
    const pb = await getServerPocketBase();

    // Get current user from PocketBase auth store
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Get complete user profile from PocketBase
    const userProfile = await pb.collection('auth_users').getOne(currentUser.id);

    // Get user roles with expanded tenant and role information
    const userRoles = await pb.collection('hub_user_roles').getList(1, 100, {
      filter: `user = "${currentUser.id}"`,
      expand: 'role,tenant'
    });

    // Transform user roles to include expanded data
    const expandedUserRoles = userRoles.items.map(item => ({
      id: item.id,
      roleId: item.role,
      tenantId: item.tenant,
      assignedAt: item.created,
      role: item.expand?.role ? {
        id: item.expand.role.id,
        name: item.expand.role.name,
        description: item.expand.role.description,
        level: item.expand.role.level
      } : null,
      tenant: item.expand?.tenant ? {
        id: item.expand.tenant.id,
        name: item.expand.tenant.name,
        code: item.expand.tenant.code,
        address: item.expand.tenant.address,
        phone: item.expand.tenant.phone,
        active: item.expand.tenant.active
      } : null
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName || userProfile.first_name,
        lastName: userProfile.lastName || userProfile.last_name,
        dni: userProfile.dni || null,
        phone: userProfile.phone || null,
        professional_id: userProfile.professional_id || null,
        specialty: userProfile.specialty || null,
        department: userProfile.department || null,
        position: userProfile.position || null,
        verified: userProfile.verified,
        created: userProfile.created,
        updated: userProfile.updated
      },
      hospitals: expandedUserRoles.filter(ur => ur.tenant).map(ur => ur.tenant),
      userRoles: expandedUserRoles
    });

  } catch (error: any) {
    console.error('Error fetching full user profile:', error);

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}