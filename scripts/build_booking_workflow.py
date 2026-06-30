#!/usr/bin/env python3
"""Generate n8n/bcai-discovery-booking.workflow.json from plan spec."""
import json
from pathlib import Path

BOOKING_SUCCESS_URL = "http://178.104.254.165/index.html?call-booked=1"
BCC_EMAIL = "karlnolancompany@gmail.com"
SITE_BASE_URL = "http://178.104.254.165"
WHAT_WE_AUTOMATE_URL = f"{SITE_BASE_URL}/what-we-automate.html"
OPENROUTER_MODEL = "deepseek/deepseek-v4-flash"  # DeepSeek V4 Flash
OPENROUTER_APP_TITLE = "BCAI Booking"
# Distinct referer URL per app — OpenRouter keys apps by HTTP-Referer; title goes in X-OpenRouter-Title
OPENROUTER_HTTP_REFERER = f"{SITE_BASE_URL}/booking"

SITE_FAVICON_LINK = (
    '<link rel="icon" href="data:image/svg+xml,'
    '<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22>'
    '<rect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%230f1a2b%22/>'
    '<text x=%2250%22 y=%2244%22 text-anchor=%22middle%22 font-family=%22system-ui%22 '
    'font-weight=%22700%22 font-size=%2218%22 fill=%22%233b82f6%22>BCAI</text>'
    '<text x=%2250%22 y=%2272%22 text-anchor=%22middle%22 font-family=%22system-ui%22 '
    'font-weight=%22700%22 font-size=%2216%22 fill=%22%2306b6d4%22>Eng</text>'
    '</svg>">'
)

SUCCESS_REDIRECT_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    {SITE_FAVICON_LINK}
    <title>Booking confirmed</title>
    <meta http-equiv="refresh" content="0;url={BOOKING_SUCCESS_URL}">
    <script>window.location.replace({json.dumps(BOOKING_SUCCESS_URL)});</script>
</head>
<body>
    <p>Booking confirmed — redirecting you back to the site…</p>
</body>
</html>"""
# Local n8n credential refs (~/src/n8n-test-project) — re-attach on prod import
LOCAL_GOOGLE_CALENDAR_CREDS = {
    "googleCalendarOAuth2Api": {"id": "BBYKuDvN5Ff3ROXH", "name": "Google Calendar account"}
}
LOCAL_GMAIL_CREDS = {
    "gmailOAuth2": {"id": "zEXx7CxGsbxi3lSr", "name": "Gmail account"}
}
LOCAL_OPENROUTER_CREDS = {
    "openRouterApi": {"id": "hX4d03wqKExj2fbW", "name": "OpenRouter account"}
}

CALCULATE_SLOTS_JS = r"""// Europe/Dublin — Mon–Fri 9:30–17:00, max 4/day, lunch 13:00–14:00 blocked
// Book from tomorrow through 10 calendar days ahead (today excluded)
const TIMEZONE = 'Europe/Dublin';
const workingDays = [1, 2, 3, 4, 5];
const startHour = 9;
const startMinute = 30;
const endHour = 17;
const slotDuration = 30;
const maxSlotsPerDay = 4;
const lunchStartHour = 13;
const lunchEndHour = 14;
const firstDayOffset = 1;
const lookaheadDays = 10;

function pad(n) {
  return String(n).padStart(2, '0');
}

function isLunchSlot(hour, minute) {
  const slotStartMin = hour * 60 + minute;
  const slotEndMin = slotStartMin + slotDuration;
  const lunchStartMin = lunchStartHour * 60;
  const lunchEndMin = lunchEndHour * 60;
  return slotStartMin < lunchEndMin && slotEndMin > lunchStartMin;
}

