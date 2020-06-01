FROM phpswoole/swoole:4.4.18-php7.4
RUN docker-php-ext-install mysqli pdo_mysql
COPY src/server.php /var/www/server.php
RUN php -i > /var/www/phpinfo.txt
COPY flag /flag
