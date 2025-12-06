# 🎨 Sistema de Diseño - Hub Hospitalario

Esta guía documenta los patrones de diseño, tokens de color y convenciones de estilos utilizados en el Hub Hospitalario, con especial énfasis en el **modo oscuro**.

---

## 📋 Índice

1. [Paleta de Colores](#paleta-de-colores)
2. [Fondos y Superficies](#fondos-y-superficies)
3. [Tipografía](#tipografía)
4. [Componentes UI](#componentes-ui)
5. [Estados Interactivos](#estados-interactivos)
6. [Patrones Comunes](#patrones-comunes)
7. [Checklist de Modo Oscuro](#checklist-de-modo-oscuro)

---

## 🎨 Paleta de Colores

### Escala de Grises (Slate)

| Token | Light Mode | Dark Mode | Uso Principal |
|-------|------------|-----------|---------------|
| `slate-50` | `#f8fafc` | — | Fondos sutiles |
| `slate-100` | `#f1f5f9` | `dark:bg-slate-100` | Botones primarios invertidos |
| `slate-200` | `#e2e8f0` | `dark:text-slate-200` | Texto principal |
| `slate-300` | `#cbd5e1` | `dark:text-slate-300` | Texto secundario |
| `slate-400` | `#94a3b8` | `dark:text-slate-400` | Texto muted, placeholders |
| `slate-700` | `#334155` | `dark:border-slate-700` | Bordes sutiles |
| `slate-800` | `#1e293b` | `dark:border-slate-800` | Bordes principales, fondos de badges |
| `slate-900` | `#0f172a` | `dark:bg-slate-900` | Fondos de cards |
| `slate-950` | `#020617` | `dark:bg-slate-950` | Fondo base, inputs |

### Colores Semánticos

| Color | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| **Blue (Primary)** | `text-blue-600` | `dark:text-blue-400` | Acciones, links, hover |
| **Green (Success)** | `text-green-600` | `dark:text-green-400` | Publicado, éxito |
| **Red (Danger)** | `text-red-600` | `dark:text-red-400` | Eliminar, errores |
| **Yellow (Warning)** | `text-yellow-600` | `dark:text-yellow-400` | Alertas, revisión |

---

## 📦 Fondos y Superficies

### Jerarquía de Fondos

```
┌─────────────────────────────────────────────────┐
│  Nivel 0: Fondo Base                            │
│  Light: bg-gray-50 | Dark: dark:bg-slate-950    │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Nivel 1: Cards/Contenedores              │  │
│  │  Light: bg-white | Dark: dark:bg-slate-900│  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Nivel 2: Inputs/Selects            │  │  │
│  │  │  Light: bg-gray-50                  │  │  │
│  │  │  Dark: dark:bg-slate-950            │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Clases Estándar

```tsx
// Card principal
className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"

// Card/Contenedor con blur
className="bg-white dark:bg-slate-900/80 backdrop-blur-md"

// Input/Select
className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800"

// Badge secundario
className="bg-gray-100 dark:bg-slate-800"
```

---

## ✏️ Tipografía

### Jerarquía de Texto

| Elemento | Light Mode | Dark Mode | Clases |
|----------|------------|-----------|--------|
| **Título H1** | `text-gray-900` | `dark:text-slate-100` | `text-3xl font-bold` |
| **Título H2** | `text-gray-900` | `dark:text-slate-100` | `text-xl font-semibold` |
| **Texto Principal** | `text-gray-900` | `dark:text-slate-200` | `text-base` |
| **Texto Secundario** | `text-gray-600` | `dark:text-slate-300` | `text-sm` |
| **Texto Muted** | `text-muted-foreground` | `dark:text-slate-400` | `text-sm` |
| **Placeholder** | `placeholder:text-gray-400` | `dark:placeholder:text-slate-400` | — |

### Ejemplo de Uso

```tsx
// Título de página
<h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
  Título
</h1>

// Subtítulo descriptivo
<p className="text-muted-foreground dark:text-slate-400">
  Descripción del contenido
</p>

// Texto en card
<p className="text-sm text-gray-600 dark:text-slate-300">
  Contenido secundario
</p>
```

---

## 🧩 Componentes UI

### Botones

```tsx
// Botón Primario (invertido en dark)
<Button className="dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
  Acción Principal
</Button>

// Botón Ghost con icono
<Button 
  variant="ghost" 
  size="icon"
  className="dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
>
  <Icon />
</Button>

// Botón de acción (editar)
<Button 
  variant="ghost"
  className="hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
>
  <Edit />
</Button>

// Botón destructivo
<Button 
  variant="ghost"
  className="text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
>
  <Trash2 />
</Button>
```

### Inputs y Selects

```tsx
// Input estándar
<Input 
  className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 dark:text-slate-200 dark:placeholder:text-slate-400"
/>

// SelectTrigger
<SelectTrigger className="bg-gray-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
  <SelectValue placeholder="Seleccionar..." />
</SelectTrigger>

// SelectContent (ya configurado globalmente en select.tsx)
// Hereda: dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200
```

### Badges

```tsx
// Badge secundario estándar
<Badge 
  variant="secondary" 
  className="dark:bg-slate-800 dark:text-slate-200"
>
  Etiqueta
</Badge>

// Badge de estado (Borrador)
<Badge 
  variant="outline" 
  className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
>
  📝 Borrador
</Badge>

// Badge de estado (Publicado)
<Badge 
  variant="outline" 
  className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
>
  ✅ Publicado
</Badge>
```

### Cards

```tsx
<Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-400/30">
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

### Metric Cards (Dashboard)

Diseño premium para tarjetas de indicadores clave.

```tsx
// Contenedor del Icono (Tintado)
<div className={`p-2.5 rounded-xl bg-blue-500 bg-opacity-10 dark:bg-opacity-20`}>
  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
</div>

// Título de Métrica
<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-slate-400 mb-1">
  USUARIOS
</p>

// Valor Principal
<h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
  1,234
</h3>

// Subtítulo / Pie
<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
  Visitantes Únicos
</p>
```

### Tablas

```tsx
// Header de tabla
<TableHead className="dark:text-slate-400">
  Columna
</TableHead>

// Celda con texto principal
<TableCell className="font-medium dark:text-slate-200">
  Texto
</TableCell>

// Celda con texto secundario
<TableCell className="text-muted-foreground dark:text-slate-400">
  Fecha
</TableCell>
```

### Modales/Dialogs

```tsx
// DialogContent (configurado globalmente en dialog.tsx)
// Hereda: dark:bg-slate-950 dark:border-slate-700

// DialogClose button
// Hereda: dark:text-slate-400 dark:hover:text-slate-100
```

---

## 🖱️ Estados Interactivos

### Hover States

| Contexto | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Card** | `hover:shadow-xl` | `dark:hover:border-blue-400/30` |
| **Botón Ghost** | `hover:bg-gray-100` | `dark:hover:bg-slate-800` |
| **Acción Azul** | `hover:bg-blue-50 hover:text-blue-600` | `dark:hover:bg-blue-900/30 dark:hover:text-blue-400` |
| **Acción Roja** | `hover:bg-red-50 hover:text-red-600` | `dark:hover:bg-red-900/30 dark:hover:text-red-400` |
| **Link/Texto** | `hover:text-blue-600` | `dark:hover:text-blue-400` |

### Focus States

```tsx
// Input focus (usar ring)
className="focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
```

---

## 📐 Patrones Comunes

### Header de Módulo

```tsx
<div className="flex justify-between items-center gap-4">
  <div>
    <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
      Título del Módulo
    </h2>
    <p className="text-muted-foreground dark:text-slate-400">
      Descripción breve
    </p>
  </div>
  <Button className="dark:bg-slate-100 dark:text-slate-900">
    <Plus className="mr-2 h-4 w-4" /> Nueva Acción
  </Button>
</div>
```

### Contenedor de Filtros

```tsx
<div className="flex gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
  {/* Filtros */}
</div>
```

### Estado Vacío

```tsx
<div className="flex flex-col items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-dashed border-gray-300 dark:border-slate-700">
  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
    <Icon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
  </div>
  <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
    No hay elementos
  </h3>
</div>
```

---

## ✅ Checklist de Modo Oscuro

Usa esta lista al crear nuevos componentes para asegurarte de que el modo oscuro esté correctamente implementado:

- [ ] **Fondos**: ¿Los fondos tienen variantes `dark:`?
- [ ] **Bordes**: ¿Los bordes usan `dark:border-slate-800` o similar?
- [ ] **Texto Principal**: ¿El texto usa `dark:text-slate-200` o `dark:text-slate-100`?
- [ ] **Texto Secundario**: ¿El texto muted usa `dark:text-slate-400`?
- [ ] **Placeholders**: ¿Los inputs tienen `dark:placeholder:text-slate-400`?
- [ ] **Iconos**: ¿Los iconos tienen color explícito para dark mode?
- [ ] **Badges**: ¿Los badges tienen `dark:bg-` y `dark:text-`?
- [ ] **Hover States**: ¿Los estados hover funcionan en dark mode?
- [ ] **Focus States**: ¿Los rings de focus son visibles?

---

## 🔧 Configuración Global

### Componentes UI Modificados

Los siguientes componentes en `/src/components/ui/` ya tienen estilos de dark mode globales:

| Componente | Archivo | Cambios |
|------------|---------|---------|
| Dialog | `dialog.tsx` | `DialogContent`, `DialogClose` |
| Select | `select.tsx` | `SelectContent`, `SelectItem` |

### Variables CSS

El tema oscuro se activa automáticamente con la clase `dark` en el elemento raíz o según las preferencias del sistema (ver `next-themes`).

---

## 📚 Recursos Adicionales

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Slate Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

*Última actualización: Diciembre 2024*
