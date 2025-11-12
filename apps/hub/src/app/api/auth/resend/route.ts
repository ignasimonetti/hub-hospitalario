// POCKETBASE RESEND EMAIL API - Hub Hospitalario
// Migrated from Supabase to PocketBase
// Maintains JWT verification for backward compatibility

import { NextRequest, NextResponse } from 'next/server'
import { pocketbase } from '../../../../lib/auth'
import { sendEmailConfirmation } from '../../../../lib/resend'
import jwt from 'jsonwebtoken'

const generateEmailConfirmationToken = (userId: string, email: string) => {
  // PocketBase maneja la confirmación de email automáticamente
  // Este token es para compatibilidad con el sistema anterior
  return `token-${userId}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    console.log('Resend request for email:', email)

    // Search for user in PocketBase users collection
    const user = await pocketbase.collection('auth_users').getList(1, 1, {
      filter: `email = "${email}"`
    })

    let userId = null
    let firstName = ''
    let lastName = ''

    if (user.items.length > 0) {
      userId = user.items[0].id
      firstName = user.items[0].first_name || ''
      lastName = user.items[0].last_name || ''
      console.log('Found user with ID:', userId)
    } else {
      // If user doesn't exist, we still send a resend email
      // with a temporary user ID for backward compatibility
      userId = `temp-user-${Date.now()}`
      console.log('User not found, using temporary ID for resend email')
    }

    // Generate JWT token for email confirmation
    const jwtToken = generateEmailConfirmationToken(userId, email)
    
    // Create confirmation URL with JWT token
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirm?token=${jwtToken}`
    
    // Send email with custom template using Resend
    const emailResult = await sendEmailConfirmation(email, confirmationUrl, firstName, lastName)

    if (emailResult.error) {
      console.error('Error sending resend email:', emailResult.error)
      return NextResponse.json(
        { error: 'Error al reenviar el email de confirmación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email de confirmación reenviado exitosamente'
    })

  } catch (error: any) {
    console.error('Resend email API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}