#!/bin/bash

chmod -R 644 .
chmod +x backend-python/run.sh
pushd frontend
yarn
popd

docker-compose build
docker-compose up -d