
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
        emailVisibility: userProfile.emailVisibility,
        created: userProfile.created,
        updated: userProfile.updated
      }
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);

    if (error.response?.data?.message) {
      return NextResponse.json(
        { error: error.response.data.message },
        { status: error.response.status || 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}