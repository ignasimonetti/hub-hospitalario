// POCKETBASE SIGNUP API - Hub Hospitalario
// Migrated from Supabase to PocketBase with Resend Email Integration

import { NextRequest, NextResponse } from 'next/server'
import { sendEmailConfirmation } from '../../../../lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name } = await request.json()

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, password, first name and last name are required' },
        { status: 400 }
      )
    }

    // Sign up user with PocketBase (using Admin Client to bypass potential API restrictions)
    let data;
    try {
      const { createAdminClient } = await import('../../../../lib/pocketbase-admin');
      const pbAdmin = await createAdminClient();

      const userData = await pbAdmin.collection('auth_users').create({
        email,
        password,
        passwordConfirm: password,
        firstName: first_name,
        lastName: last_name
      });

      data = { user: userData };
    } catch (pbError: any) {
      console.error('PocketBase signup error:', pbError);

      // Handle specific PocketBase error types
      let errorMessage = 'Error al crear la cuenta';
      let statusCode = 400;

      // Check for common PocketBase error patterns
      const errorData = pbError?.response?.data || {};
      const errorMsg = pbError?.message || '';

      if (
        errorMsg.includes('User already registered') ||
        errorData?.email?.message?.includes('already registered') ||
        errorData?.email?.message?.includes('User already exist')
      ) {
        errorMessage = 'Ya existe un usuario con este email';
      } else if (
        errorMsg.includes('Invalid email') ||
        errorData?.email?.message?.includes('Invalid')
      ) {
        errorMessage = 'El formato del email no es válido';
      } else if (
        errorMsg.includes('Password should be at least') ||
        errorData?.password?.message?.includes('min')
      ) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (errorMsg.includes('Connect Timeout')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
        statusCode = 408;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    // Send confirmation email using Resend
    try {
      // @ts-ignore
      const userId = data.user.id;
      const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirm?token=${userId}`;
      await sendEmailConfirmation(email, confirmationUrl, first_name, last_name);
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the signup if email fails, but log it
    }

    return NextResponse.json({
      message: 'Usuario creado exitosamente. Revisa tu email para confirmar tu cuenta.',
      user: data?.user || null
    })

  } catch (error: any) {
    console.error('Signup API error:', error)

    // Handle specific error types
    let errorMessage = 'Error interno del servidor'
    let statusCode = 500

    if (error?.message?.includes('Connect Timeout') || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.'
      statusCode = 408 // Request Timeout
    } else if (error?.message?.includes('User already registered')) {
      errorMessage = 'Ya existe un usuario con este email'
      statusCode = 400
    } else if (error?.message?.includes('Invalid email')) {
      errorMessage = 'El formato del email no es válido'
      statusCode = 400
    } else if (error?.message?.includes('Password')) {
      errorMessage = 'La contraseña no cumple con los requisitos'
      statusCode = 400
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}