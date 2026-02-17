FROM node:22-slim AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* .
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/ .
COPY . .
RUN npx quartz build

FROM lipanski/docker-static-website:latest
COPY --from=builder /usr/src/app/public .
