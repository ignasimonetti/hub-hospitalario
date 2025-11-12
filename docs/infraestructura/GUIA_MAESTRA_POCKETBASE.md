# Guía Maestra de PocketBase para el Hub Hospitalario

Este documento es la fuente de verdad única para toda la configuración, arquitectura, y mantenimiento de PocketBase en el proyecto Hub Hospitalario CISB. Consolida todas las guías y notas previamente dispersas.

---

## 1. Arquitectura y Modelo de Datos

El Hub Hospitalario utiliza PocketBase como su backend principal (BaaS), aprovechando su base de datos SQLite en tiempo real, sistema de autenticación y API integrada.

### 1.1. Credenciales y URL de Acceso
-   **URL de la Interfaz de Admin:** `https://pocketbase.manta.com.ar/_/`
-   **Usuario Admin:** `ignaciosimonetti1984@gmail.com`
-   **Contraseña Admin:** `Millonarios10$`

### 1.2. Nomenclatura de Colecciones
Se utiliza un prefijo `hub_` para todas las colecciones relacionadas con la funcionalidad principal del hospital para evitar colisiones y mantener la claridad.

-   **Correcto:** `hub_user_roles`, `hub_tenants`
-   **Incorrecto:** `user_roles`, `tenants`

### 1.3. Colecciones del Sistema
El sistema RBAC (Role-Based Access Control) multi-tenant se estructura con las siguientes colecciones:

| Colección | ID (Ejemplo) | Tipo | Función Principal |
| :--- | :--- | :--- | :--- |
| **auth_users** | `pbc_2445445395` | `auth` | **Colección Central:** Autenticación y perfiles de usuario. |
| **hub_tenants** | `pbc_3120736948` | `base` | Organizaciones/Hospitales en el sistema. |
| **hub_roles** | `pbc_281309258` | `base` | Define los roles jerárquicos (ej: Super Admin, Doctor). |
| **hub_permissions** | `pbc_1020161490` | `base` | Define permisos granulares (ej: `ver_pacientes`). |
| **hub_user_roles**| `pbc_1985360964` | `base` | **Tabla de Unión:** Asigna un `rol` a un `usuario` en un `tenant`. |
| **hub_role_permissions**|`pbc_1810431370`| `base` | **Tabla de Unión:** Asigna un `permiso` a un `rol`. |

**Decisión Arquitectónica Clave:** La colección `auth_users` (tipo `auth`) es la única fuente de verdad para los usuarios. Todas las demás colecciones que necesitan referenciar a un usuario (como `hub_user_roles` o `hub_tenants`) lo hacen a través de una relación directa con `auth_users`, evitando la duplicación de datos.

---

## 2. Configuración de Autenticación y Conexión

### 2.1. Flujo de Autenticación
1.  **Registro:** Un usuario se registra a través del frontend. La API (`/api/auth/signup`) crea un registro en `auth_users`.
2.  **Email de Verificación:** PocketBase intercepta el evento de creación y, a través de un hook, utiliza **Resend** para enviar un email de confirmación profesional.
3.  **Confirmación:** El usuario hace clic en el enlace del email. PocketBase automáticamente marca al usuario como `verified = true`.
4.  **Login:** El usuario inicia sesión. El sistema verifica si tiene un rol asignado en `hub_user_roles`.
5.  **Acceso:**
    *   Si tiene un rol, accede al dashboard.
    *   Si no tiene rol, se le muestra el modal "Usuario Pendiente".

### 2.2. Conexión desde el Frontend (Next.js)
La conexión se gestiona en `src/lib/auth.ts`.

```typescript
// src/lib/auth.ts
import PocketBase from 'pocketbase';

const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.manta.com.ar';
export const pocketbase = new PocketBase(pocketbaseUrl);

// Ejemplo de login
export async function signInWithEmail(email: string, password: string) {
  return await pocketbase.collection('auth_users').authWithPassword(email, password);
}
```

### 2.3. Variables de Entorno (`.env.local`)
```env
# URL pública de la instancia de PocketBase
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase.manta.com.ar

# Clave de API para el servicio de emails transaccionales
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Secreto para firmar tokens JWT personalizados si fuera necesario
JWT_SECRET=tu-secreto-super-seguro
```

---

## 3. Reglas de API (API Rules)

Las reglas de API son la base de la seguridad en PocketBase. Controlan quién puede listar, ver, crear, actualizar o eliminar registros en cada colección.

### Variables Clave en Reglas:
-   `@request.auth.id`: El ID del usuario autenticado que hace la petición.
-   `@request.auth.role.name`: El nombre del rol del usuario (si se ha configurado).
-   `@collection.{field_name}`: El valor de un campo en el registro que se está evaluando.

