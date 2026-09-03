#!/usr/bin/env bash
set -Eeuo pipefail

TRIMLY_VERSION="${TRIMLY_VERSION:-__TRIMLY_VERSION__}"
INSTALL_DIR="${PWD}/trimly"
RELEASE_BASE="https://github.com/keevh/trimly/releases/download/${TRIMLY_VERSION}"

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

if [[ ! "$TRIMLY_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  fail "Este script debe descargarse desde un release de Trimly."
fi

for dependency in curl docker od tr; do
  command -v "$dependency" >/dev/null 2>&1 || fail "Falta $dependency. Instala Docker Engine y Docker Compose siguiendo https://docs.docker.com/engine/install/ y vuelve a ejecutar el instalador."
done

docker compose version >/dev/null 2>&1 || fail "Falta el plugin Docker Compose. Instálalo siguiendo https://docs.docker.com/compose/install/linux/ y vuelve a ejecutar el instalador."
docker info >/dev/null 2>&1 || fail "Docker no está activo o tu usuario no tiene acceso al daemon."

[[ -t 2 && -r /dev/tty ]] || fail "Se necesita una terminal interactiva para indicar la URL de Trimly."

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    [[ -n "$(ss -H -ltn "sport = :$1" 2>/dev/null)" ]]
  else
    (echo >/dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1
  fi
}

TRIMLY_PORT=3000
while port_in_use "$TRIMLY_PORT"; do
  TRIMLY_PORT=$((TRIMLY_PORT + 1))
  (( TRIMLY_PORT <= 65535 )) || fail "No se encontró un puerto libre."
done

if [[ "$TRIMLY_PORT" != 3000 ]]; then
  printf 'El puerto 3000 está ocupado; se sugiere el %s.\n' "$TRIMLY_PORT" >/dev/tty
fi

while true; do
  printf 'Puerto de Trimly [%s]: ' "$TRIMLY_PORT" >/dev/tty
  IFS= read -r selected_port </dev/tty || fail "No se recibió un puerto."
  selected_port="${selected_port:-$TRIMLY_PORT}"
  if [[ ! "$selected_port" =~ ^[1-9][0-9]{0,4}$ ]] || (( selected_port > 65535 )); then
    printf 'Introduce un puerto entre 1 y 65535.\n' >/dev/tty
    continue
  fi
  if port_in_use "$selected_port"; then
    printf 'El puerto %s está ocupado. Elige otro.\n' "$selected_port" >/dev/tty
    continue
  fi
  TRIMLY_PORT="$selected_port"
  break
done

DEFAULT_BASE_URL="http://localhost:${TRIMLY_PORT}"
printf 'Esta URL se usará para generar los enlaces cortos y de estadísticas.\n' >/dev/tty
printf 'Para probar en este equipo, pulsa Enter. Para compartir enlaces, usa una IP o dominio accesible desde otros dispositivos con el puerto %s, o la URL de tu proxy.\n' "$TRIMLY_PORT" >/dev/tty
while true; do
  printf 'URL de Trimly [%s]: ' "$DEFAULT_BASE_URL" >/dev/tty
  IFS= read -r APP_BASE_URL </dev/tty || fail "No se recibió una URL."
  APP_BASE_URL="${APP_BASE_URL:-$DEFAULT_BASE_URL}"
  APP_BASE_URL="${APP_BASE_URL%/}"
  if [[ "$APP_BASE_URL" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$ ]]; then
    break
  fi
  printf 'Introduce una URL http(s) con dominio o IPv4 y puerto opcional, sin ruta.\n' >/dev/tty
done

[[ ! -e "$INSTALL_DIR" ]] || fail "Ya existe ${INSTALL_DIR}. Elige otra carpeta de trabajo; el instalador no sobrescribe instalaciones existentes."

POSTGRES_PASSWORD="$(od -An -tx1 -N32 /dev/urandom | tr -d ' \n')"
IP_HASH_SALT="$(od -An -tx1 -N32 /dev/urandom | tr -d ' \n')"
[[ ${#POSTGRES_PASSWORD} -eq 64 && ${#IP_HASH_SALT} -eq 64 ]] || fail "No se pudieron generar los secretos."

mkdir -m 700 "$INSTALL_DIR"
umask 077

if ! curl --fail --location --silent --show-error --retry 3 \
  "${RELEASE_BASE}/docker-compose.install.yml" -o "${INSTALL_DIR}/compose.yml"; then
  rmdir "$INSTALL_DIR" 2>/dev/null || true
  fail "No se pudo descargar el archivo Compose del release ${TRIMLY_VERSION}."
fi

cat >"${INSTALL_DIR}/.env" <<EOF
TRIMLY_IMAGE=ghcr.io/keevh/trimly:${TRIMLY_VERSION}
TRIMLY_PORT=${TRIMLY_PORT}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
IP_HASH_SALT=${IP_HASH_SALT}
APP_BASE_URL=${APP_BASE_URL}
EOF

printf 'Instalando Trimly %s en %s...\n' "$TRIMLY_VERSION" "$INSTALL_DIR"
docker compose --project-directory "$INSTALL_DIR" -f "${INSTALL_DIR}/compose.yml" --env-file "${INSTALL_DIR}/.env" pull
docker compose --project-directory "$INSTALL_DIR" -f "${INSTALL_DIR}/compose.yml" --env-file "${INSTALL_DIR}/.env" up -d --wait

printf '\nTrimly está disponible en %s\n' "$APP_BASE_URL"
printf 'Configuración y datos: %s\n' "$INSTALL_DIR"
if [[ "$APP_BASE_URL" == "http://localhost:${TRIMLY_PORT}" || "$APP_BASE_URL" == "http://127.0.0.1:${TRIMLY_PORT}" ]]; then
  printf 'Los enlaces con localhost o 127.0.0.1 solo funcionarán en este equipo.\n'
else
  printf 'Si accedes desde otra máquina, verifica el firewall o proxy de tu servidor.\n'
fi
