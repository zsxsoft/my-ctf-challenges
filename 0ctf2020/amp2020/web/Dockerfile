FROM node:13.13.0-alpine3.10
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk add -U --no-cache --allow-untrusted tzdata chromium ttf-freefont wqy-zenhei ca-certificates
WORKDIR /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Puppeteer v1.19.0 works with Chromium 77.
COPY package.json /app/
RUN yarn && \
    echo "127.0.0.1 cross-domain-iframe.com" >> /etc/hosts
COPY . /app/
CMD [ "/app/bin/daemon" ]
