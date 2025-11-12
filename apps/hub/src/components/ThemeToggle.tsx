"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-full justify-start gap-2"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Modo Oscuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Modo Claro</span>
        </>
      )}
    </Button>
  );
}

// Compact version for dashboard header
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      ) : (
        <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      )}
    </Button>
  );
}