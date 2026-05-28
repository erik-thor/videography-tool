# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package dependency manifests
COPY package*.json ./

# Install packages
RUN npm ci

# Copy codebase and compile
COPY . .
RUN npm run build

# Production stage served with Nginx
FROM nginx:alpine

# Copy Nginx SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx hosting directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
