import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server'; // Importar la nueva utilidad

export async function POST(request: Request) {
  try {
    const pb = await getServerPocketBase(); // Await getServerPocketBase and move it to the beginning
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Get current user from PocketBase auth store
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas nuevas no coinciden' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to authenticate
    try {
      await pb.collection('auth_users').authWithPassword(
        currentUser.email,
        currentPassword
      );
    } catch (authError: any) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Update password in PocketBase
    const updatedUser = await pb.collection('auth_users').update(currentUser.id, {
      password: newPassword,
      passwordConfirm: newPassword
    });

    // Clear any cached auth data
    pb.authStore.clear();

    return NextResponse.json({
      success: true,
      message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.',
      requiresReauth: true
    });

  } catch (error: any) {
    console.error('Error changing password:', error);

    // Handle specific PocketBase errors
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