# PROMPT COMPLETO PARA CURSOR
## App de Escritorio — Mensajería Masiva WhatsApp Business
## Cliente: Punto Gardenia | San Rafael, Mendoza

---

> ⚠️ LO ÚNICO QUE EL USUARIO DEBE HACER MANUALMENTE:
> Crear la app en developers.facebook.com y obtener:
> - Phone Number ID
> - Access Token
> Todo lo demás lo configura esta app automáticamente.

---

## ¿QUÉ ES ESTA APP?

Una aplicación de escritorio para Windows construida con **Electron + React + SQLite**.
No necesita servidor, no necesita internet para correr (solo para enviar mensajes a Meta).
Se instala como cualquier programa de Windows y queda como acceso directo en el escritorio.

Permite a Punto Gardenia enviar mensajes masivos por WhatsApp Business a sus clientes
con dos modos: Manual (gratuito) y Automático (vía Meta API).

---

## STACK TECNOLÓGICO

- **Electron** — App de escritorio Windows
- **React + Vite** — Frontend (interfaz)
- **TailwindCSS** — Estilos
- **Express** — Backend que corre DENTRO de Electron (mismo proceso)
- **SQLite + Prisma** — Base de datos local (un solo archivo .db)
- **electron-builder** — Para generar el instalador .exe
- **node-fetch** — Para llamadas HTTP a Meta API

---

## ESTRUCTURA DE CARPETAS A CREAR

```
whatsapp-gardenia/
├── electron/
│   ├── main.js           → Proceso principal Electron
│   └── preload.js        → Bridge seguro
├── src/
│   ├── frontend/         → React app
│   │   ├── pages/
│   │   │   ├── Setup.jsx        → Pantalla de configuración inicial
│   │   │   ├── Dashboard.jsx    → Inicio con resumen
│   │   │   ├── Contacts.jsx     → Gestión de contactos
│   │   │   ├── Campaigns.jsx    → Lista de campañas
│   │   │   ├── NewCampaign.jsx  → Crear campaña
│   │   │   ├── CampaignDetail.jsx → Detalle + progreso
│   │   │   └── Templates.jsx    → Ver templates aprobados
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ContactImporter.jsx
│   │   │   ├── ManualSendPanel.jsx
│   │   │   └── AutoSendPanel.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── backend/          → Express API
│       ├── app.js        → Express setup
│       ├── routes/
│       │   ├── auth.js
│       │   ├── contacts.js
│       │   ├── campaigns.js
│       │   ├── templates.js
│       │   └── config.js
│       ├── services/
│       │   └── whatsappService.js
│       └── middleware/
│           └── auth.js
├── prisma/
│   └── schema.prisma
├── package.json
└── vite.config.js
```

---

## PASO 1 — CONFIGURAR package.json

```json
{
  "name": "whatsapp-gardenia",
  "version": "1.0.0",
  "description": "Sistema de mensajería masiva WhatsApp - Punto Gardenia",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "build": "vite build",
    "build:electron": "npm run build && electron-builder --win",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5",
    "csv-parse": "^5.5.0",
    "node-fetch": "^2.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^8.0.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "postcss": "^8.4.0",
    "prisma": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  },
  "build": {
    "appId": "com.puntogardenia.whatsapp",
    "productName": "WhatsApp Gardenia",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "shortcutName": "WhatsApp Gardenia"
    },
    "files": [
      "electron/**/*",
      "dist/**/*",
      "src/backend/**/*",
      "prisma/**/*",
      "node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "prisma",
        "to": "prisma"
      }
    ]
  }
}
```

---

## PASO 2 — SCHEMA PRISMA (SQLite local)

