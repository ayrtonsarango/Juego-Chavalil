# Dockerfile para desplegar en Google Cloud Run
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copiar el código fuente
COPY . .

# Puerto por defecto de Google Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
