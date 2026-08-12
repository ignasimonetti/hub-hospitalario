"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimplePasswordInput } from "@/components/ui/password-input";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { pocketbase } from "@/lib/auth";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Capturar el token que viene en la URL desde el mail de PocketBase/Resend
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("El enlace de recuperación es inválido o no contiene un token válido.");
    }
  }, [searchParams]);

  const handleConfirmReset = async () => {
    if (!password || !confirmPassword) {
      setError("Por favor completa ambos campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!token) {
      setError("Token de recuperación no encontrado.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo restablecer la contraseña.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2500);
    } catch (err: any) {
      console.error("Error al restablecer contraseña:", err);
      setError(err?.message || "El enlace de recuperación ha expirado o ya fue utilizado.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl border border-slate-200 bg-white p-2">
        <CardHeader className="text-center pb-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-slate-900">
            ¡Contraseña Restablecida!
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión...
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl">
              Ir al Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border border-slate-200 bg-white/90 backdrop-blur-md rounded-2xl p-2">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold text-center text-slate-900">
          Nueva Contraseña
        </CardTitle>
        <CardDescription className="text-center text-slate-500 text-xs">
          Ingresa tu nueva contraseña para completar el restablecimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SimplePasswordInput
          id="password"
          label="Nueva Contraseña"
          value={password}
          onChange={(val) => {
            setPassword(val);
            if (error) setError("");
          }}
          placeholder="Mínimo 6 caracteres"
          required
          disabled={isLoading}
        />
        <SimplePasswordInput
          id="confirmPassword"
          label="Confirmar Nueva Contraseña"
          value={confirmPassword}
          onChange={(val) => {
            setConfirmPassword(val);
            if (error) setError("");
          }}
          placeholder="Repite tu nueva contraseña"
          required
          disabled={isLoading}
        />

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col pt-2">
        <Button
          className="w-full text-sm font-semibold h-11 bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all rounded-xl"
          onClick={handleConfirmReset}
          disabled={isLoading || !token}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Actualizando...
            </span>
          ) : (
            "Guardar Nueva Contraseña"
          )}
        </Button>
        <div className="mt-4 text-center text-xs">
          <Link href="/login" className="text-slate-500 hover:text-slate-700 hover:underline">
            Volver al Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 px-4">
      <Suspense fallback={
        <Card className="w-full max-w-md p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Cargando formulario...</p>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
