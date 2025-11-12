# Arquitectura del Sistema - Hub Hospitalario (Corregido y Actualizado)

## Decisiones Arquitectónicas

### Monorepo Structure
La estructura del proyecto sigue un enfoque de monorepo gestionado por Turborepo.
```
hub-hospitalario/
├── apps/
│   └── hub/              # Aplicación principal Next.js
├── packages/
│   └── core/             # Componentes y lógica compartida
├── docs/                 # Documentación centralizada
└── .kilotools/           # Memoria para herramientas de IA
```

### Backend y Base de Datos
- **Backend as a Service (BaaS):** **PocketBase** (Auto-hospedado)
- **Base de Datos:** SQLite a través de PocketBase, con capacidades de tiempo real.
- **Arquitectura de Datos:** Sistema Multi-Tenant con colecciones `hub_*` para gestionar roles, permisos y tenants. La colección `auth_users` es la fuente de verdad para todos los usuarios.

### Autenticación
- **Proveedor:** PocketBase Auth.
- **Flujo:** Registro con email, verificación vía email (manejado por un hook de PocketBase + Resend), y login con credenciales.

### UI/UX Design
- **Estilo General:** Interfaz limpia y profesional, inspirada en Notion.
- **Framework de UI:** shadcn/ui sobre Tailwind CSS.
- **Animaciones:** Framer Motion para transiciones suaves y profesionales.
- **Fuente:** Inter.

## Configuración de Desarrollo

### Scripts NPM (gestionados por Turborepo)
```json
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "lint": "turbo run lint"
}
```

### Variables de Entorno Clave (`apps/hub/.env.local`)
```env
# URL de la instancia de PocketBase
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase.manta.com.ar

# Clave de API para el servicio de emails
RESEND_API_KEY=re_xxxxxxxx

# URL de la aplicación para desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Fuentes de Verdad de la Documentación

- **Arquitectura Completa:** `docs/ARQUITECTURA_SISTEMA_FINAL.md`
- **Guía Maestra de PocketBase:** `docs/infraestructura/GUIA_MAESTRA_POCKETBASE.md`

---
*Este resumen ha sido corregido y actualizado. El backend es PocketBase.*
