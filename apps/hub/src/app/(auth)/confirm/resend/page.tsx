'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export default function ResendEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Por favor ingresa tu email')
      return
    }

    setIsLoading(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('¡Email de confirmación reenviado! Revisa tu bandeja de entrada.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al reenviar el email')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      setStatus('error')
      setMessage('Error del servidor. Inténtalo más tarde.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            Reenviar Email de Confirmación
          </CardTitle>
          <CardDescription>
            Ingresa tu email para recibir un nuevo enlace de confirmación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>

            {status !== 'idle' && (
              <div className={
                `flex items-center gap-2 p-3 rounded border ${
                  status === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                  status === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                  'border-blue-200 bg-blue-50 text-blue-800'
                }`
              }>
                {status === 'success' && <CheckCircle className="h-4 w-4" />}
                {status === 'error' && <XCircle className="h-4 w-4" />}
                <span className="text-sm">{message}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/confirm')}
                className="flex-1"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Reenviar Email'}
              </Button>
            </div>
          </form>

          {status === 'success' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                ¿No recibiste el email? Revisa tu carpeta de spam.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}