"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  confirmValue?: string;
  showConfirm?: boolean;
  className?: string;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Contraseña",
  disabled = false,
  required = false,
  error,
  confirmValue,
  showConfirm = false,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validación de coincidencia de contraseñas
  const passwordsMatch = confirmValue !== undefined ? value === confirmValue : true;
  const hasMismatch = confirmValue !== undefined && value && confirmValue && !passwordsMatch;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="relative">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={cn(
            "pr-10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400",
            (error || hasMismatch) && "border-red-500 focus:border-red-500"
          )}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={cn(
            "absolute right-3 top-8 h-4 w-4 text-gray-500 hover:text-gray-700",
            "focus:outline-none focus:text-gray-700 transition-colors"
          )}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mostrar confirmación de contraseña */}
      {showConfirm && (
        <div className="relative">
          <Input
            id={`${id}-confirm`}
            type={showPassword ? "text" : "password"}
            value={confirmValue || ""}
            placeholder="Confirmar contraseña"
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className={cn(
              "pr-10",
              hasMismatch && "border-red-500 focus:border-red-500"
            )}
          />
          <div className="absolute right-3 top-8 h-4 w-4" />
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {hasMismatch && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Las contraseñas no coinciden
        </div>
      )}

      {/* Mostrar mensaje de coincidencia exitosa */}
      {showConfirm && confirmValue && passwordsMatch && value && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
          ✓ Las contraseñas coinciden
        </div>
      )}
    </div>
  );
}

// Componente específico para campos simples sin confirmación
interface SimplePasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SimplePasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Contraseña",
  disabled = false,
  required = false,
  className,
}: SimplePasswordInputProps) {
  return (
    <PasswordInput
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
}