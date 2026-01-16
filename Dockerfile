FROM node:20-bookworm

# Instalar dependências do Chrome
RUN apt-get update && apt-get install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libpango-1.0-0 libcairo2 fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia apenas os arquivos de pacotes primeiro
COPY package*.json ./

# Instala ignorando scripts automáticos para evitar erro prematuro do Prisma
RUN npm install --ignore-scripts

# AGORA copia o resto dos arquivos (incluindo a pasta prisma)
COPY . .

# Gera o Prisma manualmente agora que os arquivos existem no container
RUN npx prisma generate

# Build do projeto TypeScript
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
