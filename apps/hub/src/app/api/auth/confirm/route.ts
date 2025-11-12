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

    // Use our confirmEmail function to update user verified status
    const { data, error } = await confirmEmail(token)

    if (error) {
      console.error('Email confirmation error:', error)
      return NextResponse.json(
        { error: (error as any).message || 'Error al confirmar email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Email confirmado exitosamente',
      user: data?.user || null
    })

  } catch (error: any) {
    console.error('Confirm API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}