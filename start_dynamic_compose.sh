#!/bin/bash

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

# timestamp-based unique project names
PROJECT_NAME="project_$(date +%s)"
NETWORK_NAME="${PROJECT_NAME}_network"
CACHE_VOLUME_NAME="cache_${PROJECT_NAME}"

# Create a custom network
docker network create -d bridge "$NETWORK_NAME"

echo "Application is running on port: $APP_PORT under project: $PROJECT_NAME"

REDIS_PORT=$REDIS_PORT \
DYNAMIC_PORT=$APP_PORT \
PROJECT_NAME=$PROJECT_NAME \
NETWORK_NAME=$NETWORK_NAME \
CACHE_VOLUME_NAME=$CACHE_VOLUME_NAME \
docker-compose -p "$PROJECT_NAME" -f docker-compose.instance.yml up

# docker network rm "$NETWORK_NAME"