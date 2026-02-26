# ── Build stage ──
FROM node:22-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──
FROM node:22-alpine
RUN apk add --no-cache libstdc++
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/docker-entrypoint.mjs ./

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4321/ || exit 1

CMD ["sh", "-c", "node docker-entrypoint.mjs && exec node dist/server/entry.mjs"]