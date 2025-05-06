#!/bin/sh
set -e

# Ensure KEYCLOAK_URL and KEYCLOAK_REALM are set
if [ -z "$KEYCLOAK_URL" ] || [ -z "$KEYCLOAK_REALM" ]; then
  echo "Missing KEYCLOAK_URL or KEYCLOAK_REALM environment variable"
  exit 1
fi

# Construct discovery endpoint URL
URL="$KEYCLOAK_URL/realms/$KEYCLOAK_REALM/.well-known/openid-configuration"
echo "Waiting for Keycloak at $URL"
# Retry until Keycloak responds successfully
until curl -sf "$URL" > /dev/null; do
  echo "Keycloak not ready, retrying in 2 seconds..."
  sleep 10
done
echo "Keycloak is ready, starting API"
# Execute the API binary
exec ./api