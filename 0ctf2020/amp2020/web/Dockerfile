FROM node:13.13.0-alpine3.10
RUN apk add -U --no-cache tzdata chromium ttf-freefont ca-certificates
WORKDIR /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Puppeteer v1.19.0 works with Chromium 77.
COPY package.json /app/
RUN yarn --ignore-engines
COPY . /app/
CMD [ "/app/bin/daemon" ]
