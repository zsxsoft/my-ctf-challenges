FROM php:7.3-apache-stretch
RUN pecl install mongodb && docker-php-ext-enable mongodb
RUN chmod 0500 /var/www/html && chmod 0500 /tmp
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY ./index.php /var/www/html/
COPY limit.ini $PHP_INI_DIR/conf.d/