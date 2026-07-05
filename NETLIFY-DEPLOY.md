# Desplegar Income Monitor en Netlify

Ya preparé el repo para Netlify:

- `netlify.toml` — build del frontend (`randy-bank`) + rutas `/api/*` a la función
- `netlify/functions/api.ts` — envuelve el backend Express con `serverless-http`
- `artifacts/api-server` — se le agregó `serverless-http` como dependencia

Lo que falta son pasos que requieren tus propias cuentas/credenciales (no puedo hacerlos yo, no tengo acceso a internet):

## 1. Subir el proyecto a GitHub
```bash
cd Income-Monitor-main
git init
git add .
git commit -m "Initial commit"
gh repo create income-monitor --private --source=. --push
# o crea el repo manualmente en github.com y luego:
# git remote add origin https://github.com/TU_USUARIO/income-monitor.git
# git push -u origin main
```

## 2. Conectar el repo a Netlify
1. Entra a https://app.netlify.com → **Add new site → Import an existing project**
2. Elige GitHub y selecciona el repo
3. Netlify detectará `netlify.toml` automáticamente (build command y publish dir ya configurados)

## 3. Crear una base de datos Postgres
Netlify no aloja bases de datos. Opciones gratis/rápidas:
- **Neon** (https://neon.tech) — Postgres serverless, tier gratis generoso
- **Supabase** (https://supabase.com) — Postgres + extras

Copia el **connection string** que te den (empieza con `postgres://...`).

## 4. Variables de entorno en Netlify
En **Site settings → Environment variables**, agrega:
- `DATABASE_URL` = el connection string del paso 3

## 5. Deploy
Con el repo conectado, cada push a `main` dispara un build automático. También puedes forzar el primer deploy desde el dashboard de Netlify ("Trigger deploy").

## Nota sobre el backend
Hoy el backend solo tiene un endpoint (`/api/healthz`). Cualquier ruta nueva que agregues en `artifacts/api-server/src/routes` queda disponible automáticamente en `/api/...` a través de la misma función serverless — no hace falta tocar `netlify/functions/api.ts`.

## Nota sobre pnpm
`netlify.toml` ya incluye `corepack enable` para que Netlify use la versión de pnpm correcta sin configuración manual.
