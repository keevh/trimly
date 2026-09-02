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

## Instalación rápida en Linux

Requisitos:

- Docker Engine activo y Docker Compose instalados.
- `curl` y una terminal interactiva.
- Puerto TCP 3000 accesible para quienes vayan a usar la instancia.

Desde el directorio donde quieras crear `trimly/`, ejecuta:

```bash
curl -fsSL https://github.com/keevh/trimly/releases/latest/download/install.sh | bash
```

El instalador pide la URL pública (`http://IP:3000` o un dominio), descarga una versión publicada, genera contraseñas locales y levanta la aplicación y PostgreSQL. Guarda la configuración en `./trimly/.env` y los datos de Postgres en un volumen Docker. El script no instala Docker ni cambia el firewall. Antes de ejecutarlo, puedes [revisar el código del instalador](https://github.com/keevh/trimly/blob/master/scripts/install.sh).

Luego abre la URL indicada y añade `/demo` para crear un enlace. Para ver el estado de los servicios:

```bash
cd trimly
docker compose ps
```

Si ya existe `./trimly`, el instalador se detiene sin modificar esa carpeta. Para actualizar una instancia instalada, cambia `TRIMLY_IMAGE` en `trimly/.env` a una versión publicada y ejecuta `docker compose pull && docker compose up -d --wait` dentro de ella. Haz un backup del volumen de Postgres antes de actualizar.

## Desarrollo local

Requiere Node.js 22+, pnpm 11+ y Docker Compose. Desde una copia del repositorio:

```bash
docker compose up --build
```

La configuración de desarrollo usa Astro en modo desarrollo y publica Postgres en el puerto 5433. Abre:

- `http://localhost:3000/`
- `http://localhost:3000/demo`

## Despliegue existente en Azure

`docker-compose.prod.yml` conserva la red externa de Caddy `voltiaz_default` y el volumen `postgres-data`. En la VM, actualiza el archivo Compose y añade a su `.env` `TRIMLY_IMAGE=ghcr.io/keevh/trimly:vX.Y.Z`, sustituyendo la versión por una publicada. Conserva los valores actuales de `POSTGRES_PASSWORD`, `IP_HASH_SALT` y `APP_BASE_URL`; cambiarlos afectaría el acceso a los datos o las URL generadas. Tras hacer un backup de Postgres, ejecuta en el directorio de despliegue:

```bash
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --wait
```

Comprueba la aplicación a través del dominio servido por Caddy y revisa `docker compose -f docker-compose.prod.yml ps`. Este procedimiento no requiere compilar Node en la VM ni abre el puerto 3000 públicamente. La publicación de una nueva imagen no actualiza Azure automáticamente.

## Publicar una versión

Publica un GitHub Release estable con una etiqueta como `v1.0.0`. El workflow valida el proyecto, publica las imágenes `ghcr.io/keevh/trimly:v1.0.0` y `:latest`, y adjunta `install.sh` junto con `docker-compose.install.yml` al release. Verifica que el paquete GHCR sea público y que ambos assets aparezcan antes de compartir el comando de instalación. [GitHub documenta la visibilidad de paquetes](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility).

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
| `TRIMLY_IMAGE` | Imagen y versión publicada usada por los Compose de instalación y Azure. |
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
- [ ] Script de actualización automática para instancias self-hosted.
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
