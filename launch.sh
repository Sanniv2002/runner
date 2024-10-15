#!/bin/bash

read -p "Do you want to rebuild the images? (y/n): " build_flag

# Check user input and act accordingly
if [[ "$build_flag" == "y" || "$build_flag" == "Y" ]]; then
    echo "Starting Production runner with build"
    docker-compose -f docker-compose.prod.yml up --build
else
    echo "Starting Production runner without build"
    docker-compose -f docker-compose.prod.yml up
fi