# Stage 1: Build the Vite React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Run compilation and Vite build
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx HTML subdirectory for /videos/
COPY --from=build /app/dist /usr/share/nginx/html/videos

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