Crear `/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Config {
  id                  String   @id @default("main")
  phoneNumberId       String   @default("")
  accessToken         String   @default("")
  wabaId              String   @default("")
  apiVersion          String   @default("v19.0")
  businessName        String   @default("Punto Gardenia")
  isConfigured        Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  campaigns Campaign[]
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  phone     String
  group     String   @default("General")
  notes     String   @default("")
  createdAt DateTime @default(now())
}

model Template {
  id        String   @id @default(cuid())
  name      String   @unique
  body      String
  variables String   @default("[]")
  status    String   @default("pending")
  category  String   @default("MARKETING")
  createdAt DateTime @default(now())
}

model Campaign {
  id           String       @id @default(cuid())
  name         String
  templateName String
  mode         String       @default("manual")
  status       String       @default("draft")
  totalCount   Int          @default(0)
  sentCount    Int          @default(0)
  failedCount  Int          @default(0)
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  logs         MessageLog[]
  contactIds   String       @default("[]")
  variables    String       @default("{}")
  createdAt    DateTime     @default(now())
  sentAt       DateTime?
}

model MessageLog {
  id         String   @id @default(cuid())
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  phone      String
  name       String
  status     String
  error      String   @default("")
  waMessageId String  @default("")
  sentAt     DateTime @default(now())
}
```

---

## PASO 3 — ELECTRON MAIN.JS

Crear `/electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

// Iniciar backend Express dentro de Electron
let backendStarted = false

const startBackend = () => {
  if (backendStarted) return
  backendStarted = true

  // Configurar variable de entorno para SQLite
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'gardenia.db')
  process.env.DATABASE_URL = `file:${dbPath}`
  process.env.JWT_SECRET = 'gardenia-secret-2026-muy-seguro'
  process.env.PORT = '3721'

  // Correr migraciones de Prisma al iniciar
  try {
    const { execSync } = require('child_process')
    execSync('npx prisma migrate deploy', {
      cwd: app.isPackaged ? process.resourcesPath : __dirname + '/..',
      env: { ...process.env }
    })
  } catch (e) {
    console.log('Migrate error (puede ser normal):', e.message)
  }

  // Iniciar Express
  const expressApp = require('../src/backend/app')
  expressApp.listen(3721, () => {
    console.log('Backend corriendo en puerto 3721')
  })
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../assets/icon.ico')
  })

  // En desarrollo carga Vite dev server, en producción carga el build
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  startBackend()
  setTimeout(() => {
    createWindow()
  }, 1000) // Esperar que el backend arranque
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC para controles de ventana (ya que titleBarStyle es hidden)
ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize()
})
ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window-close', (event) => {
  BrowserWindow.fromWebContents(event.sender).close()
})
```

---

## PASO 4 — PRELOAD.JS

Crear `/electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})
```

---

## PASO 5 — BACKEND EXPRESS

Crear `/src/backend/app.js`:

```javascript
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/contacts', require('./routes/contacts'))
app.use('/api/campaigns', require('./routes/campaigns'))
app.use('/api/templates', require('./routes/templates'))
app.use('/api/config', require('./routes/config'))

module.exports = app
```

---

## PASO 6 — SERVICIO DE WHATSAPP

Crear `/src/backend/services/whatsappService.js`:

