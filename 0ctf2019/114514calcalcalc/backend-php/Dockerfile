FROM php:7.3-apache-stretch
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY ./index.php /var/www/html/
RUN chmod 0755 -R /var/www/html
COPY limit.ini $PHP_INI_DIR/conf.d/