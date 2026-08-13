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
import { SimplePasswordInput } from "@/components/ui/password-input";
import { signInWithEmail } from "../../../lib/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Por favor completa todos los campos");
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError("Por favor ingresa un email válido");
      setIsLoading(false);
      return;
    }

    const { error } = await signInWithEmail(email, password);

    if (error) {
      let errorMessage = "Error al iniciar sesión";
      const rawError = error.message?.toLowerCase() || "";

      if (
        rawError.includes("failed to authenticate") ||
        rawError.includes("invalid login credentials") ||
        rawError.includes("something went wrong while processing your request") ||
        rawError.includes("invalid record")
      ) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (rawError.includes("email not confirmed") || rawError.includes("not verified")) {
        errorMessage = "Debes confirmar tu correo electrónico antes de iniciar sesión";
      } else if (rawError.includes("user not found") || rawError.includes("record does not exist")) {
        errorMessage = "No existe una cuenta registrada con este correo";
      } else if (rawError.includes("too many requests")) {
        errorMessage = "Demasiados intentos fallidos. Intenta nuevamente más tarde";
      } else if (rawError.includes("failed to fetch") || rawError.includes("networkerror")) {
        errorMessage = "No se pudo conectar con el servidor. Revisa tu conexión a internet";
      } else if (error.message && typeof error.message === 'string' && !error.message.includes("http")) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } else {
      localStorage.setItem('session_start', Date.now().toString());
      window.location.href = "/dashboard";
    }

    setIsLoading(false);
  };

  const logos = [
    { src: "/assets/cisb.png", alt: "Logo CISB", width: 220, height: 75 },
    { src: "/assets/ministerio.png", alt: "Logo Ministerio", width: 220, height: 75 },
    { src: "/assets/sde.png", alt: "Logo SDE", width: 220, height: 75 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Glow ambiental de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-200/40 dark:bg-sky-900/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm z-10"
      >
        <Card className="w-full mb-10 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Hub Hospitalario
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Ingresa tu correo y contraseña institucional
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@cisb.gob.ar"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading}
                className="bg-white dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </Label>
              <SimplePasswordInput
                id="password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  if (error) setError("");
                }}
                placeholder="Ingresa tu contraseña"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 shadow-sm transition-colors"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
            <div className="flex items-center justify-center space-x-2 text-xs">
              <Link href="/signup" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold hover:underline">
                Registrarse
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Logotipos Institucionales Oficiales Destacados - Responsive */}
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