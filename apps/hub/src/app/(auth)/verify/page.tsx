"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/confirm?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('¡Email verificado exitosamente! Redirigiendo al login...');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Error al verificar el email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión. Intenta de nuevo.');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verificación de Email</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Estamos verificando tu cuenta...'}
            {status === 'success' && '¡Email verificado exitosamente!'}
            {status === 'error' && 'Error en la verificación'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-6xl mb-4 ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <p className={`mb-4 ${getStatusColor()}`}>
            {message}
          </p>

          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                El token puede haber expirado o ser inválido.
              </p>
              <Link href="/login" className="text-blue-600 hover:underline text-sm">
                Volver al Login
              </Link>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-green-600">
                Tu email ha sido verificado correctamente.
              </p>
              <Link href="/login" className="text-blue-600 hover:underline text-sm">
                Continuar al Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Verificación de Email</CardTitle>
            <CardDescription>Cargando...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl mb-4">⏳</div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}