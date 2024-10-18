# Base stage for building the application
FROM node:18-alpine AS build

RUN apk add --no-cache python3 py3-pip build-base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Final production stage
FROM node:18-alpine AS production
 
RUN apk add --no-cache python3 py3-pip build-base make g++ bash libc-dev linux-headers

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /app/dist ./dist