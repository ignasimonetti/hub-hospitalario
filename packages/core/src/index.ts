// Hub Hospitalario - Core Package Exports
// Sistema de diseño y componentes médicos

// Design System
export { designSystem, colors, typography, spacing, borderRadius, shadows, breakpoints, medicalContext, animations, zIndex } from './design-system/tokens'

// UI Components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card'
export { Badge, badgeVariants } from './components/ui/badge'

// Medical Components
export { MedicalCard, PatientCard } from './components/medical/MedicalCard'
export { MedicalButton, EmergencyButton, ActionButton } from './components/medical/MedicalButton'
export { MedicalInput, PatientIdInput, RoomNumberInput, PhoneInput, EmailInput } from './components/medical/MedicalInput'
export { NotionEditor } from './components/NotionEditor' // Export NotionEditor

// Utilities
export * from './lib/utils'

// PocketBase Integration
export * from './lib/pocketbase'

// Types
export type { MedicalCardProps, PatientCardProps } from './components/medical/MedicalCard'
export type { MedicalButtonProps } from './components/medical/MedicalButton'
export type { MedicalInputProps } from './components/medical/MedicalInput'