/**
 * Fundamentals of AI — booking setup (Google Apps Script)
 *
 * What you get:
 * 1. Spreadsheet with a Courses catalogue (name, date, place, capacity, booked)
 * 2. Bookings log (individual seat requests against a course_id)
 * 3. Group enquiry Google Form (free-form dates — you negotiate with the client)
 * 4. Individual booking Web App — 2-step wizard (details → Stripe Checkout)
 *
 * Setup:
 * 1. https://script.google.com → New project
 * 2. Paste this file as Code.gs
 * 3. File → New → HTML file → name it IndividualBooking → paste IndividualBooking.html
 *    from lead-intake/IndividualBooking.html in the web_site repo
 * 4. EXISTING_SS_ID is already set to the shared workbook — run setupFundamentalsBooking once → authorize
 *    (seeds Courses/Bookings on that sheet + creates group form)
 * 5. Script properties: STRIPE_SECRET_KEY = sk_test_… / sk_live_…
 * 6. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy Web App URL + group form URL into js/site-config.js → fundamentalsFormUrls
 *
 * Manage capacity: edit the TrainingDetails sheet (total_places / booked_count / active).
 * booked_count increments only after successful Stripe payment.
 */

var BRAND = 'Bespoke Core AI Engineering Limited';
var LEGAL_NAME = 'BESPOKE CORE AI ENGINEERING LIMITED';
var COMPANY_VAT = '4761956DH';
var COMPANY_EMAIL = 'info@bespoke-ai.ie';
var COMPANY_ADDRESS = '3 Heather Grove, Glencairin, Dooradoyle, Limerick, Ireland, V94 N5RC';
var WORKBOOK_TITLE = 'Trainings Details and Bookings 2026';
/** Shared workbook — do not create a second sheet when this is set. */
var EXISTING_SS_ID = '1ZDS2nBLfHIh_3HTncYpq6paplElVAJX56Gx02MBW7es';
var COURSES_SHEET = 'TrainingDetails';
var BOOKINGS_SHEET = 'Bookings';
/** Only list/book rows whose type matches (case-insensitive). */
var COURSE_TYPE_FILTER = 'Fundamentals';
var PROP_SS_ID = 'FUNDAMENTALS_SS_ID';
var PROP_GROUP_FORM_URL = 'FUNDAMENTALS_GROUP_FORM_URL';
var PROP_STRIPE_SECRET = 'STRIPE_SECRET_KEY';
var PROP_STRIPE_CURRENCY = 'STRIPE_CURRENCY';

/** Unit price EUR by SKU substring match — VAT-inclusive list prices */
var PRICE_HALF_EUR = 125;
var PRICE_FULL_EUR = 210;
var VAT_RATE = 0.23;

var SKU_OPTIONS = [
  'Half-day — €125 / seat (Modules 1–2)',
  'Full-day — €210 / seat (Modules 1–4)'
];

var GEMINI_ACCESS_OPTIONS = [
  'Free Gemini',
  'Google Workspace Business / Enterprise (or equivalent)',
  'Not sure'
];

var GEMINI_EXPERIENCE_OPTIONS = [
  'Never used Gemini',
  'Tried a few times',
  'Use regularly',
  'Power user'
];

var HEAR_ABOUT_OPTIONS = [
  'LinkedIn',
  'Limerick Chamber / Skillnet',
  'Google search',
  'Referral',
  'Main website',
  'Other'
];

/**
 * Run once. Binds to EXISTING_SS_ID (or creates a workbook), seeds Courses/Bookings,
 * creates the group form. Then Deploy → Web app for individual booking.
 *
 * Safe to re-run on the shared workbook: Courses/Bookings are rebuilt from sample data.
 * Creates a NEW group form each run — skip createGroupForm_ if you already have one.
 */
function setupFundamentalsBooking() {
  var ss = EXISTING_SS_ID
    ? SpreadsheetApp.openById(EXISTING_SS_ID)
    : SpreadsheetApp.create(WORKBOOK_TITLE);

  setupCoursesSheet_(ss);
  setupBookingsSheet_(ss);
  var group = createGroupForm_(ss.getId());

  PropertiesService.getScriptProperties().setProperty(PROP_SS_ID, ss.getId());
  PropertiesService.getScriptProperties().setProperty(PROP_GROUP_FORM_URL, group.publishedUrl);

  var summary = [
    '=== Fundamentals booking setup complete ===',
    '',
    'Spreadsheet:',
    ss.getUrl(),
    'Spreadsheet ID: ' + ss.getId(),
    '',
    'Group form (enquiry — negotiate date with client):',
    group.publishedUrl,
    'Edit form: ' + group.editUrl,
    '',
    'Next:',
    '1. Deploy this project as a Web app (Anyone).',
    '2. Paste into js/site-config.js:',
    '',
    'fundamentalsFormUrls: {',
    "    individual: 'WEB_APP_URL_HERE',",
    "    group:      '" + group.publishedUrl + "',",
    '},',
    '',
    '3. Add/edit rows on the TrainingDetails sheet for each dated session.',
    '   Only rows with active=TRUE, date >= today, and booked_count < total_places appear for booking.',
    ''
  ].join('\n');

  Logger.log(summary);
  return summary;
}

