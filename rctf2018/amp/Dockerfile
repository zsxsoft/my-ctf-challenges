FROM php:apache

RUN apt update && apt install -y nginx chromium python-pip vim \
    && pip install selenium

COPY bot/chromedriver /usr/bin
RUN mkdir /app && chmod +x /usr/bin/chromedriver

COPY ./ /app
COPY ./www /var/www/html/


