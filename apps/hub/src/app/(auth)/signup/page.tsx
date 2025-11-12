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
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  // Función para validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar todos los campos
  const validateFields = () => {
    const errors = { ...fieldErrors };
    let isValid = true;

    // Validar nombre
    if (!name.trim()) {
      errors.name = "El nombre es obligatorio";
      isValid = false;
    } else if (name.trim().length < 2) {
      errors.name = "El nombre debe tener al menos 2 caracteres";
      isValid = false;
    } else {
      errors.name = "";
    }

    // Validar apellido
    if (!lastName.trim()) {
      errors.lastName = "El apellido es obligatorio";
      isValid = false;
    } else if (lastName.trim().length < 2) {
      errors.lastName = "El apellido debe tener al menos 2 caracteres";
      isValid = false;
    } else {
      errors.lastName = "";
    }

    // Validar email
    if (!email.trim()) {
      errors.email = "El email es obligatorio";
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = "Formato de email inválido";
      isValid = false;
    } else {
      errors.email = "";
    }

    // Validar contraseña
    if (!password) {
      errors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    } else {
      errors.password = "";
    }

    // Validar confirmación de contraseña
    if (!confirmPassword) {
      errors.confirmPassword = "Confirma tu contraseña";
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    } else {
      errors.confirmPassword = "";
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // Validar todos los campos antes de enviar
    if (!validateFields()) {
      setError("Por favor corrige los errores en el formulario");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          first_name: name.trim(),
          last_name: lastName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Error al crear la cuenta";
        
        if (data.error) {
          if (data.error.includes("User already registered")) {
            errorMessage = "Ya existe un usuario con este email";
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
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err) {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">¡Cuenta Creada!</CardTitle>
            <CardDescription>
              Revisa tu email para confirmar tu cuenta. Serás redirigido al login en unos segundos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Usuario</CardTitle>
          <CardDescription>
            Crear una nueva cuenta de usuario. Solo administradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre completo"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: "" }));
                  }
                }}
                disabled={isLoading}
                className={fieldErrors.name ? "border-red-500" : ""}
              />
              {fieldErrors.name && (
                <div className="text-sm text-red-600">{fieldErrors.name}</div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Apellido completo"
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) {
                    setFieldErrors(prev => ({ ...prev, lastName: "" }));
                  }
                }}
                disabled={isLoading}
                className={fieldErrors.lastName ? "border-red-500" : ""}
              />
              {fieldErrors.lastName && (
                <div className="text-sm text-red-600">{fieldErrors.lastName}</div>
              )}
            </div>
          </div>
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
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: "" }));
                }
              }}
              disabled={isLoading}
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <div className="text-sm text-red-600">{fieldErrors.email}</div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: "" }));
                }
              }}
              disabled={isLoading}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password && (
              <div className="text-sm text-red-600">{fieldErrors.password}</div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite la contraseña"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                }
              }}
              disabled={isLoading}
              className={fieldErrors.confirmPassword ? "border-red-500" : ""}
            />
            {fieldErrors.confirmPassword && (
              <div className="text-sm text-red-600">{fieldErrors.confirmPassword}</div>
            )}
          </div>
          
          {/* Mostrar validación de contraseñas en tiempo real */}
          {confirmPassword && !fieldErrors.confirmPassword && (
            <div className={`text-sm p-2 rounded ${
              password === confirmPassword && password.length >= 6
                ? "text-green-600 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}>
              {password === confirmPassword && password.length >= 6
                ? "✓ Las contraseñas coinciden y son válidas"
                : "Las contraseñas no coinciden o son muy cortas"}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              ⚠️ {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button
            className="w-full"
            onClick={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? "Creando cuenta..." : "Crear Usuario"}
          </Button>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}