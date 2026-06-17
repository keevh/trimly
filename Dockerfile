FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV CI=1

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/keevh/trimly"

COPY --from=build /app /app

EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.mjs && node dist/server/entry.mjs"]
