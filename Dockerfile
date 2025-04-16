# Note 1: version here must match the engines.node version in package.json
# Note 2: once the node upgrade work is merged in the can use alpine (build
# scripts expect bash when they should just use sh)
FROM node:20.18.2

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y netcat-openbsd redis-tools

# Install wait-on so app start can be delayed until db is initialised
# Install nodemon for restart on file change
RUN npm install -g wait-on nodemon

COPY --chown=node:node package.json package-lock.json webpack.config.js ./

# be specific about files to copy to prevent no required and/or risky files from being copied
# e.g. git, github, cloudfoundry files
COPY --chown=node:node build ./build/
COPY --chown=node:node server ./server/
COPY --chown=node:node test ./test/
COPY --chown=node:node index.js ./

ENV NODE_ENV=development
ENV TZ=Europe/London

RUN npm install --engine-strict

USER node

CMD [ "node", "index.js" ]
