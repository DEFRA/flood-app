#!/bin/sh

EXPECTED_NODE_VERSION=$(cat .nvmrc 2>/dev/null)
INSTALLED_VERSION=$(node -v 2>/dev/null)

if [ -z "$INSTALLED_VERSION" ] || [ -z "$EXPECTED_NODE_VERSION" ] || [ "${EXPECTED_NODE_VERSION}" != "$INSTALLED_VERSION" ]; then
  echo "Error: Installed Node.js version ($INSTALLED_VERSION) does not match expected version ($EXPECTED_NODE_VERSION)."
  exit 1
fi
