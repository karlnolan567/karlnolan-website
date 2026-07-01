#!/bin/sh
set -e

export CANONICAL_URL="${CANONICAL_URL:-http://135.181.39.41/}"
export ASSESSMENT_URL="${ASSESSMENT_URL:-https://178.104.254.165/assessment}"
export CHAT_WEBHOOK_URL="${CHAT_WEBHOOK_URL:-https://fridge-films-find-gloves.trycloudflare.com/webhook/bcai-website-chat/chat}"
export CHAT_WARM_CACHE_URL="${CHAT_WARM_CACHE_URL:-https://fridge-films-find-gloves.trycloudflare.com/webhook/bcai-warm-knowledge}"
export BOOKING_URL="${BOOKING_URL:-https://fridge-films-find-gloves.trycloudflare.com/webhook/booking}"
export BOOKING_SUCCESS_URL="${BOOKING_SUCCESS_URL:-http://135.181.39.41/index.html?call-booked=1}"

envsubst '${CANONICAL_URL} ${ASSESSMENT_URL} ${CHAT_WEBHOOK_URL} ${CHAT_WARM_CACHE_URL} ${BOOKING_URL} ${BOOKING_SUCCESS_URL}' \
	< /srv/js/site-config.template.js > /srv/js/site-config.js

exec "$@"
