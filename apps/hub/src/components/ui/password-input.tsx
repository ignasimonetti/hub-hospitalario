"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id: string;
  label?: string;
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

  const passwordsMatch = confirmValue !== undefined ? value === confirmValue : true;
  const hasMismatch = confirmValue !== undefined && value && confirmValue && !passwordsMatch;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative flex items-center">
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
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {showConfirm && (
        <div className="relative flex items-center mt-2">
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
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {hasMismatch && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          Las contraseñas no coinciden
        </div>
      )}

      {showConfirm && confirmValue && passwordsMatch && value && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          ✓ Las contraseñas coinciden
        </div>
      )}
    </div>
  );
}

interface SimplePasswordInputProps {
  id: string;
  label?: string;
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