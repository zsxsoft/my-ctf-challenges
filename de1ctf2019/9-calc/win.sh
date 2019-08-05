#!/bin/bash

chmod -R 644 .
chmod +x backend-python/run.sh

docker-compose build
docker-compose up -d