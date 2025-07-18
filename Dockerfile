# Use the official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy source code and dependencies from base stage
COPY --from=base /app/src ./src
COPY --from=base /app/index.ts ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/tsconfig.json ./

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Start the application (Bun can run TypeScript directly)
CMD ["bun", "run", "index.ts"]
