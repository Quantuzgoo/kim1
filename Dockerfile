FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004
ENV HOSTNAME=0.0.0.0

# Baked-in runtime config so the exported image works without external env vars.
# Override any of these at runtime (docker -e / Portainer env) or build time (--build-arg).
ARG SMTP_HOST=smtp.gmail.com
ARG SMTP_PORT=465
ARG SMTP_USER=quantuzgoo@gmail.com
ARG SMTP_PASS=neeijohrumjozzaa
ARG SMTP_FROM=quantuzgoo@gmail.com
ARG SMTP_DEBUG=true
ARG QUOTE_NOTIFICATION_EMAIL=quantuzgoo@gmail.com
ARG APP_BASE_URL=
ENV SMTP_HOST=$SMTP_HOST \
    SMTP_PORT=$SMTP_PORT \
    SMTP_USER=$SMTP_USER \
    SMTP_PASS=$SMTP_PASS \
    SMTP_FROM=$SMTP_FROM \
    SMTP_DEBUG=$SMTP_DEBUG \
    QUOTE_NOTIFICATION_EMAIL=$QUOTE_NOTIFICATION_EMAIL \
    APP_BASE_URL=$APP_BASE_URL

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3004
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]