FROM python:3.7-stretch
WORKDIR /app

RUN pip install gunicorn gevent flask pymongo &&chmod 0500 /tmp
COPY ./app.py /app/app.py
COPY ./gunicorn.conf.py /app/gunicorn.conf.py
COPY ./run.sh /run.sh

RUN useradd de1ctf && echo "de1ctf hard nproc 20" >> /etc/security/limits.conf && chmod +x /run.sh
CMD [ "/run.sh" ]
