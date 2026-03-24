# Frontend/Dockerfile
FROM node:22.12-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy all frontend code
COPY . .

# Build args for env variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN npm run build

# ── Production stage — Nginx to serve ──
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
