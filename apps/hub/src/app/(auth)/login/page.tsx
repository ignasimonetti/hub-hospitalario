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

    // Validación básica antes del envío
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
      // Interpretar errores de Supabase
      let errorMessage = "Error al iniciar sesión";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Debes confirmar tu email antes de iniciar sesión";
      } else if (error.message?.includes("User not found")) {
        errorMessage = "No existe una cuenta con este email";
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Demasiados intentos. Intenta más tarde";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } else {
      // Login exitoso - redirigir al dashboard
      console.log("Login successful!");
      window.location.href = "/dashboard";
    }

    setIsLoading(false);
  };

  const logos = [
    { src: "/assets/cisb.png", alt: "Logo CISB", width: 150, height: 50 },
    { src: "/assets/ministerio.png", alt: "Logo Ministerio", width: 150, height: 50 },
    { src: "/assets/sde.png", alt: "Logo SDE", width: 150, height: 50 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-4">
      {/* Background Decorative Elements (Optional for Premium Feel) */}
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/20 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm z-10"
      >
        <Card className="w-full mb-8 shadow-2xl border-0 ring-1 ring-gray-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold text-gray-900 dark:text-slate-100">Login</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu email y contraseña para acceder a la intranet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@hospital.com"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(""); // Limpiar error al escribir
                }}
                disabled={isLoading}
                className="bg-white dark:bg-slate-950"
              />
            </div>
            <SimplePasswordInput
              id="password"
              label="Contraseña"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) setError(""); // Limpiar error al escribir
              }}
              placeholder="Ingresa tu contraseña"
              required
              disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800/50 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              className="w-full text-base py-5 shadow-sm hover:shadow-md transition-all"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
            <div className="mt-6 text-center text-sm space-x-2">
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-medium transition-colors">
                Registrarse
              </Link>
              <span className="text-gray-300 dark:text-slate-700">|</span>
              <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline font-medium transition-colors">
                Olvidé mi contraseña
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="flex items-center space-x-8 z-10 opacity-80 hover:opacity-100 transition-opacity">
        {logos.map((logo, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1), duration: 0.5 }}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="object-contain h-20 w-auto grayscaleHover transition-all duration-300"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}