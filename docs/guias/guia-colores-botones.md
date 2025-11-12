# Guía de Colores para Botones - Hub Hospitalario

## Introducción
Este documento describe la paleta de colores utilizada para los botones en el proyecto Hub Hospitalario, con el objetivo de mantener una consistencia visual y una experiencia de usuario coherente en toda la aplicación.

## Tipos de Botones y sus Colores

### 1. Botones Primarios
- **Color Base**: `bg-blue-600`
- **Color Hover**: `hover:bg-blue-700`
- **Texto**: `text-white`
- **Dark Mode Base**: `dark:bg-blue-700`
- **Dark Mode Hover**: `dark:hover:bg-blue-800`
- **Efectos**: `shadow-md hover:shadow-lg transition-shadow`
- **Uso**: Acciones principales y de alta prioridad como "Guardar Cambios", "Editar Perfil"

### 2. Botones Secundarios (Outline)
- **Color de Borde**: `border-gray-300` (modo claro) / `dark:border-gray-600` (modo oscuro)
- **Color de Texto**: `text-gray-700` (modo claro) / `dark:text-gray-300` (modo oscuro)
- **Color de Fondo Hover**: `hover:bg-gray-50` (modo claro) / `dark:hover:bg-gray-700` (modo oscuro)
- **Transición**: `transition-colors`
- **Uso**: Acciones secundarias como "Cancelar", "Volver al Dashboard"

### 3. Botones de Acción Específica
- **Color Base**: `bg-gray-900` (para botones como "Cambiar Contraseña")
- **Dark Mode Base**: `dark:bg-gray-700`
- **Hover**: `hover:bg-gray-800` / `dark:hover:bg-gray-600`
- **Uso**: Acciones que no son primarias ni secundarias pero necesitan distinción

## Aplicaciones en la Página de Perfil

### Botón "Editar Perfil"
- Tipo: Primario
- Clase: `bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md hover:shadow-lg transition-shadow`

### Botón "Guardar Cambios" (en modal)
- Tipo: Primario
- Clase: `bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md hover:shadow-lg transition-shadow`

### Botón "Volver al Dashboard"
- Tipo: Secundario (outline)
- Clase: `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`

### Botón "Cancelar" (en modal)
- Tipo: Secundario (outline)
- Clase: `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`

### Botón "Cambiar Contraseña" (en modal)
- Tipo: Secundario (outline)
- Clase: `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`

## Consideraciones de Accesibilidad

### Contraste
- Todos los botones cumplen con las pautas WCAG 2.1 para contraste de color (mínimo 4.5:1 para texto normal)
- En modo oscuro, los colores han sido ajustados para mantener el mismo nivel de contraste

### Estados Interactivos
- Todos los botones tienen estados hover claramente definidos
- Los botones deshabilitados (disabled) tienen menor opacidad para indicar su estado
- Se incluyen efectos de transición suaves para mejorar la experiencia de usuario

## Estándares de Diseño

Esta guía se alinea con los principios de diseño del sistema Hub Hospitalario:
- Estilo monocromo con toques de color azul para acciones principales
- Consistencia con el estilo de Notion para una experiencia familiar
- Enfoque en la usabilidad y accesibilidad
- Adaptabilidad al modo oscuro y claro

## Mantenimiento

Cuando se agreguen nuevos botones a la interfaz:
1. Consultar esta guía para determinar el tipo de botón adecuado
2. Aplicar las clases correspondientes según el tipo
3. Si se requiere un nuevo tipo de botón, actualizar este documento para mantener la consistencia