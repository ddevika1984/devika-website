/* ------------------------------------------------------------------
   Paste this whole file into Extensions -> Apps Script in the "Devika
   website — Bookings" Google Sheet, replace SHARED_SECRET below with a
   random string (and put the same string in Vercel as
   BOOKINGS_SHEET_SECRET), then Deploy -> New deployment -> Web app,
   "Execute as: Me", "Who has access: Anyone". Copy the /exec URL it gives
   you into Vercel as BOOKINGS_SHEET_URL.

   Before deploying, run setup() once (function dropdown -> setup -> Run)
   and accept Google's permission prompt. It creates the "Bookings" tab
   if there isn't one and writes this header row into row 1 itself:

   payment_id | reference_id | product_name | customer_name |
   customer_email | customer_phone | amount | paid_at | paid_through |
   sessions_total | sessions_booked | status | calendly_event_uri |
   calendly_start_time | calendly_end_time | followup_sent | last_updated |
   reminder_sent | lapse_notified

   Column order does not matter as long as every header above is present
   somewhere in row 1 - this script looks columns up by name, the same
   way the rest of the site reads its sheets.

   paid_through is blank for anything that is not a membership product
   (a one-off session has no "through" date). For the Meditation Club it
   is stamped by the webhook at payment time - see products.js - and is
   what checkMemberships below reads to decide who is due or lapsed.

   Meditation Club check: after pasting, run setupDailyCheck() once
   (function dropdown -> setupDailyCheck -> Run). It schedules
   checkMemberships() every morning, which emails NOTIFY_EMAIL a list of
   Monthly members whose month ends within REMIND_DAYS_BEFORE days, and
   of anyone whose membership has lapsed, each with a WhatsApp link that
   opens a ready-written reminder. Lapsed rows are also coloured red.
   Each person is emailed about once per payment, not every day.

   When updating an already-deployed copy of this script, copy the
   existing SHARED_SECRET value out first and put it back after pasting,
   then Deploy -> Manage deployments -> pencil -> Version: New version.
   A New deployment would change the /exec URL Vercel is pointing at.
   ------------------------------------------------------------------ */

var SHARED_SECRET = 'REPLACE_ME_WITH_A_RANDOM_STRING';
var SHEET_NAME = 'Bookings';
var LAPSED_COLOR = '#f4c7c3';

var NOTIFY_EMAIL = 'info@drddevikakamat.com';
var REMIND_DAYS_BEFORE = 3;
/* An auto-renew charge lands on the same date each month, which can be
   up to 31 days after the last one while paid_through is stamped at +30.
   Without a grace period a member would be reported lapsed for a day at
   the end of every long month. */
var LAPSE_GRACE_DAYS = 3;
var RENEW_URL = 'https://www.drdevikawellness.space/meditation-club';

var COLUMNS = [
  'payment_id', 'reference_id', 'product_name', 'customer_name',
  'customer_email', 'customer_phone', 'amount', 'paid_at', 'paid_through',
  'sessions_total', 'sessions_booked', 'status', 'calendly_event_uri',
  'calendly_start_time', 'calendly_end_time', 'followup_sent', 'last_updated',
  'reminder_sent', 'lapse_notified'
];

/* Creates the Bookings tab if it is missing and adds any header in COLUMNS
   that row 1 does not have yet, so nobody has to type seventeen headers by
   hand, and a header deleted by accident comes back instead of silently
   dropping that field from every row written after it. */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  var last = s.getLastColumn();
  var have = last ? s.getRange(1, 1, 1, last).getValues()[0].map(function (h) { return String(h).trim(); }) : [];
  var missing = COLUMNS.filter(function (c) { return have.indexOf(c) === -1; });
  if (missing.length) s.getRange(1, last + 1, 1, missing.length).setValues([missing]);
  return s;
}

/* Run this once from the Apps Script editor (pick "setup" in the function
   dropdown, then Run). It builds the tab and header row straight away, so
   there is something to see, and it is what triggers Google's permission
   prompt, which has to be accepted before the Web App can write anything. */
function setup() {
  sheet_();
}

function headerMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function (h, i) { map[String(h).trim()] = i; });
  return map;
}

