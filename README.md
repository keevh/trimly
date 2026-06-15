# Trimly

Acortador de enlaces open source y self-hosted con estadísticas públicas, expiración automática y arranque local simple con Docker.

Trimly te permite crear enlaces cortos, compartirlos y consultar métricas básicas sin depender de una plataforma externa. Está pensado para personas y equipos que quieren controlar sus datos, desplegar su propia instancia y tener una base clara para extender el producto.

## Por qué Trimly

- **Self-hosted**: ejecútalo en tu propia infraestructura.
- **Open source**: revisa, adapta y mejora el código.
- **Simple de probar**: levanta app y base de datos con Docker Compose.
- **Con estadísticas**: cada enlace tiene una página pública de métricas.
- **Con control privado**: los enlaces pueden borrarse usando un `managementToken`.

## Características

- Creación de enlaces cortos desde una demo funcional.
- Alias personalizados para URLs más memorables.
- Redirect público en `/t/:slug`.
- Estadísticas públicas en `/s/:slug`.
- Borrado de enlaces con token privado.
- Rate limiting por IP para reducir abuso.
- Persistencia en Postgres.
- Expiración automática de enlaces demo.

## Inicio rápido

Requisitos:

- Node.js 22+
- pnpm 11+
- Docker y Docker Compose

Levanta Trimly con Docker:

```bash
docker compose up --build
```

Luego abre:

- `http://localhost:3000/`
- `http://localhost:3000/demo`

## Uso básico

1. Entra a `/demo`.
2. Pega una URL larga.
3. Define un alias opcional.
4. Crea el enlace corto.
5. Guarda el `managementToken` si quieres borrarlo después.
6. Comparte el enlace corto o revisa sus estadísticas públicas.

## Stack

- Astro
- React
- Postgres
- Tailwind CSS
- Docker
- pnpm

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `APP_BASE_URL` | URL base usada para construir enlaces públicos. |
| `DATABASE_URL` | Conexión a Postgres. |
| `IP_HASH_SALT` | Secreto usado para hashear IPs. |
| `PGSSL` | Activa SSL para conexiones Postgres cuando aplica. |
| `CLEANUP_GRACE_DAYS` | Días de gracia antes de eliminar enlaces expirados. |
| `DEMO_EXPIRY_DAYS` | Días de vida para enlaces creados desde la demo. |
| `RATE_LIMIT_MAX` | Máximo de enlaces por IP dentro de la ventana definida. |
| `RATE_LIMIT_WINDOW_HOURS` | Ventana de tiempo del rate limit, en horas. |

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm db:migrate
```

## API

Trimly expone una API pequeña para el flujo principal:

- `POST /api/links`: crea un enlace corto.
- `GET /api/links/:slug/stats`: devuelve estadísticas públicas.
- `DELETE /api/links/:slug`: borra un enlace usando `managementToken`.

## Roadmap

- [ ] Códigos QR por enlace.
- [ ] Protección por contraseña.
- [ ] Edición de enlaces existentes.
- [ ] Dashboard con autenticación.
- [ ] Exportación de métricas.
- [ ] API keys para integraciones.
- [ ] Configuración de expiración por enlace.
- [ ] Healthcheck para despliegues self-hosted.
- [ ] Imagen Docker publicada.
- [ ] Script de instalación y actualización para instancias self-hosted.
- [ ] Scripts de backup y restore para Postgres.
- [ ] Ejemplos de reverse proxy con HTTPS.
- [ ] Migraciones versionadas para actualizar la base de datos sin perder datos.
- [ ] Configuración de retención de enlaces y métricas.
- [ ] Modo privado para desactivar la creación pública de enlaces.

## Contribuir

Las contribuciones son bienvenidas. Puedes abrir un issue para proponer mejoras, reportar bugs o discutir nuevas funcionalidades antes de enviar un cambio grande.

Para trabajar en local, instala dependencias, levanta los servicios necesarios y valida tus cambios antes de abrir un pull request:

```bash
pnpm install
pnpm lint
pnpm build
```

## Licencia

Trimly está licenciado bajo MIT.