```javascript
const fetch = require('node-fetch')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Obtener config actual de la base de datos
const getConfig = async () => {
  return await prisma.config.findUnique({ where: { id: 'main' } })
}

// ─── Enviar un template a un número ─────────────────────────────────────────
const sendTemplate = async (phone, templateName, variables = []) => {
  const config = await getConfig()
  if (!config || !config.isConfigured) {
    throw new Error('La app no está configurada. Ingresá el Phone Number ID y Access Token.')
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_AR' },
      components: variables.length > 0 ? [{
        type: 'body',
        parameters: variables.map(v => ({ type: 'text', text: String(v) }))
      }] : []
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || `Error ${res.status}`)
  }

  return data
}

// ─── Normalizar número argentino ─────────────────────────────────────────────
// Convierte cualquier formato a 549XXXXXXXXXX
const normalizePhone = (phone) => {
  let clean = phone.replace(/\D/g, '') // solo números
  if (clean.startsWith('0')) clean = clean.slice(1)
  if (clean.startsWith('15')) clean = clean.slice(2)
  if (!clean.startsWith('549')) {
    if (clean.startsWith('9')) clean = '54' + clean
    else clean = '549' + clean
  }
  return clean
}

// ─── Generar link manual wa.me ───────────────────────────────────────────────
const generateManualLink = (phone, message) => {
  const normalized = normalizePhone(phone)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

// ─── Obtener templates aprobados desde Meta ──────────────────────────────────
const getMetaTemplates = async () => {
  const config = await getConfig()
  if (!config?.isConfigured) return []

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?limit=50`

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.accessToken}` }
  })

  const data = await res.json()
  return data.data || []
}

// ─── Envío masivo con delay anti-spam ───────────────────────────────────────
const sendBulk = async ({ contacts, templateName, variables, campaignId, onProgress }) => {
  const results = []

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]

    try {
      // Reemplazar variables del template con datos del contacto
      // Variables esperadas: [contact.name, ...otrasVariables]
      const resolvedVars = variables.map(v =>
        v === '{{nombre}}' ? contact.name : v
      )

      const result = await sendTemplate(contact.phone, templateName, resolvedVars)

      results.push({
        phone: contact.phone,
        name: contact.name,
        status: 'sent',
        waMessageId: result.messages?.[0]?.id || ''
      })
    } catch (error) {
      results.push({
        phone: contact.phone,
        name: contact.name,
        status: 'failed',
        error: error.message
      })
    }

    // Actualizar progreso en DB
    if (onProgress) await onProgress(i + 1, contacts.length)

    // Delay 1.5s entre mensajes para no disparar filtros de Meta
    if (i < contacts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  return results
}

// ─── Test de conexión ────────────────────────────────────────────────────────
const testConnection = async () => {
  const config = await getConfig()
  if (!config?.isConfigured) throw new Error('No configurado')

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.accessToken}` }
  })

  if (!res.ok) throw new Error('Credenciales inválidas')
  return await res.json()
}

module.exports = { sendTemplate, sendBulk, generateManualLink, getMetaTemplates, testConnection, normalizePhone }
```

---

## PASO 7 — RUTAS DEL BACKEND

### `/src/backend/routes/config.js`
```javascript
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { testConnection, getMetaTemplates } = require('../services/whatsappService')
const prisma = new PrismaClient()

