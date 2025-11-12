// MedicalButton - Botón especializado para uso médico
import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface MedicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  urgency?: 'critical' | 'high' | 'medium' | 'low'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
  success: 'bg-success-600 hover:bg-success-700 text-white',
  warning: 'bg-warning-600 hover:bg-warning-700 text-white',
  error: 'bg-error-600 hover:bg-error-700 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700',
}

const urgencyVariants = {
  critical: 'ring-2 ring-error-300 animate-pulse-medical',
  high: 'ring-2 ring-warning-300',
  medium: 'ring-1 ring-info-300',
  low: '',
}

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

export const MedicalButton: React.FC<MedicalButtonProps> = ({
  variant = 'primary',
  size = 'md',
  urgency = 'low',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const isDisabled = disabled || loading

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(e)
    }
  }

  return (
    <button
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        // Base styles
        'medical-button',
        'inline-flex items-center justify-center gap-2',
        'rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'relative overflow-hidden',
        
        // Variant styles
        buttonVariants[variant],
        
        // Urgency styles
        urgencyVariants[urgency],
        
        // Size styles
        sizeVariants[size],
        
        // Hover effects
        !isDisabled && 'hover:scale-105 active:scale-95',
        
        className
      )}
      {...props}
    >
      {/* Background animation for urgent actions */}
      {urgency === 'critical' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {icon && iconPosition === 'left' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>
    </button>
  )
}

// Specialized button variants for medical use
export const EmergencyButton: React.FC<Omit<MedicalButtonProps, 'variant' | 'urgency'> & { 
  emergencyLevel?: 'critical' | 'high' | 'medium'
}> = ({ emergencyLevel = 'high', children, ...props }) => {
  return (
    <MedicalButton
      variant="error"
      urgency={emergencyLevel}
      size="lg"
      className="font-bold text-base animate-pulse"
      {...props}
    >
      {children}
    </MedicalButton>
  )
}

export const ActionButton: React.FC<Omit<MedicalButtonProps, 'variant'> & {
  actionType?: 'create' | 'edit' | 'delete' | 'view' | 'save' | 'cancel'
}> = ({ actionType = 'create', children, ...props }) => {
  const getVariant = () => {
    switch (actionType) {
      case 'create': return 'primary'
      case 'edit': return 'secondary'
      case 'delete': return 'error'
      case 'view': return 'ghost'
      case 'save': return 'success'
      case 'cancel': return 'ghost'
      default: return 'primary'
    }
  }

  const getIcon = () => {
    switch (actionType) {
      case 'create': return '+'
      case 'edit': return '✏️'
      case 'delete': return '🗑️'
      case 'view': return '👁️'
      case 'save': return '💾'
      case 'cancel': return '❌'
      default: return null
    }
  }

  return (
    <MedicalButton
      variant={getVariant()}
      icon={getIcon()}
      {...props}
    >
      {children}
    </MedicalButton>
  )
}

export default MedicalButton