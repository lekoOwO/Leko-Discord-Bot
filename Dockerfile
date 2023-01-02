FROM node:alpine

WORKDIR /app

COPY ./package.json /app/package.json

RUN npm install

COPY ./src /app/src

CMD ["node", "src/index.mjs"]