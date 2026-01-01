# Stage 1: Builder (NOW using Debian-based image)
FROM node:24-slim AS builder

# Install build dependencies for better-sqlite3 (and general Native Modules)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    sqlite3

# Set working directory
WORKDIR /app

# Copy package.json & lock files first (for layer caching)
COPY package*.json ./

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy the rest of your source code
COPY . .

# Build the Next.js app
RUN npm run build

# Stage 2: Production Runner (ALSO switch to Debian-based)
FROM node:24-slim AS runner

# Install runtime dependencies (sqlite3 is needed for better-sqlite3 to work at runtime)
RUN apt-get update && apt-get install -y sqlite3

# Set runtime environment
ENV NODE_ENV production

# Create working directory
WORKDIR /app

# Copy only what we need from the builder stage
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy your SQLite database file(s)
COPY --from=builder /app/data ./data

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]