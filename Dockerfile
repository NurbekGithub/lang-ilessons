FROM oven/bun:1.3.4 AS build

WORKDIR /app

# Cache packages installation
COPY package.json bun.lock tsconfig.json ./

RUN bun install

# Copy app
COPY . .

RUN bun run build

CMD ["bun", "run", "server.ts"]

EXPOSE 3000
