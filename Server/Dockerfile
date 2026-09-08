# Base Node.js 20 (compatible con target ES2021 / module Node16)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero (para cachear capas)
COPY package*.json ./

# Instalar dependencias (incluye devDependencies para compilar TypeScript)
RUN npm install --no-audit --no-fund

# Copiar el resto del codigo (node_modules excluido via .dockerignore)
COPY . .

# Compilar TypeScript -> dist/
RUN npm run build

# El servidor carga el .env desde dist/.env (env.ts resuelve __dirname + '..')
COPY src/.env dist/.env

# Limpiar dependencias de desarrollo para reducir tamano de la imagen
RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]