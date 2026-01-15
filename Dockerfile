FROM node:22.12.0-bookworm

# Instala dependências para o PDF e Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (incluindo o Prisma)
RUN npm install

# Copia o restante dos arquivos (incluindo a pasta prisma)
COPY . .

# Gera o cliente do Prisma explicitamente apontando para o arquivo
RUN npx prisma generate --schema=./prisma/schema.prisma

# Compila o TypeScript
RUN npm run build

EXPOSE 3000

# Comando para rodar: sincroniza banco e inicia o servidor
CMD ["sh", "-c", "npx prisma db push && npm start"]