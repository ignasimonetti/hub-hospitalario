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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const logos = [
    { src: "/assets/cisb.png", alt: "Logo CISB", width: 220, height: 75 },
    { src: "/assets/ministerio.png", alt: "Logo Ministerio", width: 220, height: 75 },
    { src: "/assets/sde.png", alt: "Logo SDE", width: 220, height: 75 },
  ];

  const handleResetPassword = async () => {
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    if (!email.includes('@')) {
      setError("Por favor ingresa un correo válido");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Error al enviar el email de recuperación";

        if (data.error) {
          if (data.error.includes("User not found")) {
            errorMessage = "No encontramos una cuenta registrada con este correo";
          } else if (data.error.includes("Invalid email")) {
            errorMessage = "El formato del correo no es válido";
          } else {
            errorMessage = data.error;
          }
        }

        setError(errorMessage);
        return;
      }

      setSuccess(true);

    } catch (err) {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Glow ambiental de fondo */}
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
                  ¡Correo Enviado!
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hemos enviado un enlace de recuperación a{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {email}
                  </span>
                  . Por favor revisa tu bandeja de entrada.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Link href="/login" className="w-full">
                  <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 shadow-sm transition-colors">
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Recuperar Contraseña
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Ingresa tu correo institucional registrado para recibir el enlace de restauración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@cisb.gob.ar"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className="bg-white dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 shadow-sm transition-colors"
                >
                  {isLoading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
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