FROM oott123/novnc

RUN apt-get update \
    && apt-get -y install software-properties-common apt-transport-https tzdata \
    && curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
    && echo "deb https://deb.nodesource.com/node_11.x xenial main" | sudo tee /etc/apt/sources.list.d/nodesource.list \
    && echo "deb-src https://deb.nodesource.com/node_11.x xenial main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list \
    && add-apt-repository -y ppa:jtaylor/keepass \
    && apt-get update \
    && apt-get install -y keepass2 nodejs libmono-system-xml-linq4.0-cil libmono-system-data-datasetextensions4.0-cil libmono-system-runtime-serialization4.0-cil mono-mcs unzip libasound2 libnss3

RUN wget https://raw.github.com/pfn/keepasshttp/master/KeePassHttp.plgx \
    && cp KeePassHttp.plgx /usr/lib/keepass2/ \
    && mkdir /bot

COPY ./package.json /bot/package.json
RUN cd /bot && npm install
COPY ./ /bot/
RUN sh /bot/install-npm-deps.sh

ENV VNC_GEOMETRY 1280x960
ENV VNC_PASSWD z5xVncPd
ENV USER_PASSWD user
ENV CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox

COPY vncmain.sh /app/vncmain.sh
RUN chmod +x /app/vncmain.sh
