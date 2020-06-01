FROM node:13.13.0-alpine3.10
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
RUN apk add -U --no-cache python3 && \
    apk add --update --no-cache  --virtual .build-deps gcc libc-dev libxml2-dev python3-dev libxml2 libxslt-dev
RUN pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
RUN pip3 install beancount
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/
RUN mv /app/flag /flag
CMD [ "/app/bin/daemon" ]
