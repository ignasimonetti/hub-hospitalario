import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, pocketbase } from '../../../../lib/auth'
import { sendPasswordResetEmail } from '../../../../lib/resend'

const generateEmailConfirmationToken = (userId: string, email: string) => {
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

    console.log('Password reset request for email:', email)

    // Search for user in PocketBase users collection
    const user = await pocketbase.collection('auth_users').getList(1, 1, {
      filter: `email = "${email}"`
    })

    let userId = null
    let firstName = ''

    if (user.items.length > 0) {
      userId = user.items[0].id
      firstName = user.items[0].first_name || ''
      console.log('Found user with ID:', userId)
    } else {
      // For security, we don't reveal if user exists or not
      // but we still process the request to prevent enumeration
      console.log('User not found, but processing request for security')
    }

    // Generate reset token
    const resetToken = generateEmailConfirmationToken(userId || 'unknown', email)
    
    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    
    // Send password reset email using Resend
    try {
      await sendPasswordResetEmail(email, resetUrl, firstName)
      console.log('Password reset email sent successfully')
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      return NextResponse.json(
        { error: 'Error al enviar el email de recuperación' },
        { status: 500 }
      )
    }

    // Also trigger PocketBase password reset for additional security
    if (user.items.length > 0) {
      try {
        await resetPassword(email)
      } catch (pbError) {
        console.error('PocketBase password reset error:', pbError)
        // Don't fail the request if PocketBase reset fails
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