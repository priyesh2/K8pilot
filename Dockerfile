# Stage 1: Build the React frontend
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js backend
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .

EXPOSE 5000
CMD ["node", "index.js"]
