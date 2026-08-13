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
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TermsModal } from "@/components/TermsModal";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // State for terms modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: "",
  });
  const router = useRouter();

  const openTerms = (type: "terms" | "privacy") => {
    setModalType(type);
    setModalOpen(true);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFields = () => {
    const errors = { ...fieldErrors };
    let isValid = true;

    if (!name.trim()) {
      errors.name = "El nombre es obligatorio";
      isValid = false;
    } else if (name.trim().length < 2) {
      errors.name = "El nombre debe tener al menos 2 caracteres";
      isValid = false;
    } else {
      errors.name = "";
    }

    if (!lastName.trim()) {
      errors.lastName = "El apellido es obligatorio";
      isValid = false;
    } else if (lastName.trim().length < 2) {
      errors.lastName = "El apellido debe tener al menos 2 caracteres";
      isValid = false;
    } else {
      errors.lastName = "";
    }

    if (!email.trim()) {
      errors.email = "El email es obligatorio";
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = "Formato de email inválido";
      isValid = false;
    } else {
      errors.email = "";
    }

    if (!password) {
      errors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    } else {
      errors.password = "";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirma tu contraseña";
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    } else {
      errors.confirmPassword = "";
    }

    if (!acceptedTerms) {
      errors.acceptedTerms = "Debes aceptar los términos y la política de privacidad";
      isValid = false;
    } else {
      errors.acceptedTerms = "";
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          passwordConfirm: confirmPassword,
          name,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ¡Registro exitoso!
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Hemos enviado un correo de confirmación a{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {email}
              </span>
              . Por favor revisa tu bandeja de entrada para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-2">
            <Button
              onClick={() => router.push("/login")}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-sky-200/40 dark:bg-sky-900/20 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-lg border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10 my-8">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Crear cuenta institucional
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Ingresa tus datos para solicitar acceso al Hub Hospitalario
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldErrors.name ? "border-red-500" : ""}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={fieldErrors.lastName ? "border-red-500" : ""}
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@cisb.gob.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Contraseña
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(val) => setPassword(val)}
                  className={fieldErrors.password ? "border-red-500" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Confirmar Contraseña
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(val) => setConfirmPassword(val)}
                  className={fieldErrors.confirmPassword ? "border-red-500" : ""}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Checkbox de Términos y Condiciones */}
            <div className="pt-2">
              <div className="flex items-start space-x-2.5">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-sky-600"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none"
                >
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => openTerms("terms")}
                    className="font-medium text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    Términos y Condiciones
                  </button>{" "}
                  y la{" "}
                  <button
                    type="button"
                    onClick={() => openTerms("privacy")}
                    className="font-medium text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    Política de Privacidad
                  </button>{" "}
                  conforme a la Ley N° 25.326.
                </label>
              </div>
              {fieldErrors.acceptedTerms && (
                <p className="text-xs text-red-500 mt-1 pl-6">
                  {fieldErrors.acceptedTerms}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Registrarse"}
            </Button>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Legal Terms / Privacy Modal */}
      <TermsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
      />
    </div>
  );
}