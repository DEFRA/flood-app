ARG PARENT_VERSION=2.10.3-node20.19.6

FROM defradigital/node:${PARENT_VERSION} AS base
ARG PORT=3000
ENV PORT=${PORT}

# App workdir
WORKDIR /usr/src/app

# Root for system package setup; drop privileges later
USER root

# Install required system tools (shared) - Alpine uses apk
# netcat-openbsd -> netcat-openbsd, redis-tools -> redis
RUN apk update \
  && apk add --no-cache \
     netcat-openbsd \
     redis \
  && rm -rf /var/cache/apk/*

# Copy only manifests first to maximize layer caching
COPY --chown=node:node package.json package-lock.json ./

# Timezone applied to both stages
ENV TZ=Europe/London

# ----- Development stage -----
FROM base AS development

# Dev environment
ENV NODE_ENV=development

# Deterministic dev install (includes devDeps)
# NOTE: Remove --ignore-scripts if you rely on postinstall scripts.
RUN npm ci --engine-strict --ignore-scripts --include=dev

# Copy source after dependencies to preserve caching
COPY --chown=node:node ./webpack.config.js ./webpack.config.js
COPY --chown=node:node ./build ./build
COPY --chown=node:node ./server ./server
COPY --chown=node:node ./test ./test
COPY --chown=node:node ./index.js ./

# Build the application (AFTER source files are copied)
RUN npm run build

# Drop privileges
USER node

# Expose typical app port (adjust if different)
ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# If you want to wait on Redis before starting, uncomment next CMD:
# CMD ["bash", "-lc", "wait-on tcp:redis:6379 && nodemon index.js"]

# Default dev command with auto-restart
CMD ["nodemon", "index.js"]

# ----- Production stage -----
FROM base AS production

# Production environment
ENV NODE_ENV=production

# Deterministic production install (no devDeps)
# NOTE: Remove --ignore-scripts if you rely on postinstall scripts.
RUN npm ci --engine-strict --ignore-scripts --omit=dev

# Copy only what's needed to run
# (No /test; include build if you serve prebuilt assets)
COPY --chown=node:node ./webpack.config.js ./webpack.config.js
COPY --chown=node:node ./build ./build
COPY --chown=node:node ./server ./server
COPY --chown=node:node ./index.js ./

# Build the application (AFTER source files are copied)
RUN npm run build

# Drop privileges
USER node

# Expose app port
ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start the app
CMD ["node", "index.js"]
