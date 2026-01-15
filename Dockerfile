FROM node:22.12.0-bookworm

# 1. Instala dependências para o PDF e Chrome (essencial para o Puppeteer)
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

# 2. Copia arquivos de dependências
COPY package*.json ./

# 3. Copia a pasta prisma ANTES do npm install
COPY prisma ./prisma

# 4. Instala as dependências do projeto
RUN npm install

# 5. Copia o restante dos arquivos do seu Mac para o servidor
COPY . .

# 6. Compila o código TypeScript para JavaScript
RUN npm run build

# 7. Informa a porta que o sistema vai usar
EXPOSE 3000

# 8. Comando para ligar o servidor
CMD ["npm", "start"]