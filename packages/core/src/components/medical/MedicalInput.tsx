// MedicalInput - Input especializado para uso médico
import React from 'react'
import { cn } from '../../lib/utils'

export interface MedicalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  variant?: 'default' | 'outlined' | 'filled'
  medical?: boolean
}

const inputVariants = {
  default: 'medical-input',
  outlined: 'border-2 border-gray-300 focus:border-primary-500 bg-white',
  filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500',
}

export const MedicalInput: React.FC<MedicalInputProps> = ({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  medical = true,
  className,
  id,
  ...props
}) => {
  const inputId = id || `medical-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="medical-input-wrapper">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-2',
            medical && 'medical-label'
          )}
        >
          {label}
          {medical && (
            <span className="text-primary-500 ml-1">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{icon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            // Base input styles
            'w-full px-3 py-2 text-sm border border-gray-300 rounded-md',
            'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'transition-colors duration-200',
            
            // Variant styles
            inputVariants[variant],
            
            // Icon padding
            icon && 'pl-10',
            
            // Error styles
            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
            
            // Medical styles
            medical && 'medical-focus',
            
            className
          )}
          {...props}
        />
      </div>
      
      {/* Helper text and error */}
      {error && (
        <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}

// Specialized medical input types
export const PatientIdInput: React.FC<Omit<MedicalInputProps, 'label' | 'icon'>> = (props) => {
  return (
    <MedicalInput
      label="ID del Paciente"
      icon="🆔"
      placeholder="Ej: PAC-2024-001"
      pattern="[A-Z]{3}-\d{4}-\d{3}"
      {...props}
    />
  )
}

export const RoomNumberInput: React.FC<Omit<MedicalInputProps, 'label' | 'icon'>> = (props) => {
  return (
    <MedicalInput
      label="Número de Habitación"
      icon="🏠"
      placeholder="Ej: 201-A"
      {...props}
    />
  )
}

export const PhoneInput: React.FC<Omit<MedicalInputProps, 'label' | 'icon' | 'pattern'>> = (props) => {
  return (
    <MedicalInput
      label="Teléfono"
      icon="📞"
      placeholder="+54 9 11 1234-5678"
      pattern="[\+]?[0-9\s\-\(\)]{10,}"
      {...props}
    />
  )
}

export const EmailInput: React.FC<Omit<MedicalInputProps, 'label' | 'icon' | 'type' | 'pattern'>> = (props) => {
  return (
    <MedicalInput
      label="Correo Electrónico"
      icon="📧"
      type="email"
      placeholder="ejemplo@hospital.com"
      {...props}
    />
  )
}

export default MedicalInput