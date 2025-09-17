# Multi-stage build: build with Node, serve with Nginx
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./

# Install dependencies early to leverage cache. If package-lock isn't present, fall back to npm install.
RUN npm ci --silent || npm install --omit=dev --no-audit --no-fund

# Copy the rest of the project. A .dockerignore file should exclude node_modules, dist, and other dev files.
COPY . .

# Build the production assets using Vite
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Include custom nginx config if present
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Add entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
