FROM php:7.4-apache
RUN apt update && apt install -y libcurl4-gnutls-dev libxml2 libxml2-dev && \
    pecl install solr && \
    echo extension=solr.so >> /usr/local/etc/php/php.ini && \
    pecl install psr && \
    echo extension=psr.so >> /usr/local/etc/php/php.ini && \
    pecl install phalcon && \
    echo extension=phalcon.so >> /usr/local/etc/php/php.ini && \
    echo display_errors=Off >> /usr/local/etc/php/php.ini
COPY flag /flag
COPY index.php /var/www/html
COPY solr /var/www/html/solr
COPY readflag.c /tmp
RUN echo '<?=phpinfo();?>' > /var/www/html/phpinfo.php && \
    chown root:root /var/www/html && chmod -R 0755 /var/www/html && \
    chmod 0600 /flag && \
    gcc /tmp/readflag.c -o /readflag && \
    chmod u+s /readflag && \
    # Fake SolrServer
    cp /etc/apache2/sites-enabled/000-default.conf /etc/apache2/sites-enabled/001-8983.conf && \
    sed -i 's/80/8983/' /etc/apache2/sites-enabled/001-8983.conf && \
    echo "Listen 8983" >> /etc/apache2/ports.conf

# In 2021/07/01
# latest solr==2.5.1
# latest psr==1.1.0
# latest phalcon==4.1.2
