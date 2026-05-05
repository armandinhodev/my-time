# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application (NestJS compiles to dist/src/main.js)
CMD ["node", "dist/src/main.js"]
