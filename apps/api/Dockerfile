# ── Збірка ──
FROM node:22-slim AS build
WORKDIR /repo

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Спершу маніфести — шар кешується, поки залежності не змінились
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @memorial/api --include-workspace-root

COPY apps/api apps/api
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
  && npm run build --workspace @memorial/api

# ── Виконання ──
FROM node:22-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/package.json package.json
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/prisma apps/api/prisma

WORKDIR /repo/apps/api
# Тека для завантажень (для довготривалого зберігання — том або S3)
RUN mkdir -p uploads

EXPOSE 3001
# Міграції накатуються при старті, далі — сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
