# 🗄️ Esquema de Base de Datos - PocketBase

Este documento describe el esquema completo de la base de datos PocketBase utilizada en el Hub Hospitalario, incluyendo colecciones, campos, relaciones y reglas de API.

---

## 📋 Índice

1. [Información General](#información-general)
2. [Colecciones del Sistema RBAC](#colecciones-del-sistema-rbac)
3. [Colecciones del Módulo Blog](#colecciones-del-módulo-blog)
4. [Colecciones Auxiliares](#colecciones-auxiliares)
5. [Diagrama de Relaciones](#diagrama-de-relaciones)
6. [Reglas de API](#reglas-de-api)
7. [Notas de Integración](#notas-de-integración)

---

## 📌 Información General

| Propiedad | Valor |
|-----------|-------|
| **Backend** | PocketBase (BaaS) |
| **URL Admin** | `https://pocketbase.manta.com.ar/_/` |
| **Prefijo Hub** | `hub_` para colecciones del sistema |
| **Prefijo Blog** | `blog_` para colecciones del módulo de contenido |

### Convenciones de Nomenclatura

- **Colecciones del sistema:** `hub_*` (ej: `hub_tenants`, `hub_roles`)
- **Colecciones de módulos:** `[modulo]_*` (ej: `blog_articulos`)
- **Campos de fecha automática:** `created`, `updated`
- **Campos de relación:** Nombre en singular de la entidad relacionada

---

## 🔐 Colecciones del Sistema RBAC

### `auth_users`

**ID:** `pbc_2445445395` | **Tipo:** `auth`

Colección principal de autenticación y perfiles de usuario.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único auto-generado |
| `email` | email | ✅ | Correo electrónico (único) |
| `password` | password | ✅ | Contraseña hasheada (oculto) |
| `firstName` | text | ❌ | Nombre |
| `lastName` | text | ❌ | Apellido |
| `dni` | text | ❌ | Documento de identidad |
| `phone` | text | ❌ | Teléfono |
| `active` | bool | ❌ | Estado activo/inactivo |
| `avatar` | file | ❌ | Imagen de perfil (100x100 thumb) |
| `verified` | bool | ✅ | Email verificado (sistema) |
| `emailVisibility` | bool | ❌ | Visibilidad del email |
| `tokenKey` | text (30-60) | ✅ | Token de sesión (oculto) |

**Reglas de API:**
```
List:   @request.auth.id != '' && (@request.auth.role.name = 'superadmin' || @request.auth.id = id)
View:   @request.auth.id = id || @request.auth.role.name = 'superadmin' || @request.auth.role.name = 'admin'
Create: @request.auth.role.name = 'superadmin' || @request.auth.role.name = 'admin'
Update: @request.auth.id = id || @request.auth.role.name = 'superadmin' || @request.auth.role.name = 'admin'
Delete: @request.auth.role.name = "superadmin" && @request.auth.id != id
```

---

### `hub_tenants`

**ID:** `pbc_3120736948` | **Tipo:** `base`

Organizaciones/Hospitales del sistema multi-tenant.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `name` | text (255) | ✅ | Nombre de la organización |
| `slug` | text (50) | ✅ | Identificador URL-friendly |
| `description` | text (1000) | ❌ | Descripción |
| `address` | text | ❌ | Dirección física |
| `phone` | text | ❌ | Teléfono de contacto |
| `email` | email | ❌ | Email de contacto |
| `logo` | file | ❌ | Logo de la organización |
| `is_active` | bool | ❌ | Estado activo/inactivo |

**Reglas de API:** Públicas (vacías) - Solo lectura pública.

---

### `hub_roles`

**ID:** `pbc_281309258` | **Tipo:** `base`

Definición de roles jerárquicos del sistema.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `name` | text (100) | ✅ | Nombre del rol |
| `description` | text (500) | ❌ | Descripción del rol |
| `is_active` | bool | ✅ | Estado activo |
| `tenant` | relation → `auth_users` | ❌ | Tenant asociado |

**Reglas de API:** Públicas (vacías)

---

### `hub_permissions`

**ID:** `pbc_1020161490` | **Tipo:** `base`

Permisos granulares del sistema.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `name` | text (100) | ✅ | Nombre del permiso |
| `description` | text (500) | ❌ | Descripción |
| `resource` | text (100) | ✅ | Recurso (ej: `pacientes`, `citas`) |
| `action` | text (50) | ✅ | Acción (ej: `create`, `read`, `update`, `delete`) |
| `is_active` | bool | ✅ | Estado activo |

**Reglas de API:** `null` - Solo accesible por backend/admin.

---

### `hub_user_roles`

**ID:** `pbc_1985360964` | **Tipo:** `base`

Tabla de unión: asigna roles a usuarios por tenant.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `user` | relation → `auth_users` | ✅ | Usuario (cascade delete) |
| `role` | relation → `hub_roles` | ✅ | Rol asignado (cascade delete) |
| `tenant` | relation → `hub_tenants` | ✅ | Organización |
| `assigned_by` | relation → `auth_users` | ✅ | Quién asignó el rol |
| `assigned_at` | date | ✅ | Fecha de asignación |

**Reglas de API:**
```
List:   user = @request.auth.id || @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"
View:   user = @request.auth.id || @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"
Create: @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"
Update: user = @request.auth.id || @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"
Delete: @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"
```

---

### `hub_role_permissions`

**ID:** `pbc_1810431370` | **Tipo:** `base`

Tabla de unión: asigna permisos a roles.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `role` | relation → `auth_users` | ✅ | Rol (cascade delete) |
| `permission` | relation → `hub_permissions` | ✅ | Permiso (cascade delete) |
| `tenant` | relation → `auth_users` | ❌ | Tenant asociado |
| `created_at` | date | ✅ | Fecha de creación |

**Reglas de API:** `null` - Solo accesible por backend/admin.

---

## 📰 Colecciones del Módulo Blog

> ⚠️ **Nota:** Estas colecciones son compartidas con el sitio web del hospital CISB.

### `blog_articulos`

**ID:** `pbc_519706703` | **Tipo:** `base`

Artículos y noticias del blog.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `title` | text | ✅ | Título del artículo |
| `slug` | text | ✅ | URL slug (auto: `{{slugify(title)}}`) |
| `summary` | editor | ❌ | Resumen/extracto (HTML) |
| `content` | editor | ✅ | Contenido principal (HTML) |
| `status` | select | ✅ | Estado: `borrador`, `publicado`, `archivado`, `en_revision` |
| `published_date` | date | ✅ | Fecha de publicación |
| `scheduled_for` | date | ❌ | Programar publicación futura |
| `cover_image` | file | ✅ | Imagen de portada |
| `video_link` | url | ❌ | Enlace a video |
| `sections` | select (multi, max 5) | ❌ | Secciones: `Novedad`, `Maternidad`, `Pediatría`, `Adultos`, `OCD` |
| `platforms` | select (multi, max 6) | ❌ | Plataformas: `Web`, `YouTube`, `Instagram`, `Facebook`, `TikTok`, `X` |
| `author` | relation → `blog_autores` (multi) | ❌ | Autores del artículo |
| `tags` | relation → `blog_etiquetas` (multi) | ❌ | Etiquetas |
| `last_edited_by` | relation → `auth_users` | ❌ | Último editor |

**Reglas de API:** Públicas (vacías)

---

### `blog_autores`

**ID:** `pbc_3116916696` | **Tipo:** `base`

Autores de contenido (pueden no ser usuarios del sistema).

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `first_name` | text | ✅ | Nombre |
| `last_name` | text | ✅ | Apellido |
| `profession` | text | ❌ | Profesión/cargo |
| `email` | email | ❌ | Email de contacto |
| `avatar` | file | ❌ | Foto de perfil |
| `dni` | number | ✅ | DNI (entero) |

**Reglas de API:** Públicas (vacías)

---

### `blog_etiquetas`

**ID:** `pbc_1610274759` | **Tipo:** `base`

Etiquetas/tags para categorizar artículos.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `Etiquetas` | text | ❌ | Nombre de la etiqueta |
| `created` | autodate | ✅ | Fecha de creación |
| `updated` | autodate | ✅ | Última actualización |

**Índices:** `CREATE INDEX idx_O7ORlC5pG9 ON blog_etiquetas (Etiquetas)`

**Reglas de API:** Públicas (vacías)

---

## 🔧 Colecciones Auxiliares

### `hub_dashboard_notes`

**ID:** `pbc_213467468` | **Tipo:** `base`

Notas personales del dashboard por usuario.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `user` | relation → `auth_users` | ❌ | Usuario propietario |
| `content` | json | ❌ | Contenido de la nota (TipTap JSON) |
| `created` | autodate | ✅ | Fecha de creación |
| `updated` | autodate | ✅ | Última actualización |

**Reglas de API:** Públicas (vacías)

---

### `hub_dashboard_config`

**ID:** *(pendiente de creación)* | **Tipo:** `base`

Configuración de widgets del dashboard por usuario.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `user` | relation → `auth_users` | ✅ | Usuario propietario |
| `widget_id` | text (100) | ✅ | Identificador del widget (ej: `blog_stats`) |
| `visible` | bool | ✅ | Si el widget está visible en el dashboard |
| `position` | number | ✅ | Orden de visualización (0 = primero) |
| `size` | select | ✅ | Tamaño: `small`, `medium`, `large` |
| `created` | autodate | ✅ | Fecha de creación |
| `updated` | autodate | ✅ | Última actualización |

**Índices:** `CREATE UNIQUE INDEX idx_user_widget ON hub_dashboard_config (user, widget_id)`

**Reglas de API:**
```
List:   user = @request.auth.id
View:   user = @request.auth.id
Create: @request.auth.id != ''
Update: user = @request.auth.id
Delete: user = @request.auth.id
```

---

### `hub_audit_logs`

**ID:** `pbc_4102408579` | **Tipo:** `base`

Registro de auditoría de acciones del sistema.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | text (15) | ✅ | ID único |
| `actor` | relation → `auth_users` | ✅ | Usuario que realizó la acción |
| `action` | text | ✅ | Tipo de acción (ej: `create`, `update`, `delete`) |
| `resource` | text | ✅ | Recurso afectado |
| `details` | json | ❌ | Detalles adicionales |
| `ip_address` | text | ❌ | IP del cliente |
| `tenant` | relation → `hub_tenants` | ❌ | Tenant asociado |
| `created` | autodate | ✅ | Timestamp |
| `updated` | autodate | ✅ | Última actualización |

**Reglas de API:** `null` - Solo accesible por backend/admin.

---

## 🔗 Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SISTEMA RBAC                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│   │  auth_users  │◄───────►│hub_user_roles│◄───────►│  hub_roles   │        │
│   │   (auth)     │    N:M  │    (join)    │    N:1  │   (base)     │        │
│   └──────────────┘         └──────────────┘         └──────────────┘        │
│          │                        │                        │                 │
│          │                        │                        │                 │
│          ▼                        ▼                        ▼                 │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│   │ hub_tenants  │◄────────┤              │         │hub_role_perms│        │
│   │   (base)     │    N:1  │              │         │    (join)    │        │
│   └──────────────┘         │              │         └──────────────┘        │
│                            │              │                │                 │
│                            │              │                ▼                 │
│                            │              │         ┌──────────────┐        │
│                            │              │         │hub_permissions│        │
│                            │              │         │   (base)     │        │
│                            │              │         └──────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              MÓDULO BLOG                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐                                  ┌──────────────┐        │
│   │blog_articulos│──────────────────────────────────│blog_etiquetas│        │
│   │   (base)     │  N:M (tags)                      │   (base)     │        │
│   └──────────────┘                                  └──────────────┘        │
│          │                                                                   │
│          │ N:M (author)                                                      │
│          ▼                                                                   │
│   ┌──────────────┐         ┌──────────────┐                                 │
│   │ blog_autores │         │  auth_users  │◄──── last_edited_by             │
│   │   (base)     │         │   (auth)     │                                 │
│   └──────────────┘         └──────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUXILIARES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐                                 │
│   │hub_dashboard │◄───────►│  auth_users  │                                 │
│   │   _notes     │    N:1  │   (auth)     │                                 │
│   └──────────────┘         └──────────────┘                                 │
│                                   │                                          │
│   ┌──────────────┐                │                                          │
│   │hub_audit_logs│◄───────────────┤ (actor)                                  │
│   │   (base)     │           N:1  │                                          │
│   └──────────────┘                ▼                                          │
│          │                 ┌──────────────┐                                 │
│          └────────────────►│ hub_tenants  │                                 │
│               N:1 (tenant) │   (base)     │                                 │
│                            └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Reglas de API - Resumen

| Colección | List | View | Create | Update | Delete |
|-----------|------|------|--------|--------|--------|
| `auth_users` | Auth + Admin | Self + Admin | Admin | Self + Admin | SuperAdmin (not self) |
| `hub_tenants` | Público | Público | Público | Público | Público |
| `hub_roles` | Público | Público | Público | Público | Público |
| `hub_permissions` | Solo Admin | Solo Admin | Solo Admin | Solo Admin | Solo Admin |
| `hub_user_roles` | Self + Admin | Self + Admin | Admin | Self + Admin | Admin |
| `hub_role_permissions` | Solo Admin | Solo Admin | Solo Admin | Solo Admin | Solo Admin |
| `blog_articulos` | Público | Público | Público | Público | Público |
| `blog_autores` | Público | Público | Público | Público | Público |
| `blog_etiquetas` | Público | Público | Público | Público | Público |
| `hub_dashboard_notes` | Público | Público | Público | Público | Público |
| `hub_audit_logs` | Solo Admin | Solo Admin | Solo Admin | Solo Admin | Solo Admin |

> ⚠️ **Nota de Seguridad:** Las colecciones del blog tienen reglas públicas porque son consumidas por el sitio web público del hospital. Considerar agregar validaciones adicionales si se requiere mayor control.

---

## 📝 Notas de Integración

### Colecciones Compartidas

Las siguientes colecciones son compartidas con el sitio web del hospital CISB:

- `blog_articulos`
- `blog_etiquetas`
- `blog_autores`

Cualquier cambio en estas colecciones debe coordinarse con el equipo del sitio web.

### Cascade Delete

Las siguientes relaciones tienen `cascadeDelete: true`:

- `hub_user_roles.user` → Eliminar usuario elimina sus asignaciones de rol
- `hub_user_roles.role` → Eliminar rol elimina las asignaciones
- `hub_role_permissions.role` → Eliminar rol elimina sus permisos
- `hub_role_permissions.permission` → Eliminar permiso elimina las asignaciones

### Campos Auto-generados

- **IDs:** Patrón `[a-z0-9]{15}`
- **Slugs:** `{{slugify(title)}}` en `blog_articulos`
- **Fechas:** `created` y `updated` con `autodate`

---

## 🔄 Historial de Cambios

| Fecha | Cambio |
|-------|--------|
| 2024-12 | Documentación inicial del esquema completo |

---

*Última actualización: Diciembre 2024*
