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

# Build the project
RUN npm run build

# Port 7860 is required for Hugging Face Spaces
EXPOSE 7860

# Run using node on the compiled dist
CMD [ "node", "dist/index.js" ]
