import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server'; // Importar la nueva utilidad

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      dni, 
      phone, 
      currentPassword, 
      newPassword, 
      confirmPassword 
    } = body;

    // Obtener la instancia de PocketBase configurada para el servidor
    const pb = getServerPocketBase();

    // Get current user from PocketBase auth store
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Validar cambio de contraseña si se proporciona
    if (newPassword) {
      if (!currentPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'Para cambiar la contraseña, complete todos los campos' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: 'Las contraseñas nuevas no coinciden' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      // Verificar contraseña actual
      try {
        await pb.collection('auth_users').authWithPassword(
          currentUser.email,
          currentPassword
        );
      } catch (authError) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }
    }

    // Validar campos de perfil personal
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son requeridos' },
        { status: 400 }
      );
    }

    // Validar DNI (obligatorio)
    if (!dni) {
      return NextResponse.json(
        { error: 'El DNI es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de DNI (7-8 dígitos numéricos)
    const dniRegex = /^[0-9]{7,8}$/;
    if (!dniRegex.test(dni.replace(/\./g, ''))) {
      return NextResponse.json(
        { error: 'El DNI debe contener entre 7 y 8 dígitos numéricos' },
        { status: 400 }
      );
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar teléfono si se proporciona
    if (phone) {
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Formato de teléfono inválido' },
          { status: 400 }
        );
      }
    }

    // Construir objeto de actualización
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      dni: dni.replace(/\./g, '').trim(), // Almacenar sin puntos
      emailVisibility: true // Make email visible for profile purposes
    };

    // Agregar teléfono si se proporciona
    if (phone && phone.trim()) {
      updateData.phone = phone.trim();
    }

    // Cambiar contraseña si se proporciona
    if (newPassword) {
      updateData.password = newPassword;
    }

    // Update user profile in PocketBase
    const updatedUser = await pb.collection('auth_users').update(
      currentUser.id, 
      updateData
    );

    // Si se cambió la contraseña, cerrar sesión y reautenticar
    if (newPassword) {
      pb.authStore.clear();
      try {
        await pb.collection('auth_users').authWithPassword(
          email.trim().toLowerCase(),
          newPassword
        );
      } catch (reAuthError) {
        // Si no se puede reautenticar, cerrar sesión
        console.warn('No se pudo reautenticar después del cambio de contraseña');
      }
    }

    // Obtener información completa del usuario actualizado
    const userProfile = await pb.collection('auth_users').getOne(currentUser.id);
    
    return NextResponse.json({
      success: true,
      message: newPassword ? 
        'Perfil y contraseña actualizados exitosamente' : 
        'Perfil actualizado exitosamente',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        dni: userProfile.dni,
        phone: userProfile.phone || null,
        updated: userProfile.updated
      }
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);

    // Handle specific PocketBase errors
    if (error.response?.data?.message) {
      return NextResponse.json(
        { error: error.response.data.message },
        { status: error.response.status || 400 }
      );
    }

    // Handle duplicate key errors (email, DNI)
    if (error.response?.data?.code === 400 && 
        error.response?.data?.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'El email o DNI ya están en uso por otro usuario' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}