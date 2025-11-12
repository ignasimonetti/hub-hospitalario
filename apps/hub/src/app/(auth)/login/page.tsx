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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
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
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              ⚠️ {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Ingresar"}
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Registrarse
            </Link>
            <span className="mx-2">|</span>
            <Link href="/forgot-password" className="text-blue-600 hover:underline font-medium">
              Olvidé mi contraseña
            </Link>
          </div>
        </CardFooter>
      </Card>
      <div className="flex items-center space-x-8">
        {logos.map((logo, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="object-contain"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}