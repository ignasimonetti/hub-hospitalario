// MedicalCard - Componente de tarjeta médica especializada
import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

export interface MedicalCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  urgency?: 'critical' | 'high' | 'medium' | 'low'
  department?: string
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

const urgencyStyles = {
  critical: 'urgency-critical',
  high: 'urgency-high',
  medium: 'urgency-medium',
  low: 'urgency-low',
}

const departmentEmojis = {
  'Emergencias': '🚑',
  'Cardiología': '❤️',
  'Neurología': '🧠',
  'Oncología': '🎗️',
  'Pediatría': '👶',
  'Ginecología': '🤰',
  'Traumatología': '🦴',
  'Medicina Interna': '🩺',
  'Cirugía': '⚕️',
  'Radiología': '🩻',
}

export const MedicalCard: React.FC<MedicalCardProps> = ({
  children,
  title,
  subtitle,
  urgency = 'low',
  department,
  className,
  onClick,
  hoverable = true,
}) => {
  const cardVariants = {
    initial: { scale: 1, opacity: 1 },
    hover: hoverable ? { scale: 1.02, opacity: 1 } : {},
    tap: onClick ? { scale: 0.98 } : {},
  }

  const urgencyBadge = urgency !== 'low' && (
    <Badge variant={urgency === 'critical' ? 'destructive' : urgency === 'high' ? 'default' : 'secondary'}>
      {urgency.toUpperCase()}
    </Badge>
  )

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      transition={{ duration: 0.2 }}
      className="medical-card"
    >
      <Card 
        className={cn(
          'p-6 transition-all duration-200',
          urgencyStyles[urgency],
          hoverable && 'cursor-pointer hover:shadow-lg',
          className
        )}
        onClick={onClick}
      >
        {/* Header */}
        {(title || subtitle || urgencyBadge || department) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {department && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{departmentEmojis[department as keyof typeof departmentEmojis] || '🏥'}</span>
                  <span>{department}</span>
                </div>
              )}
              {urgencyBadge}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="medical-card-content">
          {children}
        </div>
      </Card>
    </motion.div>
  )
}

// Patient Card específico para información de pacientes
export interface PatientCardProps {
  patient: {
    id: string
    name: string
    age: number
    room?: string
    department: string
    urgency: 'critical' | 'high' | 'medium' | 'low'
    avatar?: string
    lastUpdate?: string
    condition?: string
  }
  onClick?: () => void
  className?: string
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onClick,
  className,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <MedicalCard
      urgency={patient.urgency}
      department={patient.department}
      onClick={onClick}
      className={cn('medical-card-patient', className)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {patient.avatar ? (
            <img
              src={patient.avatar}
              alt={patient.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
              {getInitials(patient.name)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-gray-900 truncate">
              {patient.name}
            </h4>
            <span className="text-sm text-gray-500">
              {patient.age} años
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {patient.room && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Habitación:</span> {patient.room}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="font-medium">Depto:</span> {patient.department}
            </span>
          </div>

          {patient.condition && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {patient.condition}
            </p>
          )}

          {patient.lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Última actualización: {patient.lastUpdate}
            </p>
          )}
        </div>
      </div>
    </MedicalCard>
  )
}

export default MedicalCard