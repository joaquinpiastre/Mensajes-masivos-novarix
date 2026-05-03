# Setup Local - WhatsApp Masivo Punto Gardenia

## 1) Frontend
- `cd frontend`
- `npm install`
- copiar `.env.example` a `.env`
- `npm run dev`

## 2) Backend
- `cd backend`
- `npm install`
- copiar `.env.example` a `.env`
- configurar `DATABASE_URL` con PostgreSQL local
- `npm run prisma:generate`
- `npm run prisma:migrate -- --name init`
- `npm run dev`

## 3) Endpoints base listos
- Auth: `/api/auth/login`, `/api/auth/me`. Registro publico deshabilitado (`/api/auth/register` responde 403). Primer admin: `POST /api/auth/bootstrap` con `SETUP_SECRET` (solo base vacia). Resto de cuentas: panel Admin.
- Contacts: `/api/contacts` + import CSV y groups
- Campaigns: listado, alta, detalle, send, preview
- WhatsApp: `send-message`, `bulk-send`
- Payments: `create-preference`, `webhook`, `history`
- Templates: listado, alta, edicion y baja
