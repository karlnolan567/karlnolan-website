#!/usr/bin/env bash
# Measure chat webhook TTFB vs total time and confirm streaming chunks arrive.
set -euo pipefail

CHAT_URL="${CHAT_URL:-http://localhost:5678/webhook/bcai-website-chat/chat}"
PAYLOAD='{"action":"sendMessage","chatInput":"What services do you offer? Reply in one short sentence.","sessionId":"stream-test"}'

echo "Chat URL: $CHAT_URL"
echo "Sending request…"

TMP="$(mktemp)"
START_MS="$(python3 -c 'import time; print(int(time.time()*1000))')"

curl -sS -N \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream, application/json' \
  -X POST "$CHAT_URL" \
  -d "$PAYLOAD" \
  -o "$TMP" \
  -w 'HTTP %{http_code}\nContent-Type: %{content_type}\nTotal time: %{time_total}s\nTTFB: %{time_starttransfer}s\n' \
  2>/dev/null

FIRST_ITEM_MS=""
while IFS= read -r line; do
  trimmed="${line#data: }"
  if [[ "$trimmed" == *'"type":"item"'* || "$trimmed" == *'"type": "item"'* ]]; then
    if [[ -z "$FIRST_ITEM_MS" ]]; then
      FIRST_ITEM_MS="$(python3 -c 'import time; print(int(time.time()*1000))')"
    fi
  fi
done < "$TMP"

echo "--- Response preview (first 500 chars) ---"
head -c 500 "$TMP"
echo
echo "---"

if [[ -n "$FIRST_ITEM_MS" ]]; then
  TTFT_S="$(python3 - <<PY
start = int("$START_MS")
first = int("$FIRST_ITEM_MS")
print(f"{(first - start) / 1000:.3f}")
PY
)"
  echo "Approx time to first item chunk: ${TTFT_S}s"
else
  echo "No streaming item chunks detected (may be JSON fallback or workflow inactive)."
fi

rm -f "$TMP"
