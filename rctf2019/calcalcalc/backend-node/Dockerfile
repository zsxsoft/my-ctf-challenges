FROM node:alpine
WORKDIR /app
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn
COPY index.js /app/index.js

CMD ["node", "index"]