function getOffsetForZone(timeZone, date) {
  const utcF = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
  const tzF = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
  const utcParts = Object.fromEntries(utcF.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const tzParts = Object.fromEntries(tzF.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const utcMin = (+utcParts.hour) * 60 + (+utcParts.minute);
  const tzMin = (+tzParts.hour) * 60 + (+tzParts.minute);
  let diff = tzMin - utcMin;
  if (diff < -720) diff += 1440;
  if (diff > 720) diff -= 1440;
  const sign = diff >= 0 ? '+' : '-';
  const abs = Math.abs(diff);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function dublinISO(year, month, day, hour, minute) {
  const naive = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
  let guess = Date.parse(`${naive}Z`);
  for (let i = 0; i < 4; i++) {
    const formatted = new Intl.DateTimeFormat('sv-SE', {
      timeZone: TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(guess));
    const target = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:00`;
    const diff = Date.parse(formatted.replace(' ', 'T') + 'Z') - Date.parse(target.replace(' ', 'T') + 'Z');
    guess -= diff;
  }
  const offset = getOffsetForZone(TIMEZONE, new Date(guess));
  return `${naive}${offset}`;
}

function pickDailySlots(daySlots, maxPerDay) {
  const morning = daySlots.filter((s) => {
    const hour = parseInt(s.value.split('T')[1].slice(0, 2), 10);
    return hour < lunchStartHour;
  });
  const afternoon = daySlots.filter((s) => {
    const hour = parseInt(s.value.split('T')[1].slice(0, 2), 10);
    return hour >= lunchEndHour;
  });

  if (morning.length === 0 || afternoon.length === 0) {
    return daySlots.slice(0, maxPerDay);
  }

  let morningTake = Math.floor(maxPerDay / 2);
  let afternoonTake = maxPerDay - morningTake;
  morningTake = Math.min(morningTake, morning.length);
  afternoonTake = Math.min(afternoonTake, afternoon.length);

  const used = new Set();
  const selected = [];
  for (const slot of [...morning.slice(0, morningTake), ...afternoon.slice(0, afternoonTake)]) {
    selected.push(slot);
    used.add(slot.value);
  }

  if (selected.length < maxPerDay) {
    for (const slot of daySlots) {
      if (used.has(slot.value)) continue;
      selected.push(slot);
      used.add(slot.value);
      if (selected.length >= maxPerDay) break;
    }
  }

  selected.sort((a, b) => new Date(a.value) - new Date(b.value));
  return selected;
}

function getEventBounds(event) {
  if (!event || !event.start) return null;

  if (typeof event.start === 'string') {
    if (!event.end) return null;
    return { start: new Date(event.start), end: new Date(event.end) };
  }

  if (event.start.dateTime) {
    return {
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
    };
  }

  if (event.start.date) {
    const endDate = event.end?.date || event.start.date;
    return {
      start: new Date(event.start.date + 'T00:00:00'),
      end: new Date(endDate + 'T00:00:00'),
    };
  }

  return null;
}

function slotsOverlap(slotStart, slotEnd, eventStart, eventEnd) {
  return slotStart < eventEnd && slotEnd > eventStart;
}

const now = new Date();
const inputItems = $input.all();
const existingEvents = [];

if (inputItems.length > 0) {
  for (const item of inputItems) {
    const event = item.json;
    if (!event || Object.keys(event).length === 0) continue;

    const bounds = getEventBounds(event);
    if (!bounds) continue;

    const { start: eventStart, end: eventEnd } = bounds;
    if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) continue;

    const windowEnd = new Date(now);
    windowEnd.setDate(now.getDate() + lookaheadDays + 1);
    if (eventStart < windowEnd && eventEnd > now) {
      existingEvents.push({ start: eventStart, end: eventEnd });
    }
  }
}

const slots = [];

for (let day = firstDayOffset; day <= lookaheadDays; day++) {
  const currentDate = new Date(now);
  currentDate.setDate(now.getDate() + day);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dayOfMonth = currentDate.getDate();
  const dayOfWeek = currentDate.getDay();
  if (!workingDays.includes(dayOfWeek)) continue;

  const daySlots = [];

  const dayStartMin = startHour * 60 + startMinute;
  const dayEndMin = endHour * 60;

  for (let t = dayStartMin; t < dayEndMin; t += slotDuration) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
      if (isLunchSlot(hour, minute)) continue;

      const slotStartString = dublinISO(year, month, dayOfMonth, hour, minute);
      const slotStart = new Date(slotStartString);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
      if (slotStart <= now) continue;

      let isAvailable = true;
      for (const event of existingEvents) {
        if (slotsOverlap(slotStart, slotEnd, event.start, event.end)) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const displayHour12 = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${weekdays[dayOfWeek]}, ${months[month - 1]} ${dayOfMonth}, ${year} at ${displayHour12}:${pad(minute)} ${ampm}`;
        daySlots.push({ value: slotStartString, label });
      }
  }

  const picked = pickDailySlots(daySlots, maxSlotsPerDay);
  if (picked.length > 0) {
    slots.push(...picked);
  }
}

if (slots.length === 0) {
  return [{ json: { noSlots: true } }];
}

return slots.map(slot => ({ json: slot }));
"""

END_TIME_JS = r"""const webhookData = $input.first().json.body;
const startTime = webhookData.timeslot;

const match = startTime.match(/^(.+T)(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})$/);
if (!match) {
  throw new Error('Invalid time format: ' + startTime);
}

const [_, prefix, hours, minutes, seconds, timezone] = match;
const totalMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10) + 30;
const newHours = Math.floor(totalMinutes / 60);
const newMinutes = totalMinutes % 60;
const endTime = `${prefix}${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${seconds}${timezone}`;

return [{
  json: {
    body: {
      ...webhookData,
      startTime,
      endTime
    }
  }
}];
"""

FORMAT_EMAIL_JS = r"""const eventData = $input.first().json;
const webhookData = $('Webhook - Submit Form').first().json.body;

const startDate = new Date(eventData.start.dateTime);
const endDate = new Date(eventData.end.dateTime);

const formattedDate = startDate.toLocaleDateString('en-IE', {
  timeZone: 'Europe/Dublin',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const timeOpts = { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: true };
const formattedTime = startDate.toLocaleTimeString('en-IE', timeOpts) + ' - ' + endDate.toLocaleTimeString('en-IE', timeOpts);

return [{
  json: {
    ...eventData,
    formattedDate,
    formattedTime,
    firstName: webhookData.firstName,
    lastName: webhookData.lastName,
    email: webhookData.email,
    company: webhookData.company || 'Not provided',
    message: webhookData.message || 'No message provided'
  }
}];
"""

BUILD_HTML_JS = r"""const items = $input.all();
const slots = items.map(item => item.json).filter(slot => slot && slot.value);

function formatSlotTimeFromValue(value) {
  const [, timePart] = value.split('T');
  const [hour, minute] = timePart.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

const slotsByDate = {};
slots.forEach(slot => {
  const [datePart] = slot.value.split('T');
  if (!slotsByDate[datePart]) {
    const displayDateObj = new Date(datePart + 'T00:00:00');
    slotsByDate[datePart] = {
      date: displayDateObj,
      dateKey: datePart,
      displayDate: displayDateObj.toLocaleDateString('en-IE', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      slots: []
    };
  }
  slotsByDate[datePart].slots.push({
    value: slot.value,
    time: formatSlotTimeFromValue(slot.value)
  });
});

const groupedSlots = Object.values(slotsByDate).sort((a, b) => a.date - b.date);
const slotsJson = JSON.stringify(groupedSlots);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    __SITE_FAVICON__
    <title>Book a Discovery Call — Bespoke Core AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            background: linear-gradient(180deg, #121f33 0%, #0f1a2b 50%, #0a111c 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            color: #e8edf3;
        }
        .container {
            background: linear-gradient(145deg, rgba(28, 44, 68, 0.96) 0%, rgba(15, 26, 43, 0.92) 100%);
            border: 1px solid rgba(59, 130, 246, 0.15);
            border-radius: 16px;
            box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.4);
            max-width: 700px;
            width: 100%;
            padding: 40px;
        }
        .label-mono {
            font-family: ui-monospace, monospace;
            font-size: 12px;
            color: #10b981;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
            margin-bottom: 8px;
        }
        h1 {
            color: #e8edf3;
            text-align: center;
            margin-bottom: 8px;
            font-size: 28px;
            font-weight: 700;
        }
        .subtitle {
            text-align: center;
            color: #b8c5d3;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .date-navigator {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 15px;
            background: rgba(15, 26, 43, 0.6);
            border: 1px solid rgba(59, 130, 246, 0.1);
            border-radius: 12px;
        }
        .nav-button {
            background: #3b82f6;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        }
        .nav-button:hover { background: #2563eb; }
        .nav-button:disabled { background: #1f3049; color: #7d93a8; cursor: not-allowed; }
        .current-date {
            font-size: 17px;
            font-weight: 600;
            color: #10b981;
            text-align: center;
            flex: 1;
        }
        .slots-container { margin-bottom: 12px; }
        .time-slots {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
        }
        .time-slot {
            padding: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 10px;
            background: rgba(15, 26, 43, 0.5);
            color: #e8edf3;
            cursor: pointer;
            text-align: center;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .time-slot:hover {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }
        .time-slot.selected {
            background: #10b981;
            color: #0f1a2b;
            border-color: #10b981;
            font-weight: 600;
        }
        .no-slots-message {
            text-align: center;
            padding: 40px;
            color: #94a8bc;
            font-style: italic;
        }
        .selected-info {
            background: rgba(16, 185, 129, 0.08);
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 16px;
            border-left: 4px solid #10b981;
            display: none;
            color: #b8c5d3;
        }
        .selected-info.visible { display: block; }
        .selected-info strong { color: #10b981; }
        .form-divider {
            height: 1px;
            background: rgba(59, 130, 246, 0.15);
            margin: 16px 0;
        }
        .form-section-title {
            font-size: 16px;
            color: #3b82f6;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            color: #b8c5d3;
            font-weight: 600;
            font-size: 14px;
        }
        input[type="text"], input[type="email"], textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 10px;
            font-size: 15px;
            background: rgba(15, 26, 43, 0.6);
            color: #e8edf3;
            font-family: inherit;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        textarea { resize: vertical; min-height: 100px; }
        .name-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        button[type="submit"] {
            width: 100%;
            padding: 15px;
            background: linear-gradient(to right, #3b82f6, #06b6d4, #10b981);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        button[type="submit"]:hover { opacity: 0.92; }
        button[type="submit"]:disabled { opacity: 0.4; cursor: not-allowed; }
        button[type="submit"].is-loading {
            opacity: 0.85;
            cursor: wait;
            pointer-events: none;
        }
        .submit-spinner {
            display: inline-block;
            margin-right: 8px;
            animation: hourglass-pulse 1s ease-in-out infinite;
        }
        @keyframes hourglass-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.95); }
        }
        .form-loading input,
        .form-loading textarea,
        .form-loading .nav-button,
        .form-loading .time-slot {
            pointer-events: none;
            opacity: 0.7;
        }
        .required { color: #f87171; }
        .tz-note { text-align: center; font-size: 12px; color: #7d93a8; margin-top: 16px; }
        @media (max-width: 600px) {
            .container { padding: 30px 20px; }
            .time-slots { grid-template-columns: repeat(2, 1fr); }
            .name-group { grid-template-columns: 1fr; }
            h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <p class="label-mono">// Discovery Call</p>
        <h1>Book a 30-Minute Discovery Call</h1>
        <p class="subtitle">Bespoke Core AI Engineering</p>
        <form method="POST" action="/webhook/booking" id="bookingForm">
            <div class="date-navigator">
                <button type="button" class="nav-button" id="prevDay">&#8249;</button>
                <div class="current-date" id="currentDate"></div>
                <button type="button" class="nav-button" id="nextDay">&#8250;</button>
            </div>
            <div class="slots-container">
                <div class="time-slots" id="timeSlotsContainer"></div>
            </div>
            <input type="hidden" name="timeslot" id="selectedSlot" required>
            <div class="selected-info" id="selectedInfo">
                <strong>Selected:</strong> <span id="selectedSlotDisplay"></span>
            </div>
            <div class="form-divider"></div>
            <div class="form-section-title">Your details</div>
            <div class="name-group">
                <div class="form-group">
                    <label for="firstName">First name <span class="required">*</span></label>
                    <input type="text" id="firstName" name="firstName" required autocomplete="given-name">
                </div>
                <div class="form-group">
                    <label for="lastName">Last name <span class="required">*</span></label>
                    <input type="text" id="lastName" name="lastName" required autocomplete="family-name">
                </div>
            </div>
            <div class="form-group">
                <label for="email">Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
                <label for="company">Company <span class="required">*</span></label>
                <input type="text" id="company" name="company" required autocomplete="organization">
            </div>
            <div class="form-group">
                <label for="message">What would you like to discuss?</label>
                <textarea id="message" name="message" placeholder="Describe the workflow or problem you want to solve."></textarea>
            </div>
            <button type="submit" id="submitButton">Confirm booking</button>
        </form>
        <p class="tz-note">All times shown in GMT+1.</p>
    </div>
    <script>
        const slotsByDate = ${slotsJson};
        let currentDayIndex = 0;
        let selectedSlotElement = null;
        const prevButton = document.getElementById('prevDay');
        const nextButton = document.getElementById('nextDay');
        const currentDateDisplay = document.getElementById('currentDate');
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        const selectedSlotInput = document.getElementById('selectedSlot');
        const selectedSlotDisplay = document.getElementById('selectedSlotDisplay');
        const selectedInfo = document.getElementById('selectedInfo');
        const submitButton = document.getElementById('submitButton');

        function renderDay(index) {
            currentDayIndex = index;
            prevButton.disabled = index === 0;
            nextButton.disabled = index === slotsByDate.length - 1;
            const dayData = slotsByDate[index];
            currentDateDisplay.textContent = dayData.displayDate;
            timeSlotsContainer.innerHTML = '';
            if (dayData.slots.length > 0) {
                dayData.slots.forEach(slot => {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = slot.time;
                    timeSlot.dataset.value = slot.value;
                    timeSlot.dataset.label = dayData.displayDate + ' at ' + slot.time;
                    timeSlot.addEventListener('click', function() {
                        if (selectedSlotElement) selectedSlotElement.classList.remove('selected');
                        this.classList.add('selected');
                        selectedSlotElement = this;
                        selectedSlotInput.value = this.dataset.value;
                        selectedSlotDisplay.textContent = this.dataset.label;
                        selectedInfo.classList.add('visible');
                        submitButton.disabled = false;
                    });
                    timeSlotsContainer.appendChild(timeSlot);
                });
            } else {
                timeSlotsContainer.innerHTML = '<div class="no-slots-message">No available slots for this day</div>';
            }
        }

        prevButton.addEventListener('click', () => { if (currentDayIndex > 0) renderDay(currentDayIndex - 1); });
        nextButton.addEventListener('click', () => { if (currentDayIndex < slotsByDate.length - 1) renderDay(currentDayIndex + 1); });

        function setSubmitLoading(loading) {
            const form = document.getElementById('bookingForm');
            if (loading) {
                submitButton.disabled = true;
                submitButton.classList.add('is-loading');
                submitButton.setAttribute('aria-busy', 'true');
                submitButton.innerHTML = '<span class="submit-spinner" aria-hidden="true">&#8987;</span> Processing your booking\u2026';
                form.classList.add('form-loading');
            }
        }

        document.getElementById('bookingForm').addEventListener('submit', function(e) {
            if (!selectedSlotInput.value) {
                e.preventDefault();
                alert('Please select a time slot first');
                return;
            }
            setSubmitLoading(true);
        });
        if (slotsByDate.length > 0) {
            renderDay(0);
            submitButton.disabled = true;
        } else {
            currentDateDisplay.textContent = 'No available dates';
            timeSlotsContainer.innerHTML = '<div class="no-slots-message">No available slots in the next 10 days</div>';
            prevButton.disabled = true;
            nextButton.disabled = true;
            submitButton.disabled = true;
        }
    </script>
</body>
</html>`;

return [{ json: { html } }];
"""

PREPARE_OPENROUTER_JS = f"""const booking = $input.first().json;

const systemMessage = `You are Karl Nolan (Bespoke Core AI, Limerick). Write ONE short plain-text paragraph (first person) for a discovery-call confirmation email.
Thank them by first name, mention their company, and if their message is specific briefly reflect it; if vague or empty stay general — do not invent pain points.
Professional, warm, not salesy. No URLs, links, dates/times, sign-off, or pricing. Max 80 words.`;

const userMessage = `First name: ${{booking.firstName}}
Company: ${{booking.company}}
Message: ${{booking.message}}`;

return [{{
  json: {{
    ...booking,
    openRouterBody: {{
      model: '{OPENROUTER_MODEL}',
      temperature: 0.3,
      max_tokens: 180,
      reasoning: {{ effort: 'none' }},
      provider: {{
        sort: 'latency',
        preferred_max_latency: {{ p90: 4 }},
      }},
      messages: [
        {{ role: 'system', content: systemMessage }},
        {{ role: 'user', content: userMessage }},
      ],
    }},
  }},
}}];
"""

COMPOSE_EMAIL_JS = f"""const booking = $('Prepare OpenRouter Request').first().json;
const openRouterResponse = $input.first().json;

const FALLBACK = `Thank you for booking a free 30-minute discovery call. I look forward to learning more about ${{booking.company}} and hearing what's slowing your team down on our call.`;

let personalNote = '';
const aiContent = openRouterResponse.choices?.[0]?.message?.content;
if (typeof aiContent === 'string' && aiContent.trim()) {{
  personalNote = aiContent.trim();
}} else {{
  personalNote = FALLBACK;
}}

function sanitizeNote(text) {{
  return String(text)
    .replace(/https?:\\/\\/\\S+/gi, '')
    .replace(/\\bBefore (?:we talk|our call)[^.]*\\./gi, '')
    .replace(/\\bfree to (?:glance|explore|review)[^.]*\\./gi, '')
    .replace(/  +/g, ' ')
    .replace(/\\n{3,}/g, '\\n\\n')
    .trim();
}}

personalNote = sanitizeNote(personalNote) || FALLBACK;

function esc(s) {{
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}}

const noteHtml = personalNote
  .split(/\\n\\n+/)
  .map(p => `<p style="margin:0 0 16px;color:#333;">${{esc(p).replace(/\\n/g, '<br>')}}</p>`)
  .join('');

const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
        .header {{ background: #0f1a2b; color: #e8edf3; padding: 32px 30px; text-align: center; border-bottom: 4px solid #10b981; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .header p {{ margin: 8px 0 0; color: #b8c5d3; font-size: 14px; }}
        .content {{ padding: 32px 30px; background: #f4f6f9; }}
        .details {{ background: white; padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }}
        .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; display: flex; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ font-weight: bold; color: #3b82f6; min-width: 120px; }}
        .value {{ flex: 1; color: #333; }}
        .button-container {{ text-align: center; margin: 28px 0; }}
        .button {{ display: inline-block; padding: 14px 32px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }}
        .links-box {{ background: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; font-size: 14px; }}
        .footer {{ text-align: center; color: #999; font-size: 12px; padding: 24px; background: #eef1f5; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Discovery call confirmed</h1>
            <p>Bespoke Core AI Engineering</p>
        </div>
        <div class="content">
            <p style="margin:0 0 16px;">Dear ${{esc(booking.firstName)}} ${{esc(booking.lastName)}},</p>
            ${{noteHtml}}
            <div class="details">
                <div class="detail-row"><span class="label">Date</span><span class="value">${{esc(booking.formattedDate)}}</span></div>
                <div class="detail-row"><span class="label">Time</span><span class="value">${{esc(booking.formattedTime)}} (Ireland)</span></div>
                <div class="detail-row"><span class="label">Duration</span><span class="value">30 minutes</span></div>
                <div class="detail-row"><span class="label">Company</span><span class="value">${{esc(booking.company)}}</span></div>
            </div>
            <div class="links-box">
                <p style="margin:0;"><strong>Before our call:</strong><br>
                <a href="{SITE_BASE_URL}" style="color:#3b82f6;">Visit our website</a> ·
                <a href="{WHAT_WE_AUTOMATE_URL}" style="color:#3b82f6;">See what we automate</a></p>
            </div>
            <div class="button-container"><a href="${{esc(booking.htmlLink)}}" class="button">Add to Google Calendar</a></div>
            <p style="margin:24px 0 0;color:#333;">Kind regards,<br><strong>Karl Nolan</strong><br><span style="color:#666;font-size:14px;">Principal Consultant, Bespoke Core AI Engineering</span></p>
            <p style="margin-top:24px;padding:16px;background:#fff;border-radius:8px;font-size:14px;"><strong>Need to reschedule?</strong><br>Reply to this email.</p>
        </div>
        <div class="footer"><p>Automated confirmation from Bespoke Core AI Engineering, Limerick, Ireland.</p></div>
    </div>
</body>
</html>`;

return [{{
  json: {{
    ...booking,
    emailHtml,
  }},
}}];
"""

BUILD_HTML_JS = BUILD_HTML_JS.replace("__SITE_FAVICON__", "    " + SITE_FAVICON_LINK)

workflow = {
    "id": "bcai-discovery-booking-001",
    "name": "BCAI Discovery Call Booking",
    "active": False,
    "nodes": [
        {
            "id": "3124fd95-0fd3-4f81-98e9-86b5fb76400c",
            "name": "Webhook - Submit Form",
            "type": "n8n-nodes-base.webhook",
            "position": [-1088, 560],
            "webhookId": "bcai-booking-submit",
            "parameters": {
                "path": "booking",
                "httpMethod": "POST",
                "responseMode": "responseNode",
                "options": {},
            },
            "typeVersion": 2,
        },
        {
            "id": "1f9bede9-b36a-4ebf-9697-12c53d5a3146",
            "name": "Webhook - Show Form",
            "type": "n8n-nodes-base.webhook",
            "position": [-1088, 336],
            "webhookId": "bcai-booking-form",
            "parameters": {
                "path": "booking",
                "responseMode": "responseNode",
                "options": {},
            },
            "typeVersion": 2,
        },
        {
            "id": "4b727001-37aa-42df-bb4c-98b75bbe3510",
            "name": "Get Calendar Events",
            "type": "n8n-nodes-base.googleCalendar",
            "position": [-864, 336],
            "alwaysOutputData": True,
            "onError": "continueRegularOutput",
            "parameters": {
                "operation": "getAll",
                "calendar": {
                    "__rl": True,
                    "mode": "list",
                    "value": "primary",
                    "cachedResultName": "Primary",
                },
                "returnAll": True,
                "options": {
                    "timeMin": "={{ $now.toISO() }}",
                    "timeMax": "={{ $now.plus({ days: 10 }).toISO() }}",
                },
            },
            "typeVersion": 1.2,
            "credentials": LOCAL_GOOGLE_CALENDAR_CREDS,
        },
        {
            "id": "796ed038-04a1-479e-8ac8-f162b22319ad",
            "name": "Calculate Available Slots",
            "type": "n8n-nodes-base.code",
            "position": [-640, 336],
            "alwaysOutputData": True,
            "parameters": {"jsCode": CALCULATE_SLOTS_JS},
            "typeVersion": 2,
        },
        {
            "id": "b9808377-3551-4192-9124-0b7d2f452586",
            "name": "Build HTML Form",
            "type": "n8n-nodes-base.code",
            "position": [-416, 336],
            "parameters": {"jsCode": BUILD_HTML_JS},
            "typeVersion": 2,
        },
        {
            "id": "6c9e11ac-bda2-4e73-abf7-4b3d43d5e802",
            "name": "Respond to Webhook",
            "type": "n8n-nodes-base.respondToWebhook",
            "position": [-208, 336],
            "parameters": {
                "respondWith": "text",
                "responseBody": "={{$json.html}}",
                "options": {
                    "responseHeaders": {
                        "entries": [
                            {"name": "Content-Type", "value": "text/html; charset=utf-8"}
                        ]
                    }
                },
            },
            "typeVersion": 1.1,
        },
        {
            "id": "997c252a-ea1c-455b-8afe-392225b73d70",
            "name": "Calculate End Time",
            "type": "n8n-nodes-base.code",
            "position": [-880, 560],
            "parameters": {"jsCode": END_TIME_JS},
            "typeVersion": 2,
        },
        {
            "id": "e0130056-a309-4a1f-bf22-7dc192bd2fce",
            "name": "Create Calendar Event",
            "type": "n8n-nodes-base.googleCalendar",
            "position": [-656, 560],
            "parameters": {
                "calendar": {
                    "__rl": True,
                    "mode": "list",
                    "value": "primary",
                    "cachedResultName": "Primary",
                },
                "start": "={{ $json.body.timeslot }}",
                "end": "={{ $json.body.endTime }}",
                "additionalFields": {
                    "summary": "=Discovery call — {{ $json.body.firstName }} {{ $json.body.lastName }} ({{ $json.body.company }})",
                    "description": "=Name: {{ $json.body.firstName }} {{ $json.body.lastName }}\nCompany: {{ $json.body.company }}\nEmail: {{ $json.body.email }}\n\nMessage: {{ $json.body.message || 'No message provided' }}",
                },
            },
            "typeVersion": 1.2,
            "credentials": LOCAL_GOOGLE_CALENDAR_CREDS,
        },
        {
            "id": "f296c75f-87bb-4463-8504-56534c918486",
            "name": "Format Email Data",
            "type": "n8n-nodes-base.code",
            "position": [-432, 672],
            "parameters": {"jsCode": FORMAT_EMAIL_JS},
            "typeVersion": 2,
        },
        {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Prepare OpenRouter Request",
            "type": "n8n-nodes-base.code",
            "position": [-320, 560],
            "parameters": {"jsCode": PREPARE_OPENROUTER_JS},
            "typeVersion": 2,
        },
        {
            "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            "name": "Call OpenRouter (Booking)",
            "type": "n8n-nodes-base.httpRequest",
            "position": [-208, 560],
            "onError": "continueRegularOutput",
            "parameters": {
                "method": "POST",
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "openRouterApi",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "Referer", "value": OPENROUTER_HTTP_REFERER},
                        {"name": "HTTP-Referer", "value": OPENROUTER_HTTP_REFERER},
                        {"name": "X-OpenRouter-Title", "value": OPENROUTER_APP_TITLE},
                        {"name": "X-Title", "value": OPENROUTER_APP_TITLE},
                    ]
                },
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={{ $json.openRouterBody }}",
                "options": {
                    "timeout": 8000,
                },
            },
            "typeVersion": 4.2,
            "credentials": LOCAL_OPENROUTER_CREDS,
        },
        {
            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
            "name": "Compose Confirmation Email",
            "type": "n8n-nodes-base.code",
            "position": [-96, 560],
            "parameters": {"jsCode": COMPOSE_EMAIL_JS},
            "typeVersion": 2,
        },
        {
            "id": "7887c143-437b-49b1-bc52-09d0cc02e42b",
            "name": "Send Confirmation Email",
            "type": "n8n-nodes-base.gmail",
            "position": [16, 560],
            "parameters": {
                "sendTo": "={{ $json.email }}",
                "subject": "={{ $json.firstName }} — discovery call confirmed for {{ $json.formattedDate }}",
                "message": "={{ $json.emailHtml }}",
                "options": {
                    "bccList": BCC_EMAIL,
                    "appendAttribution": False,
                },
            },
            "typeVersion": 2.1,
            "credentials": LOCAL_GMAIL_CREDS,
        },
        {
            "id": "a94a2cdc-0ad0-480d-8e58-5352f2416756",
            "name": "Redirect to Site",
            "type": "n8n-nodes-base.respondToWebhook",
            "position": [-432, 448],
            "parameters": {
                "respondWith": "text",
                "responseBody": SUCCESS_REDIRECT_HTML,
                "options": {
                    "responseHeaders": {
                        "entries": [
                            {"name": "Content-Type", "value": "text/html; charset=utf-8"}
                        ]
                    }
                },
            },
            "typeVersion": 1.1,
        },
        {
            "id": "1085bf5c-a45a-4bf9-ade3-dd76aab87cf5",
            "name": "Sticky Note",
            "type": "n8n-nodes-base.stickyNote",
            "position": [-1056, -80],
            "parameters": {
                "width": 900,
                "height": 380,
                "content": f"""## BCAI Discovery Call Booking

**GET** `/webhook/booking` — booking form with live slots
**POST** `/webhook/booking` — create event → redirect immediately → AI email in background

### Performance
- **Redirect to Site** runs right after calendar create (user is not blocked by OpenRouter)
- OpenRouter: `max_tokens: 180`, `provider.sort: latency`, `reasoning.effort: none`, 8s HTTP timeout + fallback text

### Setup
1. Google Calendar OAuth2 + Gmail OAuth2 (karlnolancompany@gmail.com)
2. Availability: Mon–Fri 9:30–17:00 Europe/Dublin, max 4 slots/day, lunch 13:00–14:00 blocked — **Calculate Available Slots**
3. **Redirect to Site** — HTML page with `window.location.replace()` to `{BOOKING_SUCCESS_URL}` (avoids POST→302 replay to static site)
4. BCC on confirmation: `{BCC_EMAIL}`
5. **OpenRouter** — `{OPENROUTER_MODEL}` personalises the email body (`{OPENROUTER_APP_TITLE}` app headers)

### Local test
http://localhost:5678/webhook/booking""",
            },
            "typeVersion": 1,
        },
    ],
    "connections": {
        "Webhook - Show Form": {
            "main": [[{"node": "Get Calendar Events", "type": "main", "index": 0}]]
        },
        "Get Calendar Events": {
            "main": [[{"node": "Calculate Available Slots", "type": "main", "index": 0}]]
        },
        "Calculate Available Slots": {
            "main": [[{"node": "Build HTML Form", "type": "main", "index": 0}]]
        },
        "Build HTML Form": {
            "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
        },
        "Webhook - Submit Form": {
            "main": [[{"node": "Calculate End Time", "type": "main", "index": 0}]]
        },
        "Calculate End Time": {
            "main": [[{"node": "Create Calendar Event", "type": "main", "index": 0}]]
        },
        "Create Calendar Event": {
            "main": [[
                {"node": "Redirect to Site", "type": "main", "index": 0},
                {"node": "Format Email Data", "type": "main", "index": 0},
            ]]
        },
        "Format Email Data": {
            "main": [[{"node": "Prepare OpenRouter Request", "type": "main", "index": 0}]]
        },
        "Prepare OpenRouter Request": {
            "main": [[{"node": "Call OpenRouter (Booking)", "type": "main", "index": 0}]]
        },
        "Call OpenRouter (Booking)": {
            "main": [[{"node": "Compose Confirmation Email", "type": "main", "index": 0}]]
        },
        "Compose Confirmation Email": {
            "main": [[{"node": "Send Confirmation Email", "type": "main", "index": 0}]]
        },
    },
    "settings": {"executionOrder": "v1"},
    "pinData": {},
}

out = Path(__file__).resolve().parent.parent / "n8n" / "bcai-discovery-booking.workflow.json"
out.write_text(json.dumps(workflow, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size} bytes)")
