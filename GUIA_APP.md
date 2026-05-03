# Guia de funcionamiento y ejecucion de la app

## Que es esta app

Esta aplicacion permite gestionar mensajes masivos por WhatsApp para Punto Gardenia.
Esta dividida en dos partes:

- `frontend`: interfaz web en React + Vite con dashboard operativo y asistentes.
- `backend`: API REST en Express + Prisma + PostgreSQL con trazabilidad por contacto.

## Como funciona (flujo general)

1. El usuario usa el `frontend` para autenticarse, cargar contactos, crear campanas y gestionar templates.
2. El `frontend` consume la API del `backend` usando `VITE_API_URL`.
3. El `backend` valida JWT para rutas protegidas y opera sobre la base de datos PostgreSQL via Prisma.
4. Desde el backend se ejecutan envios internos de WhatsApp (sin 360dialog) y trazabilidad de resultados por contacto.

## Funcionalidades profesionales incluidas

- Importador de contactos CSV/XLSX con:
  - preview antes de guardar,
  - mapeo de columnas,
  - reporte de filas invalidas y duplicadas,
  - historial de importaciones (`ImportJob`).
- Segmentacion de audiencia para campanas por:
  - grupos,
  - tags,
  - busqueda por texto,
  - filtro opt-in.
- Campanas con canal configurable:
  - `internal` (modo interno),
  - `meta_api` (opcional, preparado para adapter).
- Envio por lotes con logs por contacto (estado, proveedor, intento, error).
- Dashboard de operacion con KPI, actividad de campanas e incidencias de importacion.

## Requisitos previos

