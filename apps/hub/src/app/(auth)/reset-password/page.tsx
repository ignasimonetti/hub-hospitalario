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
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const logos = [
    { src: "/assets/cisb.png", alt: "Logo CISB", width: 220, height: 75 },
    { src: "/assets/ministerio.png", alt: "Logo Ministerio", width: 220, height: 75 },
    { src: "/assets/sde.png", alt: "Logo SDE", width: 220, height: 75 },
  ];

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("El enlace de recuperación es inválido o ha expirado.");
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-sky-200/40 dark:bg-sky-900/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm z-10"
      >
        <Card className="w-full mb-8 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl rounded-2xl">
          {success ? (
            <>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  ¡Contraseña Restablecida!
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tu contraseña ha sido actualizada exitosamente. Redirigiendo al inicio de sesión...
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Link href="/login" className="w-full">
                  <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 shadow-sm transition-colors">
                    Ir a Iniciar Sesión
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Nueva Contraseña
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Ingresa tu nueva clave de acceso para tu cuenta institucional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <SimplePasswordInput
                    id="password"
                    label="Nueva Contraseña"
                    value={password}
                    onChange={(val) => {
                      setPassword(val);
                      if (error) setError("");
                    }}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <SimplePasswordInput
                    id="confirmPassword"
                    label="Confirmar Contraseña"
                    value={confirmPassword}
                    onChange={(val) => {
                      setConfirmPassword(val);
                      if (error) setError("");
                    }}
                    placeholder="Repite tu nueva clave"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  onClick={handleConfirmReset}
                  disabled={isLoading || !token}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 shadow-sm transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </span>
                  ) : (
                    "Guardar Nueva Contraseña"
                  )}
                </Button>
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Volver al inicio de sesión
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>

      {/* Logotipos Institucionales Oficiales */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 z-10 mt-4 px-4 opacity-90 hover:opacity-100 transition-opacity max-w-full">
        {logos.map((logo, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (index * 0.1), duration: 0.4 }}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="object-contain h-14 md:h-20 max-w-[140px] md:max-w-[200px] w-auto drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
