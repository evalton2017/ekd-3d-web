# Estágio 1: Instalação de dependências e Build
FROM node:22-alpine AS builder
WORKDIR /app

# Cache de dependências eficiente
COPY package*.json ./
RUN npm ci

# Copia código fonte e compila
COPY . .
RUN npm run build -- --configuration=production

# Estágio 2: Ambiente de Execução Ultra-leve
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# O Angular SSR gera arquivos prontos. Não precisamos de node_modules aqui.
COPY --from=builder /app/dist/ekd-3d-web ./dist/ekd-3d-web

EXPOSE 4001
CMD ["node", "dist/ekd-3d-web/server/server.mjs"]