// Obtener configuración actual
router.get('/', async (req, res) => {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'main' } })
    if (!config) return res.json({ isConfigured: false })

    // No enviar el token completo al frontend por seguridad
    res.json({
      ...config,
      accessToken: config.accessToken ? '***configurado***' : ''
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Guardar configuración
router.post('/', async (req, res) => {
  try {
    const { phoneNumberId, accessToken, wabaId, apiVersion, businessName } = req.body

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: 'Phone Number ID y Access Token son obligatorios' })
    }

    const config = await prisma.config.upsert({
      where: { id: 'main' },
      update: { phoneNumberId, accessToken, wabaId, apiVersion: apiVersion || 'v19.0', businessName, isConfigured: true },
      create: { id: 'main', phoneNumberId, accessToken, wabaId, apiVersion: apiVersion || 'v19.0', businessName, isConfigured: true }
    })

    res.json({ success: true, isConfigured: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Test de conexión con Meta
router.get('/test', async (req, res) => {
  try {
    const data = await testConnection()
    res.json({ success: true, phoneData: data })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// Obtener templates aprobados desde Meta
router.get('/templates', async (req, res) => {
  try {
    const templates = await getMetaTemplates()
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
```

### `/src/backend/routes/contacts.js`
```javascript
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const multer = require('multer')
const { parse } = require('csv-parse/sync')
const { normalizePhone } = require('../services/whatsappService')
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage() })

// Listar contactos
router.get('/', async (req, res) => {
  const { group } = req.query
  const where = group ? { group } : {}
  const contacts = await prisma.contact.findMany({ where, orderBy: { name: 'asc' } })
  res.json(contacts)
})

// Crear contacto
router.post('/', async (req, res) => {
  try {
    const { name, phone, group, notes } = req.body
    const contact = await prisma.contact.create({
      data: { name, phone: normalizePhone(phone), group: group || 'General', notes: notes || '' }
    })
    res.json(contact)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Importar CSV
// CSV esperado: nombre,telefono,grupo
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const content = req.file.buffer.toString('utf-8')
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true })

    const contacts = records.map(r => ({
      name: r.nombre || r.name || r.Nombre || '',
      phone: normalizePhone(r.telefono || r.phone || r.Telefono || ''),
      group: r.grupo || r.group || r.Grupo || 'General',
      notes: r.notas || r.notes || ''
    })).filter(c => c.name && c.phone)

    const created = await prisma.contact.createMany({ data: contacts, skipDuplicates: true })
    res.json({ imported: created.count, total: contacts.length })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Eliminar contacto
router.delete('/:id', async (req, res) => {
  await prisma.contact.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Listar grupos
router.get('/groups', async (req, res) => {
  const groups = await prisma.contact.groupBy({ by: ['group'] })
  res.json(groups.map(g => g.group))
})

module.exports = router
```

### `/src/backend/routes/campaigns.js`
```javascript
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { sendBulk, generateManualLink } = require('../services/whatsappService')
const prisma = new PrismaClient()

// Listar campañas
router.get('/', async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' }
  })
  res.json(campaigns)
})

// Crear campaña
router.post('/', async (req, res) => {
  try {
    const { name, templateName, mode, contactIds, variables } = req.body
    const campaign = await prisma.campaign.create({
      data: {
        name,
        templateName,
        mode: mode || 'manual',
        status: 'draft',
        userId: 'default',
        contactIds: JSON.stringify(contactIds || []),
        variables: JSON.stringify(variables || {}),
        totalCount: contactIds?.length || 0
      }
    })
    res.json(campaign)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Ver detalle de campaña
router.get('/:id', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: { logs: true }
  })
  res.json(campaign)
})

// Ver progreso de campaña (polling)
router.get('/:id/progress', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
  if (!campaign) return res.status(404).json({ error: 'No encontrada' })

  res.json({
    status: campaign.status,
    total: campaign.totalCount,
    sent: campaign.sentCount,
    failed: campaign.failedCount,
    percent: campaign.totalCount > 0
      ? Math.round((campaign.sentCount / campaign.totalCount) * 100)
      : 0
  })
})

// Generar links para modo manual
router.post('/:id/manual-links', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
  if (!campaign) return res.status(404).json({ error: 'No encontrada' })

  const contactIds = JSON.parse(campaign.contactIds)
  const contacts = await prisma.contact.findMany({ where: { id: { in: contactIds } } })
  const variables = JSON.parse(campaign.variables)

  // Construir mensaje reemplazando variables
  let message = variables.messageText || ''

  const links = contacts.map(c => ({
    name: c.name,
    phone: c.phone,
    link: generateManualLink(c.phone, message.replace('{{nombre}}', c.name))
  }))

  res.json(links)
})

// DISPARAR envío automático
router.post('/:id/send', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
  if (!campaign) return res.status(404).json({ error: 'No encontrada' })
  if (campaign.status === 'sending') return res.status(400).json({ error: 'Ya está enviando' })

  const contactIds = JSON.parse(campaign.contactIds)
  const contacts = await prisma.contact.findMany({ where: { id: { in: contactIds } } })
  const variables = JSON.parse(campaign.variables)

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: 'sending', totalCount: contacts.length, sentCount: 0, failedCount: 0 }
  })

  // Responder inmediatamente — el envío sigue en segundo plano
  res.json({ message: 'Envío iniciado', campaignId: campaign.id })

  // Envío asíncrono en segundo plano
  sendBulk({
    contacts,
    templateName: campaign.templateName,
    variables: variables.templateVars || [],
    campaignId: campaign.id,
    onProgress: async (current, total) => {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { sentCount: current }
      })
    }
  }).then(async (results) => {
    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    await prisma.messageLog.createMany({
      data: results.map(r => ({
        campaignId: campaign.id,
        phone: r.phone,
        name: r.name,
        status: r.status,
        error: r.error || '',
        waMessageId: r.waMessageId || ''
      }))
    })

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sent', sentCount: sent, failedCount: failed, sentAt: new Date() }
    })
  }).catch(async (err) => {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' }
    })
  })
})

