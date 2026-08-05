# Pop Tennis — Ranking & Gamification

PWA mobile-first para registrar partidos de Pop Tennis, calcular ranking Elo dinámico, badges y penalización por inactividad.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage)
- Lucide Icons
- Vercel Cron para decay de puntos

## Setup

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. En **SQL Editor**, ejecutá el contenido de [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
3. En **Authentication → Providers**, habilitá Email (desactivá "Confirm email" para desarrollo rápido)
4. Copiá URL y keys desde **Project Settings → API**

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completá:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

### 4. Tests

```bash
npm test
```

### 5. Deploy (Vercel)

1. Conectá el repo a Vercel
2. Agregá las variables de entorno
3. El cron de inactividad corre diariamente a las 06:00 UTC (`vercel.json`)

Para probar el cron manualmente:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-app.vercel.app/api/cron/decay
```

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/ranking` | Tabla de posiciones con racha, fantasma 👻, filtro Histórico / Jugador del Mes |
| `/partido` | Wizard 3 pasos para cargar partido |
| `/historial` | Historial de partidos del usuario |
| `/reglas` | Reglas y scoring explicado para jugadores |
| `/perfil` | Perfil propio + medallas |
| `/perfil/[id]` | Perfil ajeno + Head-to-Head |

## Motor Elo

`K=32`, multiplicadores por formato (1.5×–0.8×) y bonus por sets corridos (1.2×). Dobles usa promedio de Elo del equipo.

## Decay por inactividad

Después de 14 días sin partidos: −25 pts por cada semana extra, con piso global de 600 pts (podés caer por debajo de tu `base_rating`).
