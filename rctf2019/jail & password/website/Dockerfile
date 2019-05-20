FROM php:7.3-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY ./ /var/www/html/
RUN chmod 0777 /var/www/html/uploads

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/ssl-cert-snakeoil.key -out /etc/ssl/certs/ssl-cert-snakeoil.pem -subj "/C=AT/ST=Vienna/L=Vienna/O=Security/OU=Development/CN=jail.2019.rctf.rois.io" && a2enmod rewrite && a2ensite default-ssl && a2enmod ssl