// Eliminar campaña
router.delete('/:id', async (req, res) => {
  await prisma.messageLog.deleteMany({ where: { campaignId: req.params.id } })
  await prisma.campaign.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

module.exports = router
```

---

## PASO 8 — FRONTEND REACT

### Diseño visual de la app
- Colores: Verde oscuro `#1A5C2A`, naranja `#E65C00`, fondo oscuro `#0f172a`
- Fuente: 'DM Sans' para textos, 'Space Mono' para datos técnicos
- Sidebar izquierdo con navegación
- Área de contenido con fondo `#1e293b`
- Cards con borde sutil y sombra
- Barra de título custom (sin titlebar nativo de Windows)

### Página de Setup (`/setup`) — PRIMERA VEZ
Mostrar esta pantalla si `isConfigured === false`. Debe tener:

```jsx
// Setup.jsx
// Campos:
// - Phone Number ID (input text)
// - Access Token (input password con ojo para ver/ocultar)
// - WABA ID (opcional)
// - Nombre del negocio (default: "Punto Gardenia")
// Botón: "Probar conexión" → llama GET /api/config/test
// Si la conexión es exitosa → botón "Guardar y continuar"
// Mostrar estado visual: ✅ Conectado / ❌ Error con el mensaje de Meta

// Instrucciones visibles en la pantalla:
// "¿Dónde encontrar estos datos?"
// 1. Ir a developers.facebook.com
// 2. Seleccionar tu app → WhatsApp → Configuración de API
// 3. Copiar Phone Number ID y generar Access Token
```

### Dashboard (`/`)
```jsx
// Dashboard.jsx
// Cards con estadísticas:
// - Total contactos
// - Campañas enviadas este mes
// - Mensajes enviados este mes
// - Último envío (fecha)

// Botón grande "Nueva Campaña"
// Lista de últimas 5 campañas con estado (chip de color)
```

### Contactos (`/contacts`)
```jsx
// Contacts.jsx
// Tabla de contactos con columnas: Nombre, Teléfono, Grupo, Fecha
// Barra de búsqueda
// Filtro por grupo (dropdown)
// Botón "Importar CSV" → abre modal con drag & drop
// Botón "Agregar manualmente" → abre modal con formulario
// Botón eliminar por fila

// Modal de importación CSV:
// Drag & drop o selección de archivo
// Preview de primeras 5 filas
// Mapeo de columnas (nombre, teléfono, grupo)
// Botón "Importar X contactos"
```

### Nueva Campaña (`/campaigns/new`) — WIZARD EN 4 PASOS
```jsx
// Paso 1: Información básica
//   - Nombre de la campaña
//   - Modo: Manual (gratis) o Automático (API Meta)

// Paso 2: Seleccionar contactos
//   - Todos los contactos
//   - Por grupo (checkbox de grupos)
//   - Muestra contador: "X contactos seleccionados"

// Paso 3: Mensaje
//   Si modo AUTOMÁTICO:
//     - Dropdown con templates aprobados (cargados desde /api/config/templates)
//     - Preview del template con variables de ejemplo
//   Si modo MANUAL:
//     - Textarea para escribir el mensaje libremente
//     - Botón "Insertar {{nombre}}" para agregar variable

// Paso 4: Confirmar y enviar
//   - Resumen: nombre campaña, modo, X contactos, template
//   - Si MANUAL: botón "Crear campaña"
//   - Si AUTOMÁTICO: botón "Enviar ahora" (naranja, con ícono de avión)
```

### Detalle de Campaña (`/campaigns/:id`)
```jsx
// Si modo MANUAL:
//   Lista de tarjetas, una por contacto
//   Cada tarjeta muestra: Nombre, Teléfono, botón "Abrir WhatsApp"
//   El botón abre el link wa.me/ en el navegador
//   Checkbox para marcar como "enviado manualmente"
//   Contador: "X de Y enviados"

// Si modo AUTOMÁTICO y status === 'sending':
//   Barra de progreso animada con porcentaje
//   Contador en tiempo real: "Enviando mensaje 234 de 500..."
//   Polling cada 2 segundos a /api/campaigns/:id/progress
//   Botón deshabilitado hasta que termine

// Cuando status === 'sent':
//   Resumen: X enviados ✅ | X fallidos ❌
//   Tabla de logs con estado por contacto
//   Botón "Exportar resultado CSV"
```

---

## PASO 9 — COMPONENTE TITLEBAR CUSTOM

```jsx
// components/TitleBar.jsx
// Barra de título custom (ya que usamos frame: false en Electron)
// Debe tener:
// - Logo / nombre "WhatsApp Gardenia" a la izquierda
// - Botones minimize, maximize, close a la derecha (estilo Windows)
// - Usa window.electronAPI.minimize(), .maximize(), .close()
// - Background: #0f172a
// - Draggable: style={{ WebkitAppRegion: 'drag' }}
// - Botones NO draggables: style={{ WebkitAppRegion: 'no-drag' }}
```

---

## PASO 10 — VITE CONFIG

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // IMPORTANTE para que Electron cargue bien los assets
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3721'  // Proxy al backend Express
    }
  },
  build: {
    outDir: 'dist'
  }
})
```

---

## PASO 11 — TAILWIND CONFIG

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/frontend/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gardenia: {
          green: '#1A5C2A',
          'green-mid': '#2E8B3A',
          'green-light': '#4CAF50',
          orange: '#E65C00',
          'orange-light': '#FF8C00',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      }
    }
  }
}
```

