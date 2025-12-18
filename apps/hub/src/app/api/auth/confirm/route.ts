// CONFIRM EMAIL API - Hub Hospitalario
// Endpoint para verificar email y actualizar usuario en PocketBase

import { NextRequest, NextResponse } from 'next/server'
import { confirmEmail } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token de confirmación requerido' },
        { status: 400 }
      )
    }

    // Use Admin Client to mark user as verified
    try {
      const { createAdminClient } = await import('../../../../lib/pocketbase-admin');
      const pbAdmin = await createAdminClient();

      // In our custom flow, the 'token' is actually the userId
      const userData = await pbAdmin.collection('auth_users').getOne(token);

      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      // Update the user as verified
      const updatedUser = await pbAdmin.collection('auth_users').update(token, {
        verified: true
      });

      return NextResponse.json({
        message: 'Email confirmado exitosamente',
        user: updatedUser
      })

    } catch (pbError: any) {
      console.error('PocketBase confirmation update error:', pbError)
      return NextResponse.json(
        { error: pbError.message || 'Error al actualizar el estado de verificación' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Confirm API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}