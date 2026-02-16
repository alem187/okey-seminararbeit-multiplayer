FROM node:18-alpine

WORKDIR /app

# Kopiere package files
COPY package*.json ./

# Installiere Dependencies
RUN npm install --omit=dev

# Kopiere Source Code
COPY . .

# Exponiere Port
EXPOSE 3001

# Starte Server
CMD ["node", "src/server.js"]