---

## PASO 12 — COMANDOS PARA CORRER

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npx prisma generate

# 3. Correr en desarrollo (abre ventana Electron + Vite)
npm run dev

# 4. Compilar para producción (genera instalador .exe en /dist_electron)
npm run build:electron
```

---

## FLUJO COMPLETO DE LA APP

```
Primera vez que abre la app:
  → Pantalla de Setup
  → El usuario pega Phone Number ID y Access Token de Meta
  → Toca "Probar conexión" → ✅ si funciona
  → Guarda y va al Dashboard

Uso diario:
  → Dashboard muestra resumen
  → Va a Contactos → importa su lista de clientes CSV
  → Crea Nueva Campaña → elige template → selecciona contactos
  → Si MANUAL: ve los links wa.me/ y los abre uno por uno desde su celu
  → Si AUTOMÁTICO: hace clic en "Enviar" → barra de progreso → fin
```

---

## LO ÚNICO QUE QUEDA FUERA DE LA APP (hacer manual en Meta)

```
1. Ir a developers.facebook.com
2. Crear app → tipo Business
3. Agregar producto WhatsApp
4. Copiar Phone Number ID → pegarlo en Setup de la app
5. Generar Access Token → pegarlo en Setup de la app
6. Crear templates de mensaje en Meta → esperar aprobación 1-2 días
7. Una vez aprobados, aparecen solos en el dropdown de la app
```

Todo lo demás es automático dentro de la app.

---

*Sistema desarrollado para Punto Gardenia — San Rafael, Mendoza*
*puntogardenia.com.ar | Av. Sarmiento 450*
