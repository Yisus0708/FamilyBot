# 🏠 FamilyBot

El asistente que organiza tu familia. Una app web para gestionar horarios, gastos, compras, mascotas y recordatorios del hogar, con un asistente de IA (Gemini) integrado.

## Funcionalidades

- 👪 **Miembros** — registro de los integrantes de la familia.
- 📅 **Horarios** — agenda semanal familiar.
- 🔔 **Recordatorios** — alertas automáticas.
- 🛒 **Compras** — lista de compras compartida.
- 💰 **Gastos** — control de gastos del hogar.
- 🐾 **Mascotas** — registro de mascotas y su estado de vacunación.
- 🤖 **Asistente IA** — chat con Gemini que responde usando el contexto de tu familia.
- ⚙️ **Ajustes** — preferencias del panel y gestión de la API Key de Gemini.

## Tecnología

Sitio 100% estático: HTML, CSS y JavaScript sin frameworks ni build step. Los datos (usuarios, miembros, horarios, gastos, mascotas, etc.) se guardan en el `localStorage` del navegador — no hay backend ni base de datos.

## Uso local

Al ser un sitio estático, basta con servirlo con cualquier servidor HTTP simple (abrirlo directo como `file://` también funciona, aunque se recomienda un servidor local):

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Configurar el Asistente IA

FamilyBot usa la API de **Google Gemini**. Necesitas tu propia API Key:

1. Consigue una clave gratis en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Al iniciar sesión por primera vez, la app te la pedirá.
3. Puedes verla o cambiarla luego desde **Ajustes → Clave de API de Gemini**.

La clave se guarda solo en tu navegador (`localStorage`), nunca en el servidor ni en el código.

## Despliegue

Al ser un sitio estático, se puede desplegar gratis en [Render](https://render.com) como **Static Site**:

- **Build Command**: (vacío)
- **Publish directory**: `.`

## Estructura del proyecto

```
familybot/
├── index.html          # Login / registro
├── css/style.css
├── js/                  # Lógica de la app (auth, api, cada módulo)
└── pages/               # Panel, miembros, horarios, gastos, mascotas, etc.
```