/**
 * Bind script properties to the shared workbook without recreating sheets or forms.
 * Use after pasting Code.gs if Courses/Bookings already look correct.
 */
function bindExistingSpreadsheetOnly() {
  if (!EXISTING_SS_ID) {
    throw new Error('Set EXISTING_SS_ID first.');
  }
  var ss = SpreadsheetApp.openById(EXISTING_SS_ID);
  PropertiesService.getScriptProperties().setProperty(PROP_SS_ID, ss.getId());
  Logger.log('Bound to ' + ss.getUrl());
  return ss.getId();
}

/** Web App — individual booking UI */
function doGet(e) {
  // Inject Stripe return params — GAS iframes often hide window.location.search
  var params = {
    paid: (e && e.parameter && e.parameter.paid) || '',
    sessionId: (e && e.parameter && e.parameter.session_id) || '',
    cancelled: (e && e.parameter && e.parameter.cancelled) || ''
  };
  var html = HtmlService.createHtmlOutputFromFile('IndividualBooking').getContent();
  html = html.replace(
    '/*__RETURN_PARAMS__*/',
    'window.__RETURN__ = ' + JSON.stringify(params) + ';'
  );
  return HtmlService.createHtmlOutput(html)
    .setTitle('Book Fundamentals of AI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called from IndividualBooking.html — Fundamentals rows only */
function listAvailableCourses() {
  var sheet = coursesSheet_();
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  var col = courseColumns_(rows[0]);
  var today = startOfToday_();
  var out = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var courseId = String(cell_(r, col.course_id) || '').trim();
    if (!courseId) continue;

    var type = String(cell_(r, col.type) || '').trim();
    if (!typeMatchesFilter_(type, col.type >= 0)) continue;

    var name = String(cell_(r, col.name) || '');
    var dateVal = cell_(r, col.date);
    var place = String(cell_(r, col.place) || '');
    var total = Number(cell_(r, col.total_places)) || 0;
    var booked = Number(cell_(r, col.booked_count)) || 0;
    var activeVal = cell_(r, col.active);
    var active = activeVal === true || String(activeVal).toUpperCase() === 'TRUE';
    var sku = String(cell_(r, col.sku) || '');

    var dateObj = asDate_(dateVal);
    if (!active || !dateObj || dateObj < today) continue;
    var remaining = total - booked;
    if (remaining <= 0) continue;

    out.push({
      courseId: courseId,
      name: name,
      date: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      dateLabel: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'EEE dd MMM yyyy'),
      place: place,
      totalPlaces: total,
      bookedCount: booked,
      remaining: remaining,
      sku: sku,
      type: type || COURSE_TYPE_FILTER,
      unitPriceEur: unitPriceEurFromSku_(sku)
    });
  }

  // Latest course date first
  out.sort(function (a, b) {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return a.name.localeCompare(b.name);
  });
  return out;
}

/**
 * Book seats on a course (no payment). Kept for admin/testing; UI uses Stripe flow.
 * Returns { ok: true } or { ok: false, error: '...' }.
 */