### Ejemplo de Reglas para `hub_user_roles`:
-   **List/Search Rule:** `user = @request.auth.id`
    *   *Traducción:* Un usuario solo puede listar las asignaciones de roles que le pertenecen.
-   **Create Rule:** `@request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"`
    *   *Traducción:* Solo un superadmin o un admin pueden crear nuevas asignaciones de roles (es decir, asignar un rol a un usuario).
-   **Delete Rule:** `@request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"`
    *   *Traducción:* Solo un superadmin o un admin pueden eliminar una asignación de rol.

**Nota:** Una configuración detallada para cada colección se encuentra en los apéndices de este documento. La regla más importante para permitir el registro público es dejar el campo **`Create Rule` de la colección `auth_users` vacío**.

---

## 4. Migraciones y Actualizaciones de Esquema

Para mantener la consistencia del esquema de la base de datos, se utilizan scripts de migración.

### 4.1. Migración de Campos de Perfil de Usuario
Se añadieron 6 campos especializados a la colección `auth_users` para adaptarla al contexto médico:

| Campo | Tipo | Nombre | Validación (Regex) | Requerido |
| :--- | :--- | :--- | :--- | :--- |
| DNI | Text | `dni` | `^[0-9]{7,8}$` | Sí |
| Teléfono | Text | `phone` | `^[+]?[0-9\s\-()]{10,}$` | No |
| Matrícula | Text | `professional_id`| `^[A-Z0-9\-]{5,20}$` | No |
| Especialidad | Select | `specialty` | (18 opciones predefinidas) | No |
| Departamento | Text | `department` | `^[A-Za-záéíóúñÑ\s]{2,50}$`| No |
| Cargo | Select | `position` | (8 opciones predefinidas) | No |

### 4.2. Cómo Ejecutar la Migración
Se ha creado un script automatizado para facilitar este proceso.
```bash
# Navega a la carpeta del proyecto
cd hub-hospitalario

# Ejecuta el script de migración
node scripts/run-migration.js
```
Este script se conecta a la API, verifica los campos faltantes y guía al administrador paso a paso para añadirlos en la UI de PocketBase.

---

## 5. Hooks del Servidor (Integración con Resend)

Para enviar emails a través de Resend en lugar del SMTP por defecto de PocketBase, se utiliza un hook del lado del servidor.

### Funcionamiento:
1.  Se crea un archivo JavaScript en la carpeta `pb_hooks/` del servidor de PocketBase (ej: `pb_hooks/emailVerification.js`).
2.  Este script intercepta el evento `onbeforemailermail`.
3.  Dentro del hook, se cancela el envío por defecto de PocketBase.
4.  Se realiza una llamada `fetch` a la API de Resend con el contenido del email y el token de verificación.

### Ejemplo de Hook (`pb_hooks/emailVerification.js`):
```javascript
// Intercepta el evento de envío de email de verificación
onbeforemailermail((e) => {
    console.log(`📧 Interceptando email de verificación para: ${e.mail.to[0].address}`);

    // Previene el envío por defecto de PocketBase
    e.mail.html = ""; 
    e.mail.text = "";

    const user = e.meta.user;
    const token = e.meta.token;
    const appName = e.meta.appName;
    const appUrl = e.meta.appUrl;

    // Construye la URL de verificación
    const verifyUrl = `${appUrl}/_/#/confirm-verification/${token}`;

    // Llama a la API de Resend
    $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        headers: { "Authorization": "Bearer TU_RESEND_API_KEY" },
        body: JSON.stringify({
            from: "noreply@hubhospitalario.manta.com.ar",
            to: user.email,
            subject: `Verifica tu cuenta en ${appName}`,
            html: `<h1>Bienvenido a ${appName}</h1><p>Haz clic en el enlace para verificar tu cuenta: <a href="${verifyUrl}">${verifyUrl}</a></p>`
        })
    });

    console.log(`🚀 Enviando email via Resend a: ${user.email}`);
}, "users", "verification");
```
**Nota:** Este script debe ser subido y configurado directamente en el servidor donde corre la instancia de PocketBase.

---

## 6. Formato de Importación/Exportación

Para hacer backups o mover la estructura de colecciones, PocketBase utiliza un formato JSON específico.

-   La exportación es un **array de objetos**, donde cada objeto es una colección.
-   No debe estar envuelto en un objeto `{ "collections": [...] }`.
-   Cada campo dentro de una colección debe tener un `id` único, `name`, `type` y sus opciones específicas.

Este formato es crucial para restaurar una copia de seguridad o replicar la estructura en una nueva instancia de PocketBase.
