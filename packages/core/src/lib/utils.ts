// Utility Functions - Hub Hospitalario
// Funciones utilitarias para el sistema de diseño

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Función para combinar clases de Tailwind CSS
 * Utiliza clsx para conditional classes y tailwind-merge para resolver conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea nombres para mostrar
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Obtiene iniciales de un nombre completo
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Formatea fecha en formato legible
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formatea hora en formato legible
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea fecha y hora combinados
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calcula edad desde fecha de nacimiento
 */
export function calculateAge(birthDate: Date | string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Genera ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Capitaliza primera letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Formatea número como moneda
 */
export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Trunca texto a longitud especificada
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Verifica si el dispositivo es móvil
 */
export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

/**
 * Obtiene color de urgencia médica
 */
export function getUrgencyColor(urgency: 'critical' | 'high' | 'medium' | 'low'): string {
  const colors = {
    critical: 'text-error-600 bg-error-50',
    high: 'text-warning-600 bg-warning-50',
    medium: 'text-info-600 bg-info-50',
    low: 'text-success-600 bg-success-50',
  }
  return colors[urgency]
}

/**
 * Convierte urgencia a nivel numérico
 */
export function getUrgencyLevel(urgency: 'critical' | 'high' | 'medium' | 'low'): number {
  const levels = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }
  return levels[urgency]
}

/**
 * Ordena array por urgencia
 */
export function sortByUrgency<T extends { urgency: 'critical' | 'high' | 'medium' | 'low' }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => getUrgencyLevel(b.urgency) - getUrgencyLevel(a.urgency))
}

/**
 * Convierte bytes a formato legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}