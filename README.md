# Trimly

Trimly es una demo full-stack de acortador de enlaces construida con Astro, React y Postgres, pensada para correr en local con Docker Compose.

## Qué incluye

- Landing pública
- Demo real para crear enlaces
- Redirect público en `/t/:slug`
- Stats públicas en `/s/:slug`
- Borrado con `managementToken` privado
- Rate limit de creación por IP
- Persistencia en Postgres

## Requisitos

- Node.js 22+
- pnpm 11+
- Docker y Docker Compose

## Arranque rápido

### Con Docker

```bash
docker compose up --build
```

Luego abre:

- `http://localhost:3000/`
- `http://localhost:3000/demo`
- `http://localhost:3000/s/demo`

### Produccion local con Docker

Si quieres probar una configuracion mas parecida a produccion, usa:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### En local

Si prefieres correrlo sin Docker, necesitas una base Postgres disponible y esta conexión:

```bash
postgres://trimly:trimly@127.0.0.1:5433/trimly
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm db:migrate
```

## Deploy en Railway

1. Crea un proyecto en Railway.
2. Agrega un servicio web conectado a este repositorio.
3. Agrega PostgreSQL en el mismo proyecto.
4. Railway detectara automaticamente el `Dockerfile` del repo.
5. Configura estas variables en el servicio web:

```bash
APP_BASE_URL=https://your-domain.example
DATABASE_URL=<reference to Railway Postgres>
IP_HASH_SALT=<long-random-secret>
PGSSL=true
CLEANUP_GRACE_DAYS=30
DEMO_EXPIRY_DAYS=7
RATE_LIMIT_MAX=3
RATE_LIMIT_WINDOW_HOURS=24
```

6. En Railway, activa `Public Networking` para el servicio web.
7. Agrega tu dominio personalizado.
8. Crea en tu DNS los registros `CNAME` y `TXT` que Railway te entregue.

Railway se encargara del certificado SSL automaticamente.

## Flujo de uso

1. Entra a `/demo`.
2. Pega una URL larga.
3. Opcionalmente define un alias.
4. Crea el enlace.
5. Guarda el `managementToken` si luego quieres borrarlo.
6. Abre el `shortUrl` para redirigir.
7. Abre el `statsUrl` para ver métricas públicas.

## Endpoints

### Crear enlace

`POST /api/links`

Request:

```json
{
  "destinationUrl": "https://example.com",
  "customAlias": "mi-alias",
  "source": "demo"
}
```

Response:

```json
{
  "slug": "mi-alias",
  "shortUrl": "http://localhost:3000/t/mi-alias",
  "statsUrl": "http://localhost:3000/s/mi-alias",
  "managementToken": "token-privado",
  "expiresAt": "2026-06-18T00:00:00.000Z"
}
```

### Ver estadísticas

`GET /api/links/:slug/stats`

Devuelve:

- metadatos del enlace
- total de clics
- último clic
- clicks por día
- top referrers
- top devices
- top countries

### Borrar enlace

`DELETE /api/links/:slug`

Request:

```json
{
  "managementToken": "token-privado"
}
```

### Redirect público

`GET /t/:slug`

### Stats públicas

`GET /s/:slug`

## Cómo se calculan las métricas

### Fuentes de tráfico

- Se usa el header `Referer`.
- Si no existe, se guarda como `Direct / sin referer`.
- Apps como Facebook o WhatsApp suelen quitar ese header, así que pueden aparecer como directas.

### Dispositivos

- `desktop`
- `mobile`
- `tablet`
- `bot`
- `cli`
- `unknown`

Los requests desde consola como `curl` se clasifican como `CLI`.

### Ubicaciones

- Primero se intentan headers geo del proxy/CDN.
- Luego `Accept-Language`.
- Luego un lookup externo si hay una IP pública real.
- Si no hay señal útil, queda `Sin país`.

En local es normal ver `Unknown` o `Sin país` cuando no existe una fuente geográfica confiable.

## Limitaciones conocidas

- `Referer` no siempre llega.
- Las apps móviles suelen ocultarlo.
- En redes privadas o `localhost` la geolocalización suele ser incompleta.
- Los clics viejos pueden seguir mostrando valores antiguos como `Unknown`.

## Verificación

Se validó con:

- `pnpm lint`
- `pnpm build`
- requests reales al servidor local
- requests dentro del contenedor Docker
