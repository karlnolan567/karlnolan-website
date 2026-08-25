#!/bin/sh
set -e

export CANONICAL_URL="${CANONICAL_URL:-https://www.bespoke-ai.ie/}"
export ASSESSMENT_URL="${ASSESSMENT_URL:-https://www.bespoke-ai.ie/assessment}"
export CHAT_EMBED_URL="${CHAT_EMBED_URL:-https://genai-app-bespokeaiassistant-eu-793778137823.europe-west1.run.app/?key=9B4GmNgIo1df5jd519Eqgun3ObMSuvPW}"
export BOOKING_URL="${BOOKING_URL:-https://calendar.google.com/calendar/appointments/schedules/AcZssZ2UKPIrCb8p6jWtnEqzB2RUlMEF8nMcT4fkRaG9LA0je9CCptn8WCIaq_LRsQNTNYFjYaTIApYL}"

envsubst '${CANONICAL_URL} ${ASSESSMENT_URL} ${CHAT_EMBED_URL} ${BOOKING_URL}' \
	< /srv/js/site-config.template.js > /srv/js/site-config.js

exec "$@"
