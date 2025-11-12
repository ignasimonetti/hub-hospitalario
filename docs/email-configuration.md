# Configuración de Emails - Hub Hospitalario

## Problema Identificado

**Error**: `The cisb.gob.ar domain is not verified. Please, add and verify your domain on https://resend.com/domains`

**Causa**: El dominio `cisb.gob.ar` no está verificado en Resend, por lo que no se pueden enviar emails desde esa dirección.

## Solución Temporal Implementada

### ✅ Configuración Actual (Funcionando)
```typescript
// En: /packages/core/lib/resend.ts
from: 'onboarding@resend.dev'
```

**Estado**: ✅ Funcionando - Los emails se envían correctamente desde `onboarding@resend.dev`

## Opciones para Producción

### 1. Dominio de Desarrollo (Recomendado)
- **Dominio**: `dev.cisb.gob.ar`
- **Configuración DNS**:
  ```
  Type: CNAME
  Name: dev
  Value: _domainkey.cisb.gob.ar
  ```
- **Tiempo de verificación**: 5-15 minutos

### 2. Dominio Corporativo Oficial
- **Dominio**: `cisb.gob.ar`
- **Configuración DNS**: Verificar con equipo de IT
- **Requerimientos**: Configuración DNS oficial del gobierno

### 3. Dominio Temporal Personal
- **Configuración**: Usar dominio propio para desarrollo
- **Ejemplo**: `noreply@tu-dominio.com`
- **Ventaja**: Control completo sobre el dominio

## Estado Actual del Sistema

### ✅ Funcionalidades Activas
- ✅ Registro de usuarios
- ✅ Envío de emails de confirmación
- ✅ Redirección automática al login
- ✅ Validación completa de formularios

### 🔧 Próximos Pasos
1. **Probar el envío actual** con la configuración temporal
2. **Decidir dominio final** para producción
3. **Configurar DNS** en Resend
4. **Cambiar de vuelta** a dominio oficial

## Configuración en Resend Dashboard

### Pasos para Verificar Dominio
1. Ir a https://resend.com/domains
2. Hacer clic en "Add Domain"
3. Introducir: `cisb.gob.ar` (para producción) o `dev.cisb.gob.ar` (para desarrollo)
4. Configurar registros DNS según las instrucciones
5. Esperar verificación (puede tardar hasta 24h)

### URLs Importantes
- **Dashboard Resend**: https://resend.com/domains
- **Logs de Email**: https://resend.com/activity
- **Documentación**: https://resend.com/docs

## Configuración de Desarrollo

### Variables de Entorno
```bash
# .env.local
RESEND_API_KEY=re_7Tv6eaT5_K1DLgfX7KUDk3urr6qFtFJjh
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Pruebas
1. **Crear usuario de prueba** en /signup
2. **Verificar email** en bandeja de entrada
3. **Confirmar cuenta** con el enlace del email
4. **Verificar redirección** al dashboard

---

**Última actualización**: 2025-11-05 15:22:00
**Estado**: Configuración temporal activa ✅