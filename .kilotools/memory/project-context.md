# Hub Hospitalario - Contexto del Proyecto (Corregido y Actualizado)

## Descripción General
**Hub Hospitalario** es una plataforma SaaS multi-hospital que permite la gestión centralizada de múltiples centros médicos. La arquitectura está diseñada para ser escalable, segura y fácil de usar, utilizando **PocketBase** como backend.

## Arquitectura del Sistema
- **Tipo**: SaaS Multi-tenant
- **Monorepo**: Turborepo con estructura `apps/` y `packages/`
- **Frontend**: Next.js 14 con App Router
- **Backend**: **PocketBase** (SQLite con API en tiempo real)
- **UI**: Inspirada en Notion, con un sistema de diseño médico profesional.
- **Autenticación**: PocketBase Auth, con un flujo de verificación por email a través de Resend.

## Estructura del Proyecto
```
hub-hospitalario/
├── apps/
│   └── hub/              # Aplicación principal Next.js
├── packages/
│   └── core/             # Componentes y utilidades compartidas
├── docs/                 # Documentación centralizada y fiable
└── .kilotools/           # Sistema de memoria para IA
```

## Características Principales
- **Multi-tenant**: Cada hospital es un `tenant` separado, gestionado en PocketBase.
- **RBAC (Role-Based Access Control)**: Sistema de roles y permisos granulares (`hub_roles`, `hub_permissions`, etc.).
- **Dashboard**: Interfaz moderna con módulos para gestión hospitalaria.
- **Perfiles de Usuario Médicos**: Perfiles extendidos en la colección `auth_users` con campos como DNI, matrícula y especialidad.
- **Editor tipo Notion**: Se planea o utiliza un editor de texto enriquecido para ciertas áreas.

## Tecnologías Clave
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Animaciones**: Framer Motion
- **Backend**: **PocketBase**
- **Emails Transaccionales**: Resend
- **Deployment**: Vercel (para el frontend) y Coolify (para PocketBase).

## Estado del Proyecto
- ✅ Arquitectura base configurada y documentada.
- ✅ Autenticación con PocketBase implementada y funcional.
- ✅ Sistema de diseño y UI definidos.
- ✅ Estructura de base de datos multi-tenant en PocketBase creada.
- 🔄 Módulos de "Panel de Administración" y "Pacientes" en desarrollo.

## Fuentes de Información Fiables
- **Documentación Principal:** Carpeta `docs/`.
- **Guía de Backend:** `docs/infraestructura/GUIA_MAESTRA_POCKETBASE.md`.

---
*Resumen corregido. El backend es PocketBase. La información de Supabase era incorrecta.*
