#!/bin/bash
nginx
pm2 start /app/api/index.js
npm run prod
