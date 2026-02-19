FROM node:22-slim AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* .
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/ .
COPY . .
RUN NODE_ENV=production npx quartz build

FROM caddy:alpine
COPY --from=builder /usr/src/app/public /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