function findRowByPaymentId_(sheet, map, paymentId) {
  if (!paymentId) return -1;
  if (sheet.getLastRow() < 2) return -1; // header row only, no data yet
  var col = map['payment_id'];
  var values = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(paymentId)) return i + 2; // sheet row number
  }
  return -1;
}

function findRowByEventUri_(sheet, map, uri) {
  if (!uri) return -1;
  if (sheet.getLastRow() < 2) return -1; // header row only, no data yet
  var col = map['calendly_event_uri'];
  var values = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(uri)) return i + 2;
  }
  return -1;
}

function rowToObject_(sheet, map, rowNum) {
  var values = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  var obj = {};
  COLUMNS.forEach(function (key) {
    var i = map[key];
    obj[key] = i === undefined ? '' : values[i];
  });
  return obj;
}

function writeFields_(sheet, map, rowNum, fields) {
  Object.keys(fields).forEach(function (key) {
    var i = map[key];
    if (i === undefined) return;
    sheet.getRange(rowNum, i + 1).setValue(fields[key]);
  });
  var lastUpdatedCol = map['last_updated'];
  if (lastUpdatedCol !== undefined) {
    sheet.getRange(rowNum, lastUpdatedCol + 1).setValue(new Date().toISOString());
  }
}

function appendRow_(sheet, map, fields) {
  var row = new Array(sheet.getLastColumn()).fill('');
  COLUMNS.forEach(function (key) {
    var i = map[key];
    if (i === undefined) return;
    row[i] = fields[key] !== undefined ? fields[key] : '';
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function upsertPayment_(body) {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var rowNum = findRowByPaymentId_(sheet, map, body.payment_id);
  var fields = {
    payment_id: body.payment_id,
    reference_id: body.reference_id,
    product_name: body.product_name,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    amount: body.amount,
    paid_at: body.paid_at,
    paid_through: body.paid_through || '',
    sessions_total: body.sessions_total,
    sessions_booked: 0,
    status: 'paid',
    followup_sent: false
  };
  if (rowNum === -1) {
    rowNum = appendRow_(sheet, map, fields);
  } else {
    writeFields_(sheet, map, rowNum, fields);
  }
  return rowToObject_(sheet, map, rowNum);
}

function recordBooking_(body) {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var rowNum = findRowByPaymentId_(sheet, map, body.payment_id);

  if (rowNum === -1 && body.customer_email && sheet.getLastRow() >= 2) {
    // fallback: match the most recent unbooked payment for this email
    var col = map['customer_email'];
    var values = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = values.length - 1; i >= 0; i--) {
      if (String(values[i][0]).toLowerCase() === String(body.customer_email).toLowerCase()) {
        rowNum = i + 2;
        break;
      }
    }
  }

  if (rowNum === -1) {
    // no matching payment row - record it anyway so nothing is lost
    rowNum = appendRow_(sheet, map, {
      payment_id: body.payment_id || '',
      customer_email: body.customer_email || '',
      sessions_total: 1,
      sessions_booked: 0,
      status: 'paid'
    });
  }

  var current = rowToObject_(sheet, map, rowNum);
  var sessionsBooked = (Number(current.sessions_booked) || 0) + 1;

  writeFields_(sheet, map, rowNum, {
    calendly_event_uri: body.calendly_event_uri,
    calendly_start_time: body.calendly_start_time,
    calendly_end_time: body.calendly_end_time,
    sessions_booked: sessionsBooked,
    status: 'booked',
    /* Cleared so the next session in a package can be nudged too. Without
       this, a package sends one follow-up ever and sessions 3 and 4 are
       never chased. */
    followup_sent: false
  });

  return rowToObject_(sheet, map, rowNum);
}

/* Every cancellation gives the session slot back, whoever cancelled, or a
   reschedule would count twice - Calendly reschedules arrive as a cancel
   followed by a fresh booking, and that booking increments the count.

   The Calendly times are cleared as well so the hourly follow-up job does
   not treat a cancelled session's end time as a session that happened and
   send a "book your next one" email on top of the reschedule email. */
function recordCancellation_(body) {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var rowNum = findRowByPaymentId_(sheet, map, body.payment_id);
  if (rowNum === -1) rowNum = findRowByEventUri_(sheet, map, body.calendly_event_uri);
  if (rowNum === -1) return {};

  var current = rowToObject_(sheet, map, rowNum);
  var sessionsBooked = Math.max((Number(current.sessions_booked) || 0) - 1, 0);

  writeFields_(sheet, map, rowNum, {
    sessions_booked: sessionsBooked,
    status: body.host_cancelled ? 'needs_reschedule' : 'cancelled',
    calendly_event_uri: '',
    calendly_start_time: '',
    calendly_end_time: ''
  });

  return rowToObject_(sheet, map, rowNum);
}

function markFollowupSent_(body) {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var rowNum = findRowByPaymentId_(sheet, map, body.payment_id);
  if (rowNum === -1) return {};

  writeFields_(sheet, map, rowNum, { followup_sent: true });
  return rowToObject_(sheet, map, rowNum);
}

function pendingFollowups_() {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var now = new Date();
  var out = [];
  for (var r = 2; r <= lastRow; r++) {
    var obj = rowToObject_(sheet, map, r);
    var sessionsTotal = Number(obj.sessions_total) || 1;
    var sessionsBooked = Number(obj.sessions_booked) || 0;
    var followupSent = obj.followup_sent === true || String(obj.followup_sent).toLowerCase() === 'true';
    var endTime = obj.calendly_end_time ? new Date(obj.calendly_end_time) : null;

    if (sessionsTotal > 1 && sessionsBooked < sessionsTotal && !followupSent && endTime && endTime < now) {
      out.push(obj);
    }
  }
  return out;
}

/* Runs every morning once setupDailyCheck() has been run (see the file
   header). Public, no trailing underscore, because Apps Script hides
   underscore functions from the Run menu and the Triggers screen.

   Looks at each member's most recent Meditation Club row, matched by
   email: every payment is a new row, including each monthly auto-renew
   charge, so earlier rows are just history. Then:
   - lapsed (paid_through + LAPSE_GRACE_DAYS has passed): row goes red,
     and they are listed once, flagged by lapse_notified;
   - a Monthly (one-time) member within REMIND_DAYS_BEFORE of the end of
     their month: listed once, flagged by reminder_sent. Auto-renew
     members are not reminded, since they renew by themselves; if their
     charge fails, no new row arrives and they show up as lapsed.
   A renewal creates a new, unflagged row, so the next cycle starts clean.
   Flags are only written after the email has gone, so a failed send is
   retried the next morning rather than lost. */
function checkMemberships() {
  var sheet = sheet_();
  var map = headerMap_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var latest = {};
  for (var r = 2; r <= lastRow; r++) {
    var obj = rowToObject_(sheet, map, r);
    if (String(obj.reference_id).indexOf('meditation-') !== 0) continue;
    var key = String(obj.customer_email).toLowerCase() || ('row-' + r);
    latest[key] = { row: r, obj: obj };
  }

  var now = new Date();
  var day = 24 * 60 * 60 * 1000;
  var dueSoon = [];
  var lapsed = [];
  Object.keys(latest).forEach(function (key) {
    var e = latest[key];
    var paidThrough = e.obj.paid_through ? new Date(e.obj.paid_through) : null;
    if (!paidThrough || isNaN(paidThrough.getTime())) return;
    var isLapsed = paidThrough.getTime() + LAPSE_GRACE_DAYS * day < now.getTime();
    sheet.getRange(e.row, 1, 1, sheet.getLastColumn()).setBackground(isLapsed ? LAPSED_COLOR : null);
    e.paidThrough = paidThrough;
    if (isLapsed) {
      if (!truthy_(e.obj.lapse_notified)) lapsed.push(e);
    } else if (e.obj.reference_id === 'meditation-monthly' &&
               paidThrough.getTime() - now.getTime() <= REMIND_DAYS_BEFORE * day &&
               !truthy_(e.obj.reminder_sent)) {
      dueSoon.push(e);
    }
  });

  if (!dueSoon.length && !lapsed.length) return;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Meditation Club: ' +
      (dueSoon.length ? dueSoon.length + ' due to renew' : '') +
      (dueSoon.length && lapsed.length ? ', ' : '') +
      (lapsed.length ? lapsed.length + ' lapsed' : ''),
    htmlBody: membershipEmail_(dueSoon, lapsed)
  });

  dueSoon.forEach(function (e) { writeFields_(sheet, map, e.row, { reminder_sent: true }); });
  lapsed.forEach(function (e) { writeFields_(sheet, map, e.row, { lapse_notified: true }); });
}

