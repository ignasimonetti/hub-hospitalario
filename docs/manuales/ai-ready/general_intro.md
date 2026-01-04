# 📄 Manual Maestro: Hub Hospitalario CISB (Para Entrenamiento de IA)

> **Instrucción para el usuario:** Copia este contenido íntegramente en herramientas como NotebookLM, ChatGPT o Claude para generar guiones de video, infografías o tutoriales interactivos.

---

## 1. 🏛️ Identidad y Propósito
El **Hub Hospitalario** es el cerebro digital del **Centro Integral de Salud Banda (CISB)** y una pieza clave en la modernización del Ministerio de Salud de Santiago del Estero, Argentina. 

*   **¿Qué es?** Una plataforma SaaS (Software as a Service) que centraliza la gestión hospitalaria.
*   **Visión:** "Un hospital sin papeles, con datos en tiempo real para decisiones valientes".
*   **Actores Clave:** 
    *   Sra. Ministra de Salud: **Dra. Natividad Nassif**.
    *   Institución: **Ministerio de Salud (GDE SDE)**.
    *   Tecnología: Desarrollado con Next.js 14 y PocketBase.

---

## 2. 🎨 Experiencia de Usuario (UX/UI)
La plataforma no es un sistema administrativo tradicional; es una herramienta de alta gama diseñada para el usuario moderno.
*   **Filosofía Notion:** Navegación fluida, sin recargas de página disruptivas. Todo sucede dentro de un "Workspace" unificado.
*   **Sidebar Inteligente:** Acceso constante a todos los módulos (Expedientes, Blog, Ayuda, Administración).
*   **Modo Oscuro Premium (Esencia Slate):** Diseño pensado para médicos y personal que trabaja de noche o en entornos con poca luz, reduciendo el cansancio visual.
*   **Navegación por Breadcrumbs:** El usuario siempre sabe dónde está (ej: Inicio > Expedientes > Nuevo).

---

## 3. 🔐 Seguridad y Jerarquía (RBAC)
El sistema utiliza un Control de Acceso Basado en Roles (RBAC) con niveles de poder del 1 al 10:
*   **Nivel 1-2:** Usuarios básicos y servicios generales (limpieza, mantenimiento).
*   **Nivel 4-5:** Personal administrativo y enfermería.
*   **Nivel 6-7:** Médicos y Especialistas Senior (con capacidad de firma y autorizaciones).
*   **Nivel 8-10:** Directores de Hospital y Administradores del Sistema (Super Admin).

---

## 🧩 4. Panorama de Módulos
1.  **Mesa de Entrada (Expedientes):** Seguimiento de trámites, licitaciones y resoluciones ministeriales.
2.  **Portal de Contenidos:** Noticias, protocolos y circulares oficiales del hospital.
3.  **Suministros (Logística + Compras):** Control de stock inteligente y transparencia en las contrataciones públicas.
4.  **Centro de Ayuda:** Integrado para soporte inmediato y manuales interactivos.

---

## 🚀 PROMPT PARA GENERAR VIDEO TUTORIAL (MAESTRO)

```text
Actúa como un Productor Audiovisual de EdTech. 
Usa el "Manual Maestro: Hub Hospitalario" adjunto para crear un guion de video "Explainer" de 2 minutos.

REQUISITOS DEL GUION:
1. ESTRUCTURA: 
   - Intro (0-20s): El desafío de la burocracia vs. la agilidad del Hub.
   - Core (20-80s): Mostrar la interfaz (Modo oscuro, Sidebar) y la facilidad de uso.
   - Seguridad (80-100s): Explicar los Roles (Niveles 1-10) de forma sencilla.
   - Outro (100-120s): El impacto en la salud pública de Santiago del Estero.

2. TONO: Inspirador, moderno, eficiente y local (Mencionar CISB y Ministerio de Salud).

3. ELEMENTOS VISUALES SUGERIDOS:
   - "Fly-through" por la interfaz (Layout tipo Notion).
   - Metáfora visual de la jerarquía de roles.
   - Transición del caos de papeles al orden digital.

4. CALL TO ACTION: "Entra a tu dashboard y sé parte de la transformación digital de nuestra salud".
```