- Node.js 18+ (recomendado 20 LTS).
- npm.
- PostgreSQL: **en local** o **en la nube** (por ejemplo [Railway](https://railway.app)).

## Variables de entorno

### Frontend (`frontend/.env`)

Crear el archivo desde `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_MP_PUBLIC_KEY=tu_public_key_de_mercadopago
```

### Backend (`backend/.env`)

Crear el archivo desde `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_masivo
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=3001
MP_ACCESS_TOKEN=tu_access_token_de_mercadopago
MP_PUBLIC_KEY=tu_public_key_de_mercadopago
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

### Base de datos en Railway

1. En Railway, creá un proyecto y agregá el plugin **PostgreSQL** (o un servicio Postgres).
2. Abrí el servicio Postgres -> pestaña **Variables** (o **Connect**).
3. Copiá la variable **`DATABASE_URL`** que Railway genera.
   - Si vas a correr migraciones **desde tu PC** (fuera de la red interna de Railway), suele hacer falta la URL **pública**: buscá **`DATABASE_PUBLIC_URL`** o el botón **Connect** y elegí conexión TCP externa; pegá esa URL en `backend/.env` como `DATABASE_URL`.
4. Pegá esa URL en `backend/.env` en una sola línea (sin espacios extra).
5. Si al migrar ves errores de SSL, probá agregar al final de la URL: `?sslmode=require` (solo si la URL aún no lo trae).
6. En la carpeta `backend` ejecutá:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Las tablas se crean en la base de Railway. No hace falta tener Postgres instalado en tu máquina si solo usás Railway.

## Despliegue en la nube (Railway: Postgres + API + web)

Idea: un servicio **PostgreSQL** (ya lo tenés), un servicio **Node** con el **backend**, y otro con el **frontend** (sitio estático) o el mismo flujo con Vercel/Netlify para el front.

### 1) Subir el codigo a Git

Railway despliega desde un repositorio (GitHub/GitLab/Bitbucket). Hacé commit y subí el proyecto.

### 2) Servicio Backend (API)

1. En el proyecto de Railway: **Add service** -> **GitHub** y elegí el repo.
2. En **Settings** del servicio:
   - **Root Directory**: `backend` (si el repo tiene carpetas `backend/` y `frontend/`).
   - **Build Command** (o dejá que Nixpacks use el `build` de `package.json` si lo detecta):  
     `npm install` y luego en el primer deploy o en Build: `npm run build`  
     (el script `build` del backend ejecuta `prisma generate` y `prisma migrate deploy` para aplicar migraciones en la base de Railway).
   - **Start Command**: `npm start`
3. **Variables** del servicio backend (pestaña **Variables**):
   - Conectá la base: **Add variable** -> **Reference** -> elegí el recurso **Postgres** -> **`DATABASE_URL`** (Railway inyecta la URL correcta entre servicios).
   - **`JWT_SECRET`**: una cadena larga y secreta (generala vos).
   - **`APP_URL`**: URL publica del backend, por ejemplo `https://TU-SERVICIO-BACKEND.up.railway.app` (copiala del panel cuando el deploy termine, pestaña **Networking / Generate domain**).
   - **`FRONTEND_URL`**: URL publica del frontend cuando lo tengas (por ejemplo `https://TU-FRONT.up.railway.app`).
   - Opcional Mercado Pago si lo usás: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`.
4. **Networking**: activá **Generate Domain** para obtener HTTPS del API.
5. Comproba: `https://TU-DOMINIO-BACKEND.up.railway.app/health` debe responder `{"ok":true}`.

> En produccion las migraciones deben aplicarse con **`prisma migrate deploy`** (ya incluido en `npm run build` del backend). En tu PC seguis usando `npm run prisma:migrate` solo para desarrollo.

### 3) Servicio Frontend (React/Vite)

El valor **`VITE_API_URL`** se “hornea” en el build: tiene que ser la URL del API **con** `/api` al final, por ejemplo:

`https://TU-SERVICIO-BACKEND.up.railway.app/api`

1. **Add service** -> GitHub -> mismo repo.
2. **Root Directory**: `frontend`.
3. **Variables** (antes del build):
   - `VITE_API_URL` = la URL del paso anterior (con `/api`).
   - `VITE_MP_PUBLIC_KEY` si aplica.
4. Para un SPA en Vite, en Railway suele usarse **Static** o configurar:
   - **Build Command**: `npm install && npm run build`
   - **Publish directory / Output**: `dist`
5. Generá dominio publico para el frontend y actualizá en el backend la variable **`FRONTEND_URL`** con esa URL exacta (para redirects de pagos u otros enlaces).

### 4) Orden recomendado

1. Deploy **Postgres** (listo).
2. Deploy **backend**, linkear **`DATABASE_URL`**, correr build que aplica migraciones.
3. Copiar URL publica del API -> configurar **`APP_URL`** en backend.
4. Deploy **frontend** con **`VITE_API_URL`** apuntando al API.
5. Poner **`FRONTEND_URL`** en el backend con la URL final del front.

### 5) CORS

El backend usa `cors()` abierto; no hace falta tocar codigo para dominios de Railway. Si mas adelante restringis origenes, hay que configurarlo en `backend/src/app.js`.

### 6) Archivos ya preparados en el repo

- **Backend**: script `npm run build` (Prisma + migraciones en produccion), `prisma` en dependencias para que Railway pueda ejecutar migraciones, y [backend/nixpacks.toml](backend/nixpacks.toml) indicando build + start.
- **Frontend**: script `npm start` sirve la carpeta `dist` con SPA (`scripts/start-prod.mjs`) y [frontend/nixpacks.toml](frontend/nixpacks.toml).

### 7) Base solo desde tu PC vs desde Railway

- La URL **`postgres.railway.internal`** solo funciona **entre servicios dentro del mismo proyecto Railway**. Para `prisma migrate` desde tu notebook, usa **`DATABASE_PUBLIC_URL`** (o la URL externa que muestre Connect), no la interna.

### 8) Seguridad

Si alguna vez pegaste la contraseña de Postgres en un chat o en un commit, **rotá la contraseña** en Railway (Postgres -> Variables / Reset) y actualizá `DATABASE_URL`.

## Como correr la app (desarrollo)

Abrir **2 terminales**: una para backend y otra para frontend.

### 1) Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

> Si `prisma:migrate` falla por autenticacion, revisar `DATABASE_URL` (Railway: URL correcta publica vs interna). Si falla SSL, probar `?sslmode=require`.

El backend quedara corriendo en:
- `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend quedara corriendo en:
- `http://localhost:5173`

## Comandos utiles

### Backend

- Desarrollo: `npm run dev`
- Produccion local: `npm start`
- Tests: `npm test`
- Generar cliente Prisma: `npm run prisma:generate`
- Migraciones Prisma: `npm run prisma:migrate`
- Migraciones en produccion (Railway): `npm run prisma:migrate:deploy` (tambien corre dentro de `npm run build`)
- Prisma Studio: `npm run prisma:studio`
- Build produccion (genera Prisma + migraciones): `npm run build`

### Frontend

- Desarrollo: `npm run dev`
- Build: `npm run build`
- Preview de build: `npm run preview`
- Lint: `npm run lint`

## Troubleshooting rapido

- Si falla la base de datos, revisar `DATABASE_URL` y que PostgreSQL este encendido.
- Si falla login o rutas protegidas, revisar `JWT_SECRET` y token en frontend.
- Si el frontend no conecta al backend, verificar `VITE_API_URL` y puerto `3001`.
- Si fallan envios WhatsApp internos, validar que backend este levantado y que existan contactos cargados.
