# Documentación de Schema y Lógica de Negocio (Backend)

Este documento registra configuraciones críticas de la base de datos (PocketBase) y decisiones de lógica de negocio que afectan al funcionamiento del sistema de Roles y Permisos.

## ⚠️ Configuraciones Críticas de PocketBase

### Colección: `hub_role_permissions`
Esta colección maneja la relación N:N entre Roles y Permisos. Su configuración es estricta y cualquier desviación provocará fallos en el guardado (Error 400).

| Campo | Tipo | Configuración Obligatoria | Notas |
|-------|------|---------------------------|-------|
| `role` | Relation | Apunta a: **hub_roles** | **NO** debe apuntar a `users`. |
| `permission` | Relation | Apunta a: **hub_permissions** | - |
| `tenant` | Relation | Apunta a: **hub_tenants** | **NO** debe apuntar a `users`. |
| `created_at` | Date | **Required: FALSE** | Si se marca como "Required", bloqueará la creación automática. PocketBase usa su propio campo `created` de sistema. |

---

## 🛑 Anomalías y Decisiones de Diseño

### La Discrepancia del "Tenant"
Existe una diferencia estructural importante entre cómo se asocia un "Tenant" a un Rol frente a un Permiso:

1.  **En `hub_roles`**: El campo `tenant` es una relación que apunta a la colección **`users`** (probablemente indicando el usuario propietario o creador).
2.  **En `hub_role_permissions`**: El campo `tenant` es una relación que apunta a la colección real **`hub_tenants`**.

**Consecuencia en el Código (`src/app/actions/roles.ts`):**
No podemos simplemente copiar el ID del tenant del rol al crear un permiso, porque los IDs pertenecen a colecciones diferentes.

```typescript
// src/app/actions/roles.ts

// INCORRECTO (Causará error de validación):
// payload.tenant = role.tenant; 

// CORRECTO (Estado actual):
// Omitimos el campo tenant por ahora para permitir que el permiso se guarde.
// En el futuro, se deberá buscar el ID real del Tenant asociado al usuario/rol si es necesario llenar este campo.
```

### Sanitización de Datos (Server Actions)
Dado que PocketBase devuelve objetos POJO (Plain Old Java Objects) que a veces contienen propiedades no serializables o proxies cuando se expanden relaciones, todas las acciones de servidor que devuelven datos al cliente deben sanitizar la respuesta:

```typescript
// Patrón obligatorio en server actions
return {
    success: true,
    data: JSON.parse(JSON.stringify(record))
};
```
