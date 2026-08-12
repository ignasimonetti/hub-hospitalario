import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pocketbase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const pb = await createAdminClient();

    console.log('[reset-password] Received token:', token);

    // 1. Intentar confirmPasswordReset nativo de PocketBase
    try {
      await pb.collection('auth_users').confirmPasswordReset(
        token,
        password,
        confirmPassword
      );
      console.log('[reset-password] PB native confirmPasswordReset SUCCESS');
      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (pbErr: any) {
      console.log('[reset-password] Native confirm failed, attempting custom token resolution...');
    }

    // 2. Si el token es de nuestro formato custom: token-{userId}-{b64Email}-{timestamp}
    if (token && token.startsWith('token-')) {
      const parts = token.split('-');
      const userId = parts[1];
      let userEmail = null;

      if (parts.length >= 4) {
        try {
          userEmail = Buffer.from(parts[2], 'base64url').toString('utf-8');
          console.log('[reset-password] Decoded email:', userEmail);
        } catch (e) {
          console.error('[reset-password] Error decoding email:', e);
        }
      }

      try {
        let userToUpdateId = (userId && userId !== 'unknown') ? userId : null;

        if (!userToUpdateId && userEmail) {
          console.log('[reset-password] Searching user by email:', userEmail);
          try {
            const found = await pb.collection('auth_users').getFirstListItem(`email = "${userEmail}"`);
            if (found) {
              userToUpdateId = found.id;
              console.log('[reset-password] Found user ID:', userToUpdateId);
            }
          } catch (fErr) {
            console.log('[reset-password] Search failed or user not found');
          }
        }

        if (userToUpdateId) {
          console.log('[reset-password] Updating password for user:', userToUpdateId);
          await pb.collection('auth_users').update(userToUpdateId, {
            password: password,
            passwordConfirm: confirmPassword
          });
          console.log('[reset-password] Password update SUCCESS!');
          return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
          });
        }
      } catch (updateErr: any) {
        console.error('[reset-password] Error updating user password:', updateErr?.message || updateErr);
      }
    }

    return NextResponse.json(
      { error: 'No se pudo actualizar la contraseña en PocketBase. Es necesario configurar POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD en .env.local' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
