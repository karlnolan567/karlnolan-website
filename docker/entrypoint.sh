#!/bin/sh
set -e

export CANONICAL_URL="${CANONICAL_URL:-https://www.bespoke-ai.ie/}"
export ASSESSMENT_URL="${ASSESSMENT_URL:-https://www.bespoke-ai.ie/assessment}"
export CHAT_EMBED_URL="${CHAT_EMBED_URL:-https://genai-app-bespokeaiassistant-1-1785325027030-793778137823.us-central1.run.app/?key=9B4GmNgIo1df5jd519Eqgun3ObMSuvPW}"
export CHAT_WEBHOOK_URL="${CHAT_WEBHOOK_URL:-https://www.bespoke-ai.ie/webhook/bcai-website-chat/chat}"
export CHAT_WARM_CACHE_URL="${CHAT_WARM_CACHE_URL:-https://www.bespoke-ai.ie/webhook/bcai-warm-knowledge}"
export BOOKING_URL="${BOOKING_URL:-https://www.bespoke-ai.ie/webhook/booking}"
export BOOKING_SUCCESS_URL="${BOOKING_SUCCESS_URL:-https://www.bespoke-ai.ie/index.html?call-booked=1}"

envsubst '${CANONICAL_URL} ${ASSESSMENT_URL} ${CHAT_EMBED_URL} ${CHAT_WEBHOOK_URL} ${CHAT_WARM_CACHE_URL} ${BOOKING_URL} ${BOOKING_SUCCESS_URL}' \
	< /srv/js/site-config.template.js > /srv/js/site-config.js

exec "$@"
