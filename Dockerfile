
ARG PARENT_VERSION=2.10.3-node22.21.1

# ------------------------------
# Base stage (shared)
# ------------------------------
FROM defradigital/node:${PARENT_VERSION} AS base
ARG PORT=3000
ENV PORT=${PORT}

# Must start as root to install system packages
USER root

# Install system tools (Alpine)
RUN apk update \
  && apk add --no-cache \
       netcat-openbsd \
       redis \
  && rm -rf /var/cache/apk/*

# Working directory
WORKDIR /home/node/app

# Copy application source (root-owned, read-only)
# When developing/debugging within a container locally, --chown=root:root should be replaced with --chown=node:node to provide
# required write permissions. SonarQube cloud will raise a security issue if analysing these changes.
COPY --chown=root:root ./webpack.config.js .
COPY --chown=root:root ./build ./build
COPY --chown=root:root ./server ./server
COPY --chown=root:root ./index.js .
COPY --chown=root:root package*.json .

# Timezone config
ENV TZ=Europe/London

ARG BUILD_VERSION=v8.24.0-1-g287f0121
ARG GIT_COMMIT=0
RUN echo -e "module.exports = { version: '$BUILD_VERSION', revision: '$GIT_COMMIT' }" > ./version.js

# ------------------------------
# Development stage
# ------------------------------
FROM base AS development

# Copy test resources
# When developing/debugging within a container locally, --chown=root:root should be replaced with --chown=node:node to provide
# required write permissions. SonarQube cloud will raise a security issue if analysing these changes.
COPY --chown=root:root ./test ./test

# Install ALL dependencies for dev (but ensure no scripts run)
RUN npm ci --engine-strict --ignore-scripts --include=dev \
# Build application \
&& npm run build

# Drop privileges (DEFRA requirement: never run container as root)
USER node

EXPOSE ${PORT}

CMD ["nodemon", "index.js"]

# ------------------------------
# Production stage
# ------------------------------
FROM base AS production

ENV NODE_ENV=production

# Install only production deps
RUN npm ci --engine-strict --ignore-scripts --omit=dev \
# Build production assets \
&& npm run build && chmod -R a-w /home/node

# Runtime user must NOT be root (DEFRA standard)
USER node

EXPOSE ${PORT}

CMD ["node", "index.js"]
