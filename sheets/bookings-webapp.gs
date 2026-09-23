/* ------------------------------------------------------------------
   Paste this whole file into Extensions -> Apps Script in the "Devika
   website — Bookings" Google Sheet, replace SHARED_SECRET below with a
   random string (and put the same string in Vercel as
   BOOKINGS_SHEET_SECRET), then Deploy -> New deployment -> Web app,
   "Execute as: Me", "Who has access: Anyone". Copy the /exec URL it gives
   you into Vercel as BOOKINGS_SHEET_URL.

   The sheet needs one tab named "Bookings" with this header row in row 1:

   payment_id | reference_id | product_name | customer_name |
   customer_email | customer_phone | amount | paid_at | sessions_total |
   sessions_booked | status | calendly_event_uri | calendly_start_time |
   calendly_end_time | followup_sent | last_updated

   Column order does not matter as long as every header above is present
   somewhere in row 1 - this script looks columns up by name, the same
   way the rest of the site reads its sheets.
   ------------------------------------------------------------------ */

var SHARED_SECRET = 'REPLACE_ME_WITH_A_RANDOM_STRING';
var SHEET_NAME = 'Bookings';

var COLUMNS = [
  'payment_id', 'reference_id', 'product_name', 'customer_name',
  'customer_email', 'customer_phone', 'amount', 'paid_at', 'sessions_total',
  'sessions_booked', 'status', 'calendly_event_uri', 'calendly_start_time',
  'calendly_end_time', 'followup_sent', 'last_updated'
];

function sheet_() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!s) throw new Error('no sheet named ' + SHEET_NAME);
  return s;
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
