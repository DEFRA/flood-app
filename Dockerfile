
ARG PARENT_VERSION=2.10.3-node20.19.6

# ------------------------------
# Base stage (shared)
# ------------------------------
FROM defradigital/node:${PARENT_VERSION} AS base
ARG PORT=3000
ENV PORT=${PORT}

# Working directory
WORKDIR /usr/src/app

# Must start as root to install system packages
USER root

# Install system tools (Alpine)
RUN apk update \
  && apk add --no-cache \
       netcat-openbsd \
       redis \
  && rm -rf /var/cache/apk/*

# Copy package manifests (root-owned, secure permissions)
COPY --chown=root:root --chmod=644 package*.json .

# Timezone config
ENV TZ=Europe/London



# ------------------------------
# Development stage
# ------------------------------
FROM base AS development

# Install ALL dependencies for dev (but ensure no scripts run)
RUN npm ci --engine-strict --ignore-scripts --include=dev

# Copy application source (root-owned, read-only)
COPY --chown=root:root --chmod=755 ./webpack.config.js .
COPY --chown=root:root --chmod=755 ./build ./build
COPY --chown=root:root --chmod=755 ./server ./server
COPY --chown=root:root --chmod=755 ./test ./test
COPY --chown=root:root --chmod=755 ./index.js .

# Build application
RUN npm run build

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
RUN npm ci --engine-strict --ignore-scripts --omit=dev

# Copy only what is required to run the service
COPY --chown=root:root --chmod=755 ./webpack.config.js .
COPY --chown=root:root --chmod=755 ./build ./build
COPY --chown=root:root --chmod=755 ./server ./server
COPY --chown=root:root --chmod=755 ./index.js .

# Build production assets
RUN npm run build

# Runtime user must NOT be root (DEFRA standard)
USER node

EXPOSE ${PORT}

CMD ["node", "index.js"]
