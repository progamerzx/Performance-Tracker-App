# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency catalogs
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full application code
COPY . .

# Compile application assets
RUN npm run build

# ==========================================
# Stage 2: Serve the compiled app with Nginx
# ==========================================
FROM nginx:stable-alpine AS production-stage

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage to nginx webroot
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
