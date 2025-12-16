---
description: Contexto del proyecto Hub Hospitalario y ubicación de documentación clave
---

# Contexto del Proyecto - Hub Hospitalario

## 📚 Documentación Principal

### Sistema de Diseño (UI/UX)
- **Ubicación:** `/apps/hub/docs/DESIGN_SYSTEM.md`
- **Contenido:** Paleta de colores, tipografía, componentes UI, modo oscuro, patrones comunes
- **Usar cuando:** Se desarrollen nuevos componentes o módulos

### Arquitectura del Sistema
- **Ubicación:** `/docs/ARQUITECTURA_SISTEMA_FINAL.md`
- **Contenido:** Estructura general del proyecto, decisiones de arquitectura

### Base de Datos (PocketBase)
- **Guía Maestra:** `/docs/infraestructura/GUIA_MAESTRA_POCKETBASE.md`
- **Esquema Completo:** `/docs/infraestructura/POCKETBASE_SCHEMA.md`
- **Contenido:** Colecciones, campos, relaciones, reglas de API
- **Usar cuando:** Se necesite consultar estructura de datos o crear nuevas colecciones

### Documentación General
- **Ubicación:** `/docs/README_PROYECTO.md`
- **Contenido:** Visión general del proyecto

---

## 📦 Documentación por Módulo

Cada módulo tiene su propio README con:
- Estructura de archivos
- Componentes y props
- Server actions
- Modelo de datos
- Flujos de usuario

### Módulos Documentados:

| Módulo | README |
|--------|--------|
| Blog/Contenido | `/apps/hub/src/app/modules/content/README.md` |
| Expedientes | `/apps/hub/src/app/modules/expedientes/README.md` |

---

## 🎨 Convenciones de Modo Oscuro

**IMPORTANTE:** Antes de crear componentes UI, consultar `/apps/hub/docs/DESIGN_SYSTEM.md`

Clases más usadas:
- Fondos: `dark:bg-slate-950`, `dark:bg-slate-900`
- Texto: `dark:text-slate-200`, `dark:text-slate-400`
- Bordes: `dark:border-slate-800`
- Hover: `dark:hover:bg-slate-800`

---

## 🔧 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** PocketBase (self-hosted)
- **Editor:** TipTap
- **Hosting:** Coolify

---

## 📝 Instrucciones para la IA

1. Siempre consultar `DESIGN_SYSTEM.md` antes de crear componentes
2. Mantener consistencia de modo oscuro en todos los elementos
3. Documentar nuevos módulos con un `README.md` en su carpeta
4. Usar Server Actions para operaciones de datos
5. Respetar la estructura de carpetas existente
