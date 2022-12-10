FROM nodejs:alpine

WORKDIR /app

COPY ./package.json /app/package.json

RUN npm install

COPY ./src /app/src
COPY ./static /app/static

CMD ["node", "src/index.mjs"]