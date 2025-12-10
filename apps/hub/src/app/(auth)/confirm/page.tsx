// POCKETBASE CONFIRM EMAIL PAGE - Hub Hospitalario
// Migrated from Supabase to PocketBase

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { confirmEmail } from '../../../lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function ConfirmEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmEmailAddress = async () => {
      try {
        // Show loading state first
        setStatus('loading')
        setMessage('Procesando tu confirmación...')

        // Get token from URL
        const token = searchParams.get('token')

        if (!token) {
          setStatus('error')
          setMessage('Token de confirmación inválido o faltante.')
          return
        }

        // Use our custom confirmEmail function that handles JWT tokens
        const { data, error } = await confirmEmail(token)

        if (error) {
          console.error('Email verification error:', error)
          setStatus('error')
          const errorMessage = (error as any).message || 'Error desconocido'
          if (errorMessage.includes('expirado')) {
            setMessage('El token ha expirado. Solicita un nuevo email de confirmación.')
          } else if (errorMessage.includes('inválido')) {
            setMessage('Token inválido. Solicita un nuevo email de confirmación.')
          } else if (errorMessage.includes('malformado')) {
            setMessage('Token malformado. Solicita un nuevo email de confirmación.')
          } else {
            setMessage('Error al confirmar el email: ' + errorMessage)
          }
          return
        }

        // Email verified successfully
        console.log('Email verification successful:', data)
        setStatus('success')
        setMessage('¡Email confirmado exitosamente! Ya puedes acceder a tu cuenta.')

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?confirmed=true')
        }, 2000)

      } catch (error) {
        console.error('Error confirming email:', error)
        setStatus('error')
        setMessage('Error interno del servidor. Inténtalo más tarde.')
      }
    }

    confirmEmailAddress()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {status === 'loading' && (
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Confirmando tu email...'}
            {status === 'success' && '¡Email Confirmado!'}
            {status === 'error' && 'Error de Confirmación'}
          </CardTitle>
          <CardDescription>
            Hub Hospitalario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={
            `text-center p-4 rounded border ${status === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
              status === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                'border-blue-200 bg-blue-50 text-blue-800'
            }`
          }>
            {message || 'Procesando tu confirmación...'}
          </div>

          {status === 'success' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Serás redirigido al login en unos segundos...
              </p>
              <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                Ir al Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/confirm/resend')} variant="outline" className="w-full mb-2">
                Reenviar Email de Confirmación
              </Button>
              <Button onClick={() => router.push('/signup')} variant="ghost" className="w-full">
                Registrarse Nuevamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Cargando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}