/* Run once from the editor. Replaces any earlier schedule for the
   membership check, so running it twice does not send two emails. */
function setupDailyCheck() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'checkMemberships' || fn === 'flagLapsedMembers_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkMemberships').timeBased().everyDays(1).atHour(9).create();
  sheet_();
}

/* Kept so an older trigger pointing at the previous name still works. */
function flagLapsedMembers_() {
  checkMemberships();
}

function truthy_(v) {
  return v === true || String(v).toLowerCase() === 'true';
}

function membershipEmail_(dueSoon, lapsed) {
  function fmt(d) {
    return Utilities.formatDate(d, 'Asia/Kolkata', 'd MMM yyyy');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function rows(list, message) {
    return list.map(function (e) {
      var o = e.obj;
      var phone = String(o.customer_phone || '').replace(/\D/g, '');
      var wa = phone
        ? '<a href="https://wa.me/' + phone + '?text=' + encodeURIComponent(message(e)) + '">Send WhatsApp reminder</a>'
        : 'No phone number';
      return '<tr>' +
        '<td style="padding:6px 12px 6px 0">' + esc(o.customer_email || '(no email)') + '</td>' +
        '<td style="padding:6px 12px 6px 0">' + esc(o.customer_phone || '') + '</td>' +
        '<td style="padding:6px 12px 6px 0">' + (o.reference_id === 'meditation-annual' ? 'Auto-renew' : 'Monthly') + '</td>' +
        '<td style="padding:6px 12px 6px 0">' + fmt(e.paidThrough) + '</td>' +
        '<td style="padding:6px 0">' + wa + '</td>' +
      '</tr>';
    }).join('');
  }
  function table(title, intro, list, message) {
    if (!list.length) return '';
    return '<h3 style="margin:24px 0 6px">' + title + '</h3><p style="margin:0 0 8px">' + intro + '</p>' +
      '<table style="border-collapse:collapse;font-size:14px">' +
      '<tr style="text-align:left"><th>Email</th><th>Phone</th><th>Plan</th><th>Paid until</th><th></th></tr>' +
      rows(list, message) + '</table>';
  }
  return '<div style="font-family:Arial,sans-serif;color:#2B2118">' +
    table('Due to renew', 'Monthly members whose month ends within ' + REMIND_DAYS_BEFORE + ' days.', dueSoon, function (e) {
      return 'Hi! A gentle reminder that your Meditation Club month ends on ' + fmt(e.paidThrough) +
        '. If you would like to keep sitting with us, you can renew here: ' + RENEW_URL;
    }) +
    table('Lapsed', 'Their membership has ended and no renewal has come in. Send a reminder, or remove them from the WhatsApp group.', lapsed, function (e) {
      return 'Hi! Your Meditation Club membership ended on ' + fmt(e.paidThrough) +
        '. We would love to have you back. You can rejoin here: ' + RENEW_URL;
    }) +
    '<p style="margin-top:24px;font-size:12px;color:#8A7A5E">Sent by your Bookings sheet. Lapsed rows are coloured red there.</p>' +
    '</div>';
}

/* Apps Script Web Apps cannot send a non-200 HTTP status from doGet/doPost
   - the response is always 200 at the transport level - so errors are
   signalled with an {error: "..."} body instead, and bookings-sheet.js on
   the Vercel side checks that field rather than the HTTP status. */
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.secret !== SHARED_SECRET) {
    return jsonOut_({ error: 'forbidden' });
  }

  switch (body.action) {
    case 'upsert_payment': return jsonOut_(upsertPayment_(body));
    case 'record_booking': return jsonOut_(recordBooking_(body));
    case 'record_cancellation': return jsonOut_(recordCancellation_(body));
    case 'mark_followup_sent': return jsonOut_(markFollowupSent_(body));
    default: return jsonOut_({ error: 'unknown action' });
  }
}

function doGet(e) {
  var params = e.parameter || {};
  if (params.secret !== SHARED_SECRET) {
    return jsonOut_({ error: 'forbidden' });
  }
  if (params.action === 'pending_followups') {
    return jsonOut_({ rows: pendingFollowups_() });
  }
  return jsonOut_({ error: 'unknown action' });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
