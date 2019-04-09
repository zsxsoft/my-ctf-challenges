FROM node:10

RUN wget https://nginx.org/keys/nginx_signing.key \
    && apt-key add nginx_signing.key \
    && echo "deb http://nginx.org/packages/debian/ jessie nginx\ndeb-src http://nginx.org/packages/debian/ jessie nginx" >> /etc/apt/sources.list \
    && apt update && apt install -y nginx chromium python-pip vim \
    && pip install selenium \
    && mkdir /app \
    && npm install -g pm2 && npm cache clean --force

COPY bot/chromedriver /usr/bin
COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm install && chmod +x /usr/bin/chromedriver

COPY ./ /app/
RUN chmod +x /app/docker/build.sh && chmod +x /app/docker/run.sh && /app/docker/build.sh
EXPOSE 8667 8664 8666

CMD ["/app/docker/run.sh"]
