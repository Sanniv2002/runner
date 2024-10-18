#!/bin/bash

# This script generates a docker-compose file and also runs it
PROJECT_NAME=$1
ENV=$2

# Function to find a free port
find_free_port() {
  local port
  while true; do
    port=$(shuf -i 2000-65000 -n 1)
    if ! nc -z localhost $port; then
      echo $port
      return 0
    fi
  done
}

APP_PORT=$(find_free_port)
REDIS_PORT=$(find_free_port)

NETWORK_NAME="${PROJECT_NAME}_network"
CACHE_VOLUME_NAME="cache_${PROJECT_NAME}"

if [[ "$ENV" == "node" ]]; then
  DOCKER_COMPOSE_TEMPLATE="version: \"3.7\"
      
services:
  runner:
    container_name: runner-${PROJECT_NAME}
    image: sanniv/cloudide
    volumes:
      - ./src:/app/src
      - /app/node_modules
      - /host/path/to/files-${PROJECT_NAME}:/app/files
    tty: true
    stdin_open: true
    depends_on:
      - cache
    ports:
      - "${APP_PORT}:8000"
    networks:
      - "${NETWORK_NAME}"
    environment:
      - FILE_BASE_PATH=/app/files
      - TERM=xterm
    command: node dist/index.js

  queue_worker:
    container_name: queue_worker-${PROJECT_NAME}
    image: sanniv/cloudide
    volumes:
      - ./src:/app/src
      - /app/node_modules
      - /host/path/to/files-${PROJECT_NAME}:/app/files
    depends_on:
      - cache
    networks:
      - "${NETWORK_NAME}"
    command: node dist/Service.QueueWorker/index.js

  cache:
    image: redis:6.2-alpine
    restart: always
    ports:
      - "${REDIS_PORT}:6379"
    networks:
      - "${NETWORK_NAME}"
    command: redis-server --save 20 1 --loglevel warning
    volumes:
      - "${CACHE_VOLUME_NAME}:/data"

networks:
  ${NETWORK_NAME}:
    driver: bridge

volumes:
  ${CACHE_VOLUME_NAME}:
    driver: local
"
elif [[ "$ENV" == "python" ]]; then 
  echo "Python compse file not found"
  exit 1
else
  echo "Environment $ENV does not exist"
  exit 1
fi


COMPOSE_FILE="docker-compose-${PROJECT_NAME}.yml"
echo "$DOCKER_COMPOSE_TEMPLATE" > "$COMPOSE_FILE"

docker-compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

echo "{
  "ALIAS": "$PROJECT_NAME",
  "APP_PORT": " $APP_PORT",
  "CACHE_PORT": "$REDIS_PORT"
}
"