function bookIndividual(payload) {
  try {
    var validated = validateBookingPayload_(payload);
    if (!validated.ok) return validated;

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
      var course = findCourseRow_(validated.courseId);
      if (!course.ok) return course;

      var capacity = assertCourseCapacity_(course, validated.seats);
      if (!capacity.ok) return capacity;

      coursesSheet_().getRange(course.rowIndex, course.bookedCountCol).setValue(course.booked + validated.seats);

      appendBookingRow_({
        courseId: validated.courseId,
        courseName: course.name,
        dateObj: course.dateObj,
        place: course.place,
        sku: course.sku,
        seats: validated.seats,
        fullName: validated.fullName,
        email: validated.email,
        phone: String(payload.phone || ''),
        company: String(payload.company || ''),
        geminiAccess: String(payload.geminiAccess || ''),
        geminiExperience: String(payload.geminiExperience || ''),
        attendeeNames: String(payload.attendeeNames || ''),
        hearAbout: String(payload.hearAbout || ''),
        notes: String(payload.notes || ''),
        bookingType: 'individual',
        paymentStatus: 'unpaid',
        stripeSessionId: '',
        amountEur: unitPriceEurFromSku_(course.sku) * validated.seats
      });

      return {
        ok: true,
        message: 'Booking recorded for ' + validated.seats + ' seat(s) on ' +
          Utilities.formatDate(course.dateObj, Session.getScriptTimeZone(), 'd MMM yyyy') + '.'
      };
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/**
 * Step 2 — create Stripe Checkout Session. Does NOT reserve seats.
 * Returns { ok: true, checkoutUrl } or { ok: false, error }.
 */
function createCheckoutSession(payload) {
  try {
    var validated = validateBookingPayload_(payload);
    if (!validated.ok) return validated;

    var course = findCourseRow_(validated.courseId);
    if (!course.ok) return course;

    var capacity = assertCourseCapacity_(course, validated.seats);
    if (!capacity.ok) return capacity;

    var unitEur = unitPriceEurFromSku_(course.sku);
    if (!unitEur) {
      return { ok: false, error: 'Could not determine price for this course SKU.' };
    }

    var secret = stripeSecret_();
    var currency = (PropertiesService.getScriptProperties().getProperty(PROP_STRIPE_CURRENCY) || 'eur').toLowerCase();
    var webAppUrl = ScriptApp.getService().getUrl();
    if (!webAppUrl) {
      return { ok: false, error: 'Web App URL unavailable — redeploy the Web App and try again.' };
    }

    var productName = (course.name || 'Fundamentals of AI') + ' — ' +
      Utilities.formatDate(course.dateObj, Session.getScriptTimeZone(), 'd MMM yyyy');

    var meta = {
      courseId: validated.courseId,
      seats: String(validated.seats),
      fullName: truncateMeta_(validated.fullName),
      email: truncateMeta_(validated.email),
      phone: truncateMeta_(String(payload.phone || '')),
      company: truncateMeta_(String(payload.company || '')),
      geminiAccess: truncateMeta_(String(payload.geminiAccess || '')),
      geminiExperience: truncateMeta_(String(payload.geminiExperience || '')),
      attendeeNames: truncateMeta_(String(payload.attendeeNames || '')),
      hearAbout: truncateMeta_(String(payload.hearAbout || '')),
      notes: truncateMeta_(String(payload.notes || '')),
      unitPriceEur: String(unitEur)
    };

    var form = {
      mode: 'payment',
      success_url: webAppUrl + '?paid=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: webAppUrl + '?cancelled=1',
      customer_email: validated.email,
      'line_items[0][quantity]': String(validated.seats),
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][unit_amount]': String(unitEur * 100),
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][price_data][product_data][description]': course.place +
        (course.sku ? ' · ' + course.sku : '')
    };

    Object.keys(meta).forEach(function (k) {
      form['metadata[' + k + ']'] = meta[k];
    });

    var session = stripeRequest_('post', 'https://api.stripe.com/v1/checkout/sessions', form, secret);
    if (!session || !session.url) {
      return { ok: false, error: 'Stripe did not return a checkout URL.' };
    }

    return {
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      amountEur: unitEur * validated.seats
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/**
 * After Stripe redirect — verify payment and record booking + seat count.
 * Idempotent on stripe_session_id.
 */
function confirmPaidBooking(sessionId) {
  try {
    sessionId = String(sessionId || '').trim();
    if (!sessionId) return { ok: false, error: 'Missing payment session.' };

    var secret = stripeSecret_();
    var session = fetchCheckoutSession_(sessionId, secret);
    var receiptUrl = receiptUrlFromSession_(session, secret);

    var existing = findBookingByStripeSession_(sessionId);
    if (existing) {
      return successPayload_(existing, true, receiptUrl, sessionId);
    }

    if (!session || session.payment_status !== 'paid') {
      return { ok: false, error: 'Payment not completed yet. If you were charged, contact info@bespoke-ai.ie.' };
    }

    var meta = session.metadata || {};
    var courseId = String(meta.courseId || '').trim();
    var seats = Number(meta.seats) || 0;
    var fullName = String(meta.fullName || '').trim();
    var email = String(meta.email || session.customer_email || '').trim();

    if (!courseId || seats < 1 || !fullName || !email) {
      return { ok: false, error: 'Payment succeeded but booking details were incomplete. Contact info@bespoke-ai.ie with your receipt.' };
    }

    var amountEur = session.amount_total != null
      ? Number(session.amount_total) / 100
      : (Number(meta.unitPriceEur) || 0) * seats;

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
      // Re-check idempotency under lock
      var again = findBookingByStripeSession_(sessionId);
      if (again) {
        return successPayload_(again, true, receiptUrl, sessionId);
      }

      var course = findCourseRow_(courseId);
      if (!course.ok) {
        return { ok: false, error: 'Payment received but course was not found. Contact info@bespoke-ai.ie.' };
      }

      var capacity = assertCourseCapacity_(course, seats);
      if (!capacity.ok) {
        return {
          ok: false,
          error: 'Payment received but seats are no longer available. Contact info@bespoke-ai.ie for a refund or transfer.'
        };
      }

      coursesSheet_().getRange(course.rowIndex, course.bookedCountCol).setValue(course.booked + seats);

      appendBookingRow_({
        courseId: courseId,
        courseName: course.name,
        dateObj: course.dateObj,
        place: course.place,
        sku: course.sku,
        seats: seats,
        fullName: fullName,
        email: email,
        phone: String(meta.phone || ''),
        company: String(meta.company || ''),
        geminiAccess: String(meta.geminiAccess || ''),
        geminiExperience: String(meta.geminiExperience || ''),
        attendeeNames: String(meta.attendeeNames || ''),
        hearAbout: String(meta.hearAbout || ''),
        notes: String(meta.notes || ''),
        bookingType: 'individual',
        paymentStatus: 'paid',
        stripeSessionId: sessionId,
        amountEur: amountEur
      });

      var dateLabel = Utilities.formatDate(course.dateObj, Session.getScriptTimeZone(), 'EEE dd MMM yyyy');
      return {
        ok: true,
        alreadyRecorded: false,
        message: 'Your place is booked for ' + email + '. Download your paid invoice below.',
        receiptUrl: receiptUrl || '',
        sessionId: sessionId,
        booking: {
          courseName: course.name,
          dateLabel: dateLabel,
          place: course.place,
          seats: seats,
          fullName: fullName,
          email: email,
          amountEur: amountEur,
          company: String(meta.company || ''),
          sku: course.sku || ''
        }
      };
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/** Build confirmation payload from a Bookings sheet row (array) or booking object. */
function successPayload_(rowOrObj, alreadyRecorded, receiptUrl, sessionId) {
  var b = bookingFromRow_(rowOrObj);
  return {
    ok: true,
    alreadyRecorded: !!alreadyRecorded,
    message: 'Your place is booked' +
      (b.email ? ' for ' + b.email : '') +
      '. Download your paid invoice below.',
    receiptUrl: receiptUrl || '',
    sessionId: sessionId || '',
    booking: b
  };
}

/**
 * Called from IndividualBooking.html — returns a paid invoice PDF as base64.
 * { ok, filename, base64 } or { ok:false, error }
 */
function getBookingReceiptPdf(sessionId) {
  try {
    sessionId = String(sessionId || '').trim();
    if (!sessionId) return { ok: false, error: 'Missing payment session.' };

    var data = receiptDataForSession_(sessionId);
    if (!data.ok) return data;

    var html = buildReceiptHtml_(data);
    var blob = HtmlService.createHtmlOutput(html)
      .getAs(MimeType.PDF)
      .setName(data.filename);

    return {
      ok: true,
      filename: data.filename,
      base64: Utilities.base64Encode(blob.getBytes())
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function receiptFilename_(courseName) {
  var name = String(courseName || 'Training')
    .replace(/[—–]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return 'Bespoke-AI-receipt-' + name + '.pdf';
}

function receiptDataForSession_(sessionId) {
  var row = findBookingByStripeSession_(sessionId);
  var booking = row ? bookingFromRow_(row) : null;
  var paidAt = '';
  var amountEur = booking && booking.amountEur != null ? booking.amountEur : null;

  try {
    var secret = stripeSecret_();
    var session = fetchCheckoutSession_(sessionId, secret);
    if (session && session.payment_status === 'paid') {
      if (session.created) {
        paidAt = Utilities.formatDate(
          new Date(Number(session.created) * 1000),
          Session.getScriptTimeZone(),
          'd MMM yyyy HH:mm'
        );
      }
      if (amountEur == null && session.amount_total != null) {
        amountEur = Number(session.amount_total) / 100;
      }
      if (!booking) {
        var meta = session.metadata || {};
        var course = findCourseRow_(String(meta.courseId || '').trim());
        booking = {
          courseName: (course && course.ok && course.name) || String(meta.courseId || 'Training'),
          dateLabel: (course && course.ok && course.dateObj)
            ? Utilities.formatDate(course.dateObj, Session.getScriptTimeZone(), 'EEE dd MMM yyyy')
            : '',
          place: (course && course.ok && course.place) || '',
          seats: Number(meta.seats) || 1,
          fullName: String(meta.fullName || ''),
          email: String(meta.email || session.customer_email || ''),
          company: String(meta.company || ''),
          sku: (course && course.ok && course.sku) || '',
          amountEur: amountEur
        };
      }
    }
  } catch (e) {
    // Fall through with sheet data if Stripe lookup fails
  }

  if (!booking || !booking.email) {
    return { ok: false, error: 'Could not find booking details for this payment.' };
  }
  if (amountEur != null) booking.amountEur = amountEur;

  var shortId = sessionId.replace(/^cs_(test_|live_)?/, '').substring(0, 10).toUpperCase();
  var invoiceNo = 'INV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') +
    '-' + shortId;

  return {
    ok: true,
    invoiceNo: invoiceNo,
    filename: receiptFilename_(booking.courseName),
    paidAt: paidAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMM yyyy HH:mm'),
    sessionId: sessionId,
    booking: booking
  };
}

function buildReceiptHtml_(data) {
  var b = data.booking || {};
  var gross = b.amountEur != null ? Number(b.amountEur) : null;
  var net = gross != null ? gross / (1 + VAT_RATE) : null;
  var vat = gross != null && net != null ? gross - net : null;

  function euroAmt(n) {
    if (n == null || isNaN(n)) return '—';
    return '€' + Number(n).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var unitLine = '';
  if (b.seats && gross != null && Number(b.seats) > 0) {
    var unit = gross / Number(b.seats);
    unitLine = Number(b.seats) + ' × ' + euroAmt(unit) + ' (inc. VAT)';
  }

  var logo = (typeof RECEIPT_LOGO_DATA_URI !== 'undefined' && RECEIPT_LOGO_DATA_URI)
    ? '<img class="logo" src="' + RECEIPT_LOGO_DATA_URI + '" alt="Bespoke AI">'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Helvetica,Arial,sans-serif;color:#152238;font-size:11pt;line-height:1.45;margin:36px;position:relative;}' +
    '.watermark{' +
    'position:fixed;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);' +
    'font-size:92pt;font-weight:800;letter-spacing:0.12em;color:rgba(16,185,129,0.16);' +
    'border:10px solid rgba(16,185,129,0.18);padding:12px 36px;border-radius:12px;' +
    'z-index:0;pointer-events:none;white-space:nowrap;' +
    '}' +
    '.content{position:relative;z-index:1;}' +
    '.header{width:100%;border-collapse:collapse;margin:0 0 18px;}' +
    '.header td{vertical-align:middle;padding:0;border:0;}' +
    '.logo{height:48px;width:auto;display:block;}' +
    '.company{text-align:right;font-size:9pt;line-height:1.4;color:#152238;}' +
    '.company strong{font-size:9.5pt;}' +
    'h1{font-size:16pt;margin:0 0 4px;}' +
    '.muted{color:#5a6b7d;font-size:9.5pt;}' +
    '.meta-right{text-align:right;color:#5a6b7d;font-size:9.5pt;margin:0 0 4px;}' +
    'table.lines{width:100%;border-collapse:collapse;margin-top:8px;}' +
    'table.lines th,table.lines td{text-align:left;padding:8px 0;border-bottom:1px solid #e8edf3;vertical-align:top;}' +
    'table.lines th{color:#5a6b7d;font-weight:600;width:34%;}' +
    '.total{font-size:13pt;font-weight:700;}' +
    '.footer{' +
    'margin-top:36px;padding:14px 16px;border-top:2px solid #152238;' +
    'background:#f4f7fa;border-radius:0 0 6px 6px;' +
    '}' +
    '.footer-table{width:100%;border-collapse:collapse;}' +
    '.footer-table td{border:0;padding:3px 0;vertical-align:top;font-size:9pt;color:#5a6b7d;}' +
    '.footer-table .label{width:28%;color:#94a8bc;font-weight:600;text-transform:uppercase;' +
    'letter-spacing:0.04em;font-size:8pt;}' +
    '.footer-table .value{color:#152238;}' +
    '.footer-note{margin:0 0 10px;font-size:9pt;color:#5a6b7d;}' +
    '</style></head><body>' +
    '<div class="watermark">PAID</div>' +
    '<div class="content">' +
    '<table class="header"><tr>' +
    '<td style="width:42%;">' + logo + '</td>' +
    '<td class="company">' +
    '<strong>' + esc_(LEGAL_NAME) + '</strong><br>' +
    esc_(COMPANY_ADDRESS) + '<br>' +
    'VAT: ' + esc_(COMPANY_VAT) + '<br>' +
    esc_(COMPANY_EMAIL) +
    '</td></tr></table>' +
    '<h1>Invoice</h1>' +
    '<p class="meta-right">Invoice ' + esc_(data.invoiceNo) + '</p>' +
    '<p class="meta-right">' + esc_(data.paidAt) + '</p>' +
    '<p><strong>Bill to</strong><br>' +
    esc_(b.fullName || '') +
    (b.company ? '<br>' + esc_(b.company) : '') +
    (b.email ? '<br>' + esc_(b.email) : '') +
    '</p>' +
    '<table class="lines">' +
    '<tr><th>Description</th><td>' + esc_(b.courseName || 'Training') +
    (b.sku ? '<br><span class="muted">' + esc_(b.sku) + '</span>' : '') +
    '</td></tr>' +
    (b.dateLabel ? '<tr><th>Course date</th><td>' + esc_(b.dateLabel) + '</td></tr>' : '') +
    (b.place ? '<tr><th>Venue</th><td>' + esc_(b.place) + '</td></tr>' : '') +
    (unitLine ? '<tr><th>Seats</th><td>' + esc_(unitLine) + '</td></tr>' : '') +
    '<tr><th>Net (ex VAT)</th><td>' + esc_(euroAmt(net)) + '</td></tr>' +
    '<tr><th>VAT @ 23%</th><td>' + esc_(euroAmt(vat)) + '</td></tr>' +
    '<tr><th>Total paid (inc. VAT)</th><td class="total">' + esc_(euroAmt(gross)) + '</td></tr>' +
    '<tr><th>Payment</th><td>Card via Stripe — paid in full</td></tr>' +
    '</table>' +
    '<div class="footer">' +
    '<p class="footer-note">Listed prices include VAT at 23%.</p>' +
    '<table class="footer-table">' +
    '<tr><td class="label">Payment reference</td><td class="value">' + esc_(data.sessionId || '') + '</td></tr>' +
    '</table>' +
    '</div>' +
    '</div></body></html>';
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Checkout session with charge expanded (for receipt_url). */
function fetchCheckoutSession_(sessionId, secret) {
  return stripeRequest_(
    'get',
    'https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId) +
      '?expand[]=payment_intent.latest_charge',
    null,
    secret
  );
}

/** Hosted Stripe receipt page (print / save as PDF from the browser). */
function receiptUrlFromSession_(session, secret) {
  if (!session) return '';
  var pi = session.payment_intent;
  if (!pi) return '';

  if (typeof pi === 'string') {
    try {
      pi = stripeRequest_(
        'get',
        'https://api.stripe.com/v1/payment_intents/' + encodeURIComponent(pi) +
          '?expand[]=latest_charge',
        null,
        secret
      );
    } catch (e) {
      return '';
    }
  }

  var charge = pi && pi.latest_charge;
  if (!charge) return '';
  if (typeof charge === 'object' && charge.receipt_url) return String(charge.receipt_url);
  if (typeof charge === 'string') {
    try {
      var ch = stripeRequest_(
        'get',
        'https://api.stripe.com/v1/charges/' + encodeURIComponent(charge),
        null,
        secret
      );
      return (ch && ch.receipt_url) ? String(ch.receipt_url) : '';
    } catch (e2) {
      return '';
    }
  }
  return '';
}

function bookingFromRow_(row) {
  if (!row) return {};
  if (!Array.isArray(row) && typeof row === 'object') return row;

  // Expected Bookings columns (see setupBookingsSheet_)
  var dateVal = row[3];
  var dateObj = asDate_(dateVal);
  return {
    courseName: String(row[2] || ''),
    dateLabel: dateObj
      ? Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'EEE dd MMM yyyy')
      : String(dateVal || ''),
    place: String(row[4] || ''),
    sku: String(row[5] || ''),
    seats: Number(row[6]) || 0,
    fullName: String(row[7] || ''),
    email: String(row[8] || ''),
    company: String(row[10] || ''),
    amountEur: row[19] != null && row[19] !== '' ? Number(row[19]) : null
  };
}

function getGroupFormUrl() {
  return PropertiesService.getScriptProperties().getProperty(PROP_GROUP_FORM_URL) || '';
}

function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (e) {
    return '';
  }
}

/**
 * One-time: add payment columns to an existing Bookings sheet without wiping rows.
 * Run from the Apps Script editor if Bookings predates the Stripe wizard.
 */
function ensureBookingsPaymentColumns() {
  var sh = bookingsSheet_();
  var lastCol = sh.getLastColumn();
  var headers = lastCol > 0
    ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
        return String(h || '').trim().toLowerCase();
      })
    : [];

  var needed = ['payment_status', 'stripe_session_id', 'amount_eur'];
  var missing = needed.filter(function (h) { return headers.indexOf(h) === -1; });
  if (!missing.length) {
    Logger.log('Bookings already has payment columns.');
    return 'ok';
  }

  var start = Math.max(lastCol, 0) + 1;
  sh.getRange(1, start, 1, start + missing.length - 1).setValues([missing]);
  Logger.log('Added columns: ' + missing.join(', '));
  return missing.join(', ');
}

// --- Sheet setup ---

/** Recreate a plain sheet so Google "Table" typed columns cannot block writes. */
function ensurePlainSheet_(ss, name) {
  var existing = ss.getSheetByName(name);
  if (existing) {
    if (ss.getSheets().length === 1) {
      // Cannot delete the last sheet — insert a temp, delete old, rename.
      var tmp = ss.insertSheet('_tmp_setup_');
      ss.deleteSheet(existing);
      tmp.setName(name);
      return tmp;
    }
    ss.deleteSheet(existing);
  }
  return ss.insertSheet(name);
}

function setupCoursesSheet_(ss) {
  var sh = ensurePlainSheet_(ss, COURSES_SHEET);
  var rows = [
    [
      'course_id',
      'name',
      'date',
      'place',
      'total_places',
      'booked_count',
      'active',
      'sku',
      'type'
    ],
    // Sample rows — edit/delete; add real sessions before going live
    [
      'FUND-2026-0914-HALF',
      'Fundamentals of AI — Half-day',
      '2026-09-14',
      'Limerick Chamber Reading Room',
      12,
      0,
      true,
      'Half-day — €125 / seat (Modules 1–2)',
      'Fundamentals'
    ],
    [
      'FUND-2026-0914-FULL',
      'Fundamentals of AI — Full-day',
      '2026-09-14',
      'Limerick Chamber Reading Room',
      12,
      0,
      true,
      'Full-day — €210 / seat (Modules 1–4)',
      'Fundamentals'
    ],
    [
      'FUND-2026-1005-HALF',
      'Fundamentals of AI — Half-day',
      '2026-10-05',
      'Limerick Chamber Reading Room',
      12,
      0,
      true,
      'Half-day — €125 / seat (Modules 1–2)',
      'Fundamentals'
    ]
  ];
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  try {
    sh.setFrozenRows(1);
  } catch (e) {
    // ignore — typed/table sheets can block freeze
  }
  try {
    sh.autoResizeColumns(1, 9);
  } catch (e) {
    // ignore
  }
}

function setupBookingsSheet_(ss) {
  var sh = ensurePlainSheet_(ss, BOOKINGS_SHEET);
  var header = [
    'timestamp',
    'course_id',
    'course_name',
    'course_date',
    'place',
    'sku',
    'seats',
    'full_name',
    'email',
    'phone',
    'company',
    'gemini_access',
    'gemini_experience',
    'attendee_names',
    'hear_about',
    'notes',
    'booking_type',
    'payment_status',
    'stripe_session_id',
    'amount_eur'
  ];
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  try {
    sh.setFrozenRows(1);
  } catch (e) {
    // ignore
  }
}

function createGroupForm_(spreadsheetId) {
  var form = FormApp.create(BRAND + ' — Fundamentals of AI: Book group');
  form.setDescription(
    'Request a private Fundamentals of AI cohort for your team (in-person). ' +
    'Per seat at launch: €125 half-day / €210 full-day (inc. VAT). Minimum 6 seats billed, maximum 12. ' +
    'Date and time are agreed with you after this enquiry — this form does not lock a public course date. ' +
    'Client site by default; Business / Enterprise (or equivalent) Gemini required for all attendees.'
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAcceptingResponses(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);
  form.setConfirmationMessage(
    'Thank you — your group enquiry has been received. ' +
    'We will reply by email to agree date, venue, and payment.'
  );

  form.addTextItem().setTitle('Contact full name').setRequired(true);
  form.addTextItem()
    .setTitle('Contact email')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  form.addTextItem().setTitle('Contact phone').setRequired(true);
  form.addTextItem().setTitle('Company / organisation').setRequired(true);

  addMultipleChoice_(form, 'Which course length?', SKU_OPTIONS, true);

  form.addTextItem()
    .setTitle('Number of attendees (seats)')
    .setHelpText('Billed headcount. Minimum 6, maximum 12 at launch pricing.')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireNumberBetween(6, 12).build());

  addMultipleChoice_(form, 'Can you provide Business / Enterprise (or equivalent) Gemini for every attendee before the date?', [
    'Yes — already enabled',
    'Yes — we will enable before the date',
    'Not sure — need advice',
    'No'
  ], true);

  addMultipleChoice_(form, 'Venue', [
    'Our site (we provide room, Wi‑Fi, screen)',
    'Prefer you to arrange a Limerick room (at cost / as agreed)',
    'Not sure yet'
  ], true);

  form.addParagraphTextItem()
    .setTitle('Preferred dates or timeframe')
    .setHelpText('We will confirm a date with you — e.g. mid-September, avoid Fridays.')
    .setRequired(true);

  form.addParagraphTextItem().setTitle('Anything else we should know?').setRequired(false);
  addDropdown_(form, 'How did you hear about us?', HEAR_ABOUT_OPTIONS, false);

  form.addCheckboxItem()
    .setTitle('Confirmations')
    .setChoiceValues([
      'I understand this is an enquiry — date is agreed after we reply',
      'I agree to be contacted about this booking (required for GDPR)'
    ])
    .setRequired(true);

  return {
    key: 'group',
    title: 'Fundamentals — Book group',
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    formId: form.getId()
  };
}

// --- helpers ---

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_SS_ID);
  if (!id) throw new Error('Run setupFundamentalsBooking first.');
  return SpreadsheetApp.openById(id);
}

function coursesSheet_() {
  return ss_().getSheetByName(COURSES_SHEET);
}

function bookingsSheet_() {
  return ss_().getSheetByName(BOOKINGS_SHEET);
}

function startOfToday_() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function asDate_(val) {
  if (!val) return null;
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val)) {
    var d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  var parsed = new Date(val);
  if (isNaN(parsed)) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function addMultipleChoice_(form, title, choices, required) {
  var item = form.addMultipleChoiceItem().setTitle(title);
  item.setChoices(choices.map(function (c) { return item.createChoice(c); }));
  item.setRequired(required);
  return item;
}

function addDropdown_(form, title, choices, required) {
  var item = form.addListItem().setTitle(title);
  item.setChoices(choices.map(function (c) { return item.createChoice(c); }));
  item.setRequired(required);
  return item;
}

function unitPriceEurFromSku_(sku) {
  var s = String(sku || '').toLowerCase();
  if (s.indexOf('full-day') !== -1 || s.indexOf('full day') !== -1) return PRICE_FULL_EUR;
  if (s.indexOf('half-day') !== -1 || s.indexOf('half day') !== -1) return PRICE_HALF_EUR;
  if (s.indexOf('210') !== -1) return PRICE_FULL_EUR;
  if (s.indexOf('125') !== -1) return PRICE_HALF_EUR;
  return 0;
}

function validateBookingPayload_(payload) {
  var courseId = String((payload && payload.courseId) || '').trim();
  var seats = Number((payload && payload.seats) || 0);
  var fullName = String((payload && payload.fullName) || '').trim();
  var email = String((payload && payload.email) || '').trim();

  if (!courseId) return { ok: false, error: 'Choose a course date.' };
  if (seats < 1) return { ok: false, error: 'Seats must be at least 1.' };
  if (!fullName) return { ok: false, error: 'Name is required.' };
  if (!email || email.indexOf('@') === -1) return { ok: false, error: 'Valid email is required.' };
  if (!payload || !payload.consent) return { ok: false, error: 'Please confirm the GDPR / booking terms.' };

  return {
    ok: true,
    courseId: courseId,
    seats: seats,
    fullName: fullName,
    email: email
  };
}

function findCourseRow_(courseId) {
  var sheet = coursesSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: false, error: 'That course was not found.' };

  var col = courseColumns_(data[0]);
  for (var i = 1; i < data.length; i++) {
    if (String(cell_(data[i], col.course_id) || '').trim() !== courseId) continue;

    var type = String(cell_(data[i], col.type) || '').trim();
    if (!typeMatchesFilter_(type, col.type >= 0)) {
      return { ok: false, error: 'That course is not available on this booking form.' };
    }

    var activeVal = cell_(data[i], col.active);
    return {
      ok: true,
      rowIndex: i + 1,
      bookedCountCol: col.booked_count + 1, // 1-based for getRange
      name: String(cell_(data[i], col.name) || ''),
      place: String(cell_(data[i], col.place) || ''),
      sku: String(cell_(data[i], col.sku) || ''),
      type: type || COURSE_TYPE_FILTER,
      dateObj: asDate_(cell_(data[i], col.date)),
      total: Number(cell_(data[i], col.total_places)) || 0,
      booked: Number(cell_(data[i], col.booked_count)) || 0,
      active: activeVal === true || String(activeVal).toUpperCase() === 'TRUE'
    };
  }
  return { ok: false, error: 'That course was not found.' };
}

function assertCourseCapacity_(course, seats) {
  if (!course.active) return { ok: false, error: 'That course is not open for booking.' };
  if (!course.dateObj || course.dateObj < startOfToday_()) {
    return { ok: false, error: 'That course date has passed.' };
  }
  var remaining = course.total - course.booked;
  if (seats > remaining) {
    return {
      ok: false,
      error: 'Only ' + remaining + ' seat(s) left on that date. Reduce seats or pick another course.'
    };
  }
  return { ok: true, remaining: remaining };
}

function courseColumns_(headerRow) {
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    map[String(headerRow[i] || '').trim().toLowerCase()] = i;
  }

  function req(name, fallback) {
    if (map[name] != null) return map[name];
    if (fallback != null) return fallback;
    throw new Error('TrainingDetails is missing a "' + name + '" column header.');
  }

  // Fallbacks match the original A–H layout if headers differ slightly
  return {
    course_id: req('course_id', 0),
    name: req('name', 1),
    date: req('date', 2),
    place: req('place', 3),
    total_places: req('total_places', 4),
    booked_count: req('booked_count', 5),
    active: req('active', 6),
    sku: req('sku', 7),
    type: map.type != null ? map.type : -1
  };
}

function cell_(row, index) {
  if (index == null || index < 0) return '';
  return row[index];
}

function typeMatchesFilter_(type, typeColPresent) {
  if (!typeColPresent) return true; // legacy sheet before type column
  return String(type || '').trim().toLowerCase() === String(COURSE_TYPE_FILTER).toLowerCase();
}

function appendBookingRow_(b) {
  bookingsSheet_().appendRow([
    new Date(),
    b.courseId,
    b.courseName,
    b.dateObj,
    b.place,
    b.sku,
    b.seats,
    b.fullName,
    b.email,
    b.phone,
    b.company,
    b.geminiAccess,
    b.geminiExperience,
    b.attendeeNames,
    b.hearAbout,
    b.notes,
    b.bookingType,
    b.paymentStatus || '',
    b.stripeSessionId || '',
    b.amountEur != null ? b.amountEur : ''
  ]);
}

function findBookingByStripeSession_(sessionId) {
  var sheet = bookingsSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0].map(function (h) { return String(h || '').toLowerCase().trim(); });
  var col = headers.indexOf('stripe_session_id');
  if (col === -1) {
    // Legacy sheet without column — scan last columns loosely
    col = 18; // expected 0-based index after adding columns
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col] || '').trim() === sessionId) return data[i];
  }
  return null;
}

function stripeSecret_() {
  var secret = PropertiesService.getScriptProperties().getProperty(PROP_STRIPE_SECRET);
  if (!secret) {
    throw new Error('Set Script property STRIPE_SECRET_KEY (Stripe secret key) first.');
  }
  return secret;
}

function truncateMeta_(val) {
  var s = String(val || '');
  return s.length > 450 ? s.substring(0, 450) : s;
}

function stripeRequest_(method, url, formFields, secret) {
  var options = {
    method: method,
    headers: {
      Authorization: 'Bearer ' + secret
    },
    muteHttpExceptions: true
  };

  if (formFields) {
    options.payload = formFields;
    options.contentType = 'application/x-www-form-urlencoded';
  }

  var res = UrlFetchApp.fetch(url, options);
  var code = res.getResponseCode();
  var body = res.getContentText();
  var parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    throw new Error('Stripe returned a non-JSON response (' + code + ').');
  }

  if (code < 200 || code >= 300) {
    var msg = (parsed.error && parsed.error.message) || body;
    throw new Error('Stripe error: ' + msg);
  }
  return parsed;
}
