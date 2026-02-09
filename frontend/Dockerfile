# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package files
COPY package*.json ./

# Installiere alle Dependencies (inkl. devDependencies für Build)
RUN npm ci

# Kopiere Source Code
COPY . .

# Build für Production
RUN npm run build

# Production Stage
FROM nginx:alpine

# Kopiere Build-Artefakte zu Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiere Nginx Config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponiere Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
