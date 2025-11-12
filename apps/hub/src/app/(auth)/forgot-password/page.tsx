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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (!email.includes('@')) {
      setError("Por favor ingresa un email válido");
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
            errorMessage = "No encontramos una cuenta con este email";
          } else if (data.error.includes("Invalid email")) {
            errorMessage = "El formato del email no es válido";
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">¡Email Enviado!</CardTitle>
            <CardDescription>
              Hemos enviado un link de recuperación a tu email. Revisa tu bandeja de entrada.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">Volver al Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email para recibir un link de recuperación.
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
                if (error) setError("");
              }}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              ⚠️ {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar Link"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}