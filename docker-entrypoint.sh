#!/bin/sh
# Simple entrypoint to replace placeholder in index.html with the runtime API key
set -e

HTML_FILE=/usr/share/nginx/html/index.html

if [ -f "$HTML_FILE" ]; then
	if [ -n "$API_KEY" ]; then
		echo "Injecting API_KEY into index.html"
		# Use awk to safely replace the placeholder if present
		awk -v key="$API_KEY" '{ gsub(/__API_KEY__/, key); print }' "$HTML_FILE" > "$HTML_FILE".tmp && mv "$HTML_FILE".tmp "$HTML_FILE"
	else
		echo "API_KEY not provided; leaving placeholder as-is"
	fi
else
	echo "Warning: $HTML_FILE not found — skipping API key injection"
fi

exec "$@"
