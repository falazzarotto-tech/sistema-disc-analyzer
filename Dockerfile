FROM node:20-bookworm

# Instalar dependências do Chrome para o Puppeteer
RUN apt-get update && apt-get install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libpango-1.0-0 libcairo2 fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (incluindo o Prisma CLI)
RUN npm install

# COPIA TUDO (incluindo a pasta prisma e public)
COPY . .

# Gera o cliente do Prisma explicitamente apontando para o arquivo
RUN npx prisma generate --schema=./prisma/schema.prisma

# Faz o build do TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
