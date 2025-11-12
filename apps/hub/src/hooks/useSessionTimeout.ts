"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';

interface SessionConfig {
  absoluteTimeout: number; // Tiempo máximo de sesión (ms)
  idleTimeout: number;     // Tiempo de inactividad (ms)
  warningTime: number;     // Tiempo para mostrar warning (ms)
}

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  timeRemaining: number;
  extendSession: () => void;
  logout: () => void;
}

// Configuración por defecto - puede ser personalizada por rol
const DEFAULT_CONFIG: SessionConfig = {
  absoluteTimeout: 8 * 60 * 60 * 1000, // 8 horas absolutas
  idleTimeout: 2 * 60 * 60 * 1000,     // 2 horas de inactividad
  warningTime: 5 * 60 * 1000,          // 5 minutos de warning
};

// Configuración médica especializada
const MEDICAL_CONFIG: SessionConfig = {
  absoluteTimeout: 12 * 60 * 60 * 1000, // 12 horas para médicos
  idleTimeout: 3 * 60 * 60 * 1000,     // 3 horas de inactividad
  warningTime: 10 * 60 * 1000,         // 10 minutos de warning
};

export function useSessionTimeout(userRole?: string): UseSessionTimeoutReturn {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionStart, setSessionStart] = useState(Date.now());

  // Determinar configuración basada en rol
  const getConfig = useCallback((): SessionConfig => {
    if (userRole === 'medico' || userRole === 'medical_senior') {
      return MEDICAL_CONFIG;
    }
    return DEFAULT_CONFIG;
  }, [userRole]);

  const config = getConfig();

  // Eventos de actividad del usuario
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  // Actualizar última actividad
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Extender sesión
  const extendSession = useCallback(() => {
    setLastActivity(Date.now());
    setSessionStart(Date.now());
    setShowWarning(false);
  }, []);

  // Logout forzado
  const logout = useCallback(async () => {
    await signOut();
    router.push('/login?reason=session_expired');
  }, [router]);

  // Verificar timeouts
  useEffect(() => {
    const checkTimeouts = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeSinceSessionStart = now - sessionStart;

      // Verificar timeout absoluto
      if (timeSinceSessionStart >= config.absoluteTimeout) {
        logout();
        return;
      }

      // Verificar inactividad
      if (timeSinceActivity >= config.idleTimeout) {
        const timeUntilExpiry = config.idleTimeout + config.warningTime - timeSinceActivity;

        if (timeUntilExpiry <= 0) {
          logout();
        } else if (timeUntilExpiry <= config.warningTime) {
          setShowWarning(true);
          setTimeRemaining(Math.ceil(timeUntilExpiry / 1000));
        }
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkTimeouts, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, sessionStart, config, logout]);

  // Configurar listeners de actividad
  useEffect(() => {
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [updateActivity]);

  // Persistir estado de sesión
  useEffect(() => {
    const saved = localStorage.getItem('session_start');
    if (saved) {
      setSessionStart(parseInt(saved));
    } else {
      setSessionStart(Date.now());
      localStorage.setItem('session_start', Date.now().toString());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('session_start', sessionStart.toString());
  }, [sessionStart]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    logout
  };
}