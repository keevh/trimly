#!/usr/bin/env bash
set -Eeuo pipefail

TRIMLY_VERSION="${TRIMLY_VERSION:-__TRIMLY_VERSION__}"
INSTALL_DIR="${PWD}/trimly"
RELEASE_BASE="https://github.com/keevh/trimly/releases/download/${TRIMLY_VERSION}"

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

if [[ "$TRIMLY_VERSION" == "__TRIMLY_VERSION__" ]]; then
  fail "Este script debe descargarse desde un release de Trimly."
fi

for dependency in curl docker od tr; do
  command -v "$dependency" >/dev/null 2>&1 || fail "Falta $dependency. Instala Docker Engine y Docker Compose siguiendo https://docs.docker.com/engine/install/ y vuelve a ejecutar el instalador."
done

docker compose version >/dev/null 2>&1 || fail "Falta el plugin Docker Compose. Instálalo siguiendo https://docs.docker.com/compose/install/linux/ y vuelve a ejecutar el instalador."
docker info >/dev/null 2>&1 || fail "Docker no está activo o tu usuario no tiene acceso al daemon."

[[ -t 2 && -r /dev/tty ]] || fail "Se necesita una terminal interactiva para indicar la URL pública."

while true; do
  printf 'URL pública de Trimly (por ejemplo, http://203.0.113.10:3000): ' >/dev/tty
  IFS= read -r APP_BASE_URL </dev/tty || fail "No se recibió una URL pública."
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
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
IP_HASH_SALT=${IP_HASH_SALT}
APP_BASE_URL=${APP_BASE_URL}
EOF

printf 'Instalando Trimly %s en %s...\n' "$TRIMLY_VERSION" "$INSTALL_DIR"
docker compose --project-directory "$INSTALL_DIR" -f "${INSTALL_DIR}/compose.yml" --env-file "${INSTALL_DIR}/.env" pull
docker compose --project-directory "$INSTALL_DIR" -f "${INSTALL_DIR}/compose.yml" --env-file "${INSTALL_DIR}/.env" up -d --wait

printf '\nTrimly está disponible en %s\n' "$APP_BASE_URL"
printf 'Configuración y datos: %s\n' "$INSTALL_DIR"
printf 'Si accedes desde otra máquina, permite TCP 3000 en el firewall de tu servidor.\n'
