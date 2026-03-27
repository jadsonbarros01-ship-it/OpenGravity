# Use Node.js LTS (Lightweight)
FROM node:20-slim

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for building)
RUN npm install

COPY . .

# Não precisamos fazer build, pois vamos rodar através do tsx
# (Porta exigida peloo Hugging Face, e sem problema na Hostinger)
EXPOSE 7860

# Rodar direto o código fonte com tsx
CMD [ "npm", "start" ]
