FROM node:alpine
WORKDIR /app
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn
COPY ./ /app

CMD ["npm", "start"]
