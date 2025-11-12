# Tech Stack - Hub Hospitalario (Corregido y Actualizado)

## Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui
- **Gestión de Estado**: Zustand + React Query
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React

## Backend Stack
- **BaaS (Backend as a Service)**: **PocketBase**
- **Base de Datos**: SQLite (gestionada por PocketBase)
- **Autenticación**: PocketBase Auth
- **API**: REST y Real-time (provista por PocketBase)
- **Emails Transaccionales**: Resend

## DevOps & Infraestructura
- **Monorepo**: Turborepo
- **Deployment (Frontend)**: Vercel
- **Deployment (Backend)**: Coolify (para la instancia de PocketBase)
- **Containerización**: Docker (usado por Coolify para desplegar PocketBase)

## Herramientas de Desarrollo
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Editor de Código**: Visual Studio Code
- **Extensión de Asistencia IA**: Kilo Code

## Configuración de Desarrollo
- **Puerto Frontend**: 3000
- **URL PocketBase (Producción)**: `https://pocketbase.manta.com.ar`
- **URL App (Desarrollo)**: `http://localhost:3000`

---
*Stack tecnológico corregido. El backend es PocketBase, no Supabase.*
