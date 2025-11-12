// Theme Configuration - Hub Hospitalario
// Integración con Tailwind CSS usando los design tokens

import type { Config } from 'tailwindcss'
import { designSystem } from './tokens'

const theme = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores primarios - Azul médico
        primary: designSystem.colors.primary,
        // Colores secundarios - Gris elegante
        secondary: designSystem.colors.secondary,
        // Colores de estado
        success: designSystem.colors.success,
        warning: designSystem.colors.warning,
        error: designSystem.colors.error,
        info: designSystem.colors.info,
        // Colores de superficie
        surface: designSystem.colors.surface,
        // Colores neutrales
        neutral: designSystem.colors.neutral,
      },

      fontFamily: {
        sans: designSystem.typography.fontFamily.sans,
        mono: designSystem.typography.fontFamily.mono,
      },

      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      letterSpacing: designSystem.typography.letterSpacing,

      spacing: designSystem.spacing,
      borderRadius: designSystem.borderRadius,
      boxShadow: designSystem.shadows,
      zIndex: designSystem.zIndex,

      screens: designSystem.breakpoints,

      animation: {
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-in-right': 'slideInRight 0.25s ease-in-out',
        'slide-in-left': 'slideInLeft 0.25s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-in-out',
        'bounce-in': 'bounceIn 0.35s ease-out',
        'pulse-medical': 'pulseMedical 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseMedical: {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.7)'
          },
          '70%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 10px rgba(14, 165, 233, 0)'
          },
        },
      },

      backdropBlur: {
        xs: '2px',
      },

      // Configuraciones médicas específicas
      gridTemplateColumns: {
        'medical-dashboard': '250px 1fr',
        'patient-card': '1fr 200px',
        'sidebar': '280px 1fr',
      },

      // Configuraciones de altura para componentes médicos
      height: {
        'medical-header': '64px',
        'medical-sidebar': 'calc(100vh - 64px)',
        'patient-card': '200px',
        'dashboard-card': '300px',
      },

      // Configuraciones de máxima anchura
      maxWidth: {
        'medical-container': '1400px',
        'patient-detail': '1200px',
        'dashboard-grid': '1600px',
      },

      // Configuraciones de padding específicas
      padding: {
        'medical-container': '1.5rem',
        'patient-spacing': '1rem',
        'dashboard-spacing': '1.5rem',
      },

      // Configuraciones de margen
      margin: {
        'medical-section': '2rem',
        'patient-section': '1.5rem',
        'dashboard-gap': '1.5rem',
      },
    },
  },

  plugins: [
    // Plugin para utilidades de estado médico
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        '.medical-focus': {
          '&:focus': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '2px',
          },
        },
        '.medical-card': {
          backgroundColor: theme('colors.surface.card'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.base'),
          padding: theme('spacing.4'),
          transition: 'all 0.25s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.surface.cardHover'),
            boxShadow: theme('boxShadow.md'),
          },
        },
        '.medical-button': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.25s ease-in-out',
          '&:focus': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '2px',
          },
        },
        '.medical-input': {
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          border: `1px solid ${theme('colors.surface.border')}`,
          backgroundColor: theme('colors.surface.input'),
          fontSize: theme('fontSize.base'),
          transition: 'all 0.25s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
          },
          '&:hover': {
            backgroundColor: theme('colors.surface.inputHover'),
          },
        },
      }

      addUtilities(newUtilities)
    },

    // Plugin para utilidades de urgencia médica
    function({ addUtilities, theme }: any) {
      const urgencyUtilities = {
        '.urgency-critical': {
          backgroundColor: theme('colors.error.50'),
          borderLeft: `4px solid ${theme('colors.error.600')}`,
          color: theme('colors.error.800'),
        },
        '.urgency-high': {
          backgroundColor: theme('colors.warning.50'),
          borderLeft: `4px solid ${theme('colors.warning.600')}`,
          color: theme('colors.warning.800'),
        },
        '.urgency-medium': {
          backgroundColor: theme('colors.info.50'),
          borderLeft: `4px solid ${theme('colors.info.600')}`,
          color: theme('colors.info.800'),
        },
        '.urgency-low': {
          backgroundColor: theme('colors.success.50'),
          borderLeft: `4px solid ${theme('colors.success.600')}`,
          color: theme('colors.success.800'),
        },
      }

      addUtilities(urgencyUtilities)
    },

    // Plugin para utilidades de departamento médico
    function({ addUtilities }: any) {
      const departmentUtilities = {
        '.dept-cardiology': {
          '&::before': {
            content: '"❤️"',
            marginRight: '0.5rem',
          },
        },
        '.dept-neurology': {
          '&::before': {
            content: '"🧠"',
            marginRight: '0.5rem',
          },
        },
        '.dept-oncology': {
          '&::before': {
            content: '"🎗️"',
            marginRight: '0.5rem',
          },
        },
        '.dept-pediatrics': {
          '&::before': {
            content: '"👶"',
            marginRight: '0.5rem',
          },
        },
        '.dept-emergency': {
          '&::before': {
            content: '"🚑"',
            marginRight: '0.5rem',
          },
        },
        '.dept-surgery': {
          '&::before': {
            content: '"⚕️"',
            marginRight: '0.5rem',
          },
        },
      }

      addUtilities(departmentUtilities)
    },
  ],
}

export default theme