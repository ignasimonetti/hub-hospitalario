// RESEND EMAIL CONFIGURATION - Hub Hospitalario
// Local configuration for Resend email service

import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || 're_123456789';

const resend = new Resend(resendApiKey)

export async function sendEmailConfirmation(email: string, confirmationUrl: string, firstName: string = '', lastName: string = '') {
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : '';
  const greetingName = fullName || 'Usuario';

  // Debug logs for Resend troubleshooting
  const isDefaultKey = resendApiKey === 're_123456789';
  console.log(`[Resend] Attempting to send confirmation email to: ${email}`);
  console.log(`[Resend] Using default build key? ${isDefaultKey}`);
  if (!isDefaultKey && resendApiKey) {
    console.log(`[Resend] Configured Key Prefix: ${resendApiKey.substring(0, 3)}...`);
  }

  // Fix: Since (auth) is a route group, the correct URL is /confirm not /auth/confirm
  const correctedUrl = confirmationUrl.replace('/auth/confirm', '/confirm');

  console.log(`[Resend] Confirmation URL: ${correctedUrl}`);

  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: `¡Bienvenido/a ${greetingName}! - Confirma tu cuenta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">¡Bienvenido/a al Hub Hospitalario!</h1>
        <p>Hola ${greetingName},</p>
        <p>¡Gracias por unirte a nuestro sistema de gestión hospitalaria!</p>
        <p>Para completar tu registro y comenzar a usar todas las funcionalidades del sistema, necesitas confirmar tu dirección de email haciendo clic en el botón de abajo.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${correctedUrl}"
             style="background-color: #1e40af; color: white; padding: 15px 30px;
                    text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            ✓ Confirmar Email
          </a>
        </div>
        <p><strong>¿Qué podrás hacer una vez confirmado tu email?</strong></p>
        <ul>
          <li>Gestionar pacientes y expedientes médicos</li>
          <li>Acceder a reportes y estadísticas hospitalarias</li>
          <li>Comunicarte con otros miembros del equipo médico</li>
          <li>Administrar turnos y agendas</li>
        </ul>
        <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>🔒 Seguridad:</strong> Si no solicitaste esta cuenta, puedes ignorar este email de forma segura.
        </p>
        <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Hub Hospitalario - Sistema de Gestión Hospitalaria</strong><br>
          Ministerio de Salud de Santiago del Estero
        </p>
      </div>
    `
  })
}

export async function sendWelcomeEmail(email: string, userName: string) {
  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: '¡Tu cuenta ha sido confirmada - Hub Hospitalario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">¡Cuenta Confirmada!</h1>
        <p>Hola ${userName},</p>
        <p>¡Excelente! Tu cuenta en el Hub Hospitalario ha sido confirmada exitosamente.</p>
        <p>Ahora puedes acceder a todas las funcionalidades del sistema:</p>
        <ul>
          <li>Gestión de pacientes</li>
          <li>Reportes médicos</li>
          <li>Panel de administración</li>
          <li>Comunicación entre equipos</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard"
             style="background-color: #1e40af; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Ir al Dashboard
          </a>
        </div>
        <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Si tienes alguna pregunta, contacta al equipo de soporte.<br>
          Hub Hospitalario - Sistema de Gestión Hospitalaria
        </p>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, firstName: string = '') {
  const greetingName = firstName || 'Usuario';

  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Recuperación de contraseña - Hub Hospitalario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Recuperación de Contraseña</h1>
        <p>Hola ${greetingName},</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Hub Hospitalario.</p>
        <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc2626; color: white; padding: 15px 30px;
                    text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            🔒 Restablecer Contraseña
          </a>
        </div>
        <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <strong>⚠️ Importante:</strong> Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña permanecerá sin cambios.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Hub Hospitalario - Sistema de Gestión Hospitalaria</strong><br>
          Ministerio de Salud de Santiago del Estero
        </p>
      </div>
    `
  })
}