import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '../../../../lib/auth'
import { createAdminClient } from '../../../../lib/pocketbase-admin'
import { sendPasswordResetEmail } from '../../../../lib/resend'

const generateEmailConfirmationToken = (userId: string, email: string) => {
  const b64Email = Buffer.from(email).toString('base64url')
  return `token-${userId}-${b64Email}-${Date.now()}`
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

    console.log('Password reset request for email:', email)

    // Usar Admin Client para bypass de reglas de PocketBase al buscar usuario
    let pbAdmin;
    let userItems: any[] = [];
    try {
      pbAdmin = await createAdminClient();
      const userRes = await pbAdmin.collection('auth_users').getList(1, 1, {
        filter: `email = "${email}"`
      });
      userItems = userRes.items;
    } catch (pbAdminErr) {
      console.warn('[forgot-password] Admin client fetch failed, falling back to public query:', pbAdminErr);
    }

    let userId = null
    let firstName = ''

    if (userItems.length > 0) {
      userId = userItems[0].id
      firstName = userItems[0].firstName || userItems[0].first_name || ''
      console.log('Found user with ID:', userId)
    } else {
      console.log('User not found, but processing request for security')
    }

    // Generate reset token
    const resetToken = generateEmailConfirmationToken(userId || 'unknown', email)
    
    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    
    // Send password reset email using Resend
    try {
      await sendPasswordResetEmail(email, resetUrl, firstName)
      console.log('Password reset email sent successfully via Resend')
    } catch (emailError) {
      console.error('Error sending password reset email via Resend:', emailError)
      return NextResponse.json(
        { error: 'Error al enviar el email de recuperación' },
        { status: 500 }
      )
    }

    // Also trigger PocketBase password reset if admin client is available
    if (userItems.length > 0) {
      try {
        await resetPassword(email)
      } catch (pbError) {
        console.error('PocketBase password reset error:', pbError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email de recuperación enviado exitosamente'
    })

  } catch (error: any) {
    console.error('Forgot password API error:', error)
    
    // Handle specific error types
    let errorMessage = 'Error interno del servidor'
    let statusCode = 500
    
    if (error?.message?.includes('Connect Timeout') || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.'
      statusCode = 408 // Request Timeout
    } else if (error?.message?.includes('User not found')) {
      errorMessage = 'No encontramos una cuenta con este email'
      statusCode = 400
    } else if (error?.message?.includes('Invalid email')) {
      errorMessage = 'El formato del email no es válido'
      statusCode = 400
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}