FROM node:9.4-slim

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

EXPOSE 8080
WORKDIR /home/node/app

COPY --chown=node . /home/node/app
RUN chown -R node:node /home/node/app

USER node
RUN npm install
RUN npm run build
CMD node server.js
