#!/bin/sh
# Entrypoint: inject runtime API key into built index.html and ensure nginx listens on the
# port provided by Cloud Run via the PORT env var (default 8080).
set -e

HTML_FILE=/usr/share/nginx/html/index.html
NGINX_CONF=/etc/nginx/conf.d/default.conf

# Inject API key into index.html if present
if [ -f "$HTML_FILE" ]; then
	if [ -n "${API_KEY:-}" ]; then
		echo "[entrypoint] Injecting API_KEY into index.html"
		awk -v key="$API_KEY" '{ gsub(/__API_KEY__/, key); print }' "$HTML_FILE" > "$HTML_FILE".tmp && mv "$HTML_FILE".tmp "$HTML_FILE"
	else
		echo "[entrypoint] API_KEY not provided; leaving placeholder as-is"
	fi
else
	echo "[entrypoint] Warning: $HTML_FILE not found — skipping API key injection"
fi

# Ensure nginx listens on the port Cloud Run expects
if [ -n "${PORT:-}" ]; then
	echo "[entrypoint] Configuring nginx to listen on PORT=${PORT}"
	if [ -f "$NGINX_CONF" ]; then
		# Replace any listen directive for numeric ports with the requested PORT
		sed -E -i "s/listen[[:space:]]+[0-9]+;/listen ${PORT};/g" "$NGINX_CONF" || true
	else
		echo "[entrypoint] Warning: nginx conf not found at $NGINX_CONF"
	fi
else
	echo "[entrypoint] PORT env var not set; leaving nginx config as-is"
fi

exec "$@"
