# 🏥 Hub Hospitalario CISB

**Sistema SaaS Multi-Hospital para Gestión Médica Integral**

---

## 📋 ESTADO DEL PROYECTO

### ✅ COMPLETADO
- **Memory System** - Documentación completa del proyecto
- **Design System** - Sistema de diseño médico especializado
- **Autenticación** - Sistema completo login/signup con PocketBase
- **Dashboard** - Interface moderna con módulos hospitalarios
- **Expedientes** - Sistema de Mesa de Entrada y seguimiento
- **Ayuda y Soporte** - Centro de ayuda con guías, FAQs y contacto
- **Base de Datos RBAC** - Sistema multi-tenant completo con PocketBase
- **Arquitectura Escalable** - Estructura lista para módulos adicionales

### 🔄 EN DESARROLLO
- **Panel de Administración** - Gestión de usuarios y roles
- **Módulo de Pacientes** - Gestión integral de pacientes

---

## 📚 DOCUMENTACIÓN

### Documentación General
| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| **README del Proyecto** | `/docs/README_PROYECTO.md` | Este archivo - visión general |
| **Arquitectura del Sistema** | `/docs/ARQUITECTURA_SISTEMA_FINAL.md` | Decisiones de arquitectura y estructura |
| **Configuración de Email** | `/docs/email-configuration.md` | Configuración de correo electrónico |

### Base de Datos (PocketBase)
| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| **Guía Maestra** | `/docs/infraestructura/GUIA_MAESTRA_POCKETBASE.md` | Autenticación, hooks, configuración |
| **Esquema Completo** | `/docs/infraestructura/POCKETBASE_SCHEMA.md` | Colecciones, campos, relaciones, reglas API |

### Sistema de Diseño
| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| **Design System** | `/apps/hub/docs/DESIGN_SYSTEM.md` | Paleta de colores, tipografía, componentes UI, modo oscuro |

### Documentación por Módulo
| Módulo | Ubicación | Descripción |
|--------|-----------|-------------|
| **Blog/Contenido** | `/apps/hub/src/app/modules/content/README.md` | Gestión de artículos y noticias |

### Contexto para IA
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| **Project Context** | `/.agent/workflows/project-context.md` | Referencias y convenciones para asistentes IA |

> 💡 **Tip:** Al crear nuevos módulos, agregar un `README.md` en la carpeta del módulo siguiendo el patrón del módulo de Blog.

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Autenticación:** PocketBase Auth + Custom User Profiles
- **Base de Datos:** SQLite (PocketBase) + Real-time API
- **UI/UX:** Framer Motion + Design System Médico
- **Estado:** Zustand + React Query
- **Deployment:** Vercel

### Estructura Multi-Tenant

```
Hub Hospitalario CISB
├── auth_users          ← Perfiles extendidos con datos médicos
├── hub_tenants         ← Organizaciones/hospitales
├── hub_roles           ← Roles jerárquicos (niveles 1-10)
├── hub_permissions     ← Permisos granulares por módulo
├── hub_role_permissions ← Relación roles-permisos
└── hub_user_roles      ← Asignación por organización
```

---

## 🔐 SISTEMA RBAC

### Roles Implementados
- **Super Admin (10)** - Control total del sistema
- **Hospital Admin (8)** - Administración hospital específica
- **Medical Senior (7)** - Médicos senior con firma digital
- **Medical Doctor (6)** - Médicos generales
- **Nursing Staff (5)** - Personal de enfermería
- **Admin Staff (4)** - Personal administrativo
- **Medical Technician (3)** - Técnicos médicos
- **Cleaning Staff (2)** - Servicios generales
- **Basic User (1)** - Acceso mínimo

### Permisos por Módulo
- 👥 **Usuarios:** Gestión completa de usuarios y roles
- 🏥 **Pacientes:** CRUD + historial médico completo
- 📅 **Citas:** Agenda médica y programación
- 📊 **Reportes:** Creación, edición y firma digital
- 🚨 **Urgencias:** Manejo de emergencias hospitalarias
- 💊 **Inventario:** Medicamentos y equipos médicos
- ⚙️ **Configuración:** Settings del hospital
- 💬 **Comunicación:** Mensajes internos y notificaciones

---

## 🏥 HOSPITALES SOPORTADOS

### Hospital CISB Córdoba (Ejemplo)
- **Slug:** `hospital-cisb`
- **Dirección:** Av. Colón 5555, Córdoba, Córdoba
- **Contacto:** +54 351 123-4567, info@cisb.gob.ar
- **Estado:** ✅ Activo y configurado

---

## 🚀 EJECUCIÓN DEL PROYECTO

### 1. Instalación de Dependencias
```bash
npm install
cd apps/hub && npm install
cd ../../packages/core && npm install
```

### 2. Configuración de Variables de Entorno
```bash
# apps/hub/.env.local (copiar desde .env.example)
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase.ejemplo.gob.ar

# Credenciales de administrador (configurar en .env.local privado)
POCKETBASE_ADMIN_EMAIL=admin@hospital.gob.ar
POCKETBASE_ADMIN_PASSWORD=contraseña_segura_aqui
```

### 3. Colecciones de Base de Datos
El sistema utiliza **PocketBase** como backend con las siguientes colecciones:

#### Colecciones Principales:
- **auth_users** (pbc_2445445395) - Autenticación y perfiles de usuario
- **hub_tenants** (pbc_3120736948) - Organizaciones/hospitales
- **hub_roles** (pbc_281309258) - Roles del sistema
- **hub_permissions** (pbc_1020161490) - Permisos granulares
- **hub_role_permissions** (pbc_1810431370) - Asignación roles-permisos
- **hub_user_roles** (pbc_1985360964) - Asignación usuarios-roles

### 4. Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:3000
```

---

## 🎯 PRÓXIMOS MÓDULOS

### En Cola de Desarrollo
1. **📋 Módulo de Pacientes**
   - Lista y búsqueda de pacientes
   - Formularios de registro/edición
   - Historial médico completo
   - Integración con roles médicos

2. **👥 Panel de Administración**
   - Gestión de usuarios del hospital
   - Asignación de roles por organización
   - Configuración de permisos

3. **📅 Módulo de Citas**
   - Agenda médica
   - Programación de consultas
   - Notificaciones automáticas

### Módulos Futuros
- 📊 **Reportes Médicos** - Generación y firma digital
- 🚨 **Sistema de Urgencias** - Manejo de emergencias
- 💊 **Inventario Médico** - Stock de medicamentos
- 📈 **Dashboard Analítico** - Métricas hospitalarias

---

## 🔧 SCRIPTS DISPONIBLES

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run lint            # Linting del código
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
hub-hospitalario/
├── apps/
│   └── hub/              # Aplicación Next.js principal
├── packages/
│   └── core/             # Paquete compartido (UI, Auth, etc.)
├── GUIA_FINAL_DEFINITIVA_SIMPLIFICADA.md  # Configuración de PocketBase
├── .gitignore            # Archivos ignorados
├── package.json          # Configuración del proyecto
├── turbo.json            # Configuración de Turbo
└── README.md            # Este archivo
```

---

## 🆘 SOPORTE Y CONTACTO

**Sistema desarrollado para:** Centro de Información y Servicios Bibliotecarios (CISB)
**Ubicación:** Córdoba, Argentina
**Tecnologías:** Next.js + PocketBase + TypeScript

---

## 📄 LICENCIA

Proyecto privado para CISB - Hub Hospitalario
© 2025 Centro Integral de Salud Banda