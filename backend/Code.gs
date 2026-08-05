/**
 * Editorial Invitation V3 — Google Sheets RSVP backend
 *
 * Attach this script to a Google Sheet, run setupResponsesSheet() once,
 * then deploy it as a Web App with access granted to anyone.
 */

const SHEET_NAME = 'Responses';
const HEADERS = [
  'Invitation ID',
  'Guest Name',
  'Attendance',
  'Guest Count',
  'Message',
  'RSVP Time',
  'Language',
  'Device',
  'Page URL',
  'Server Updated At'
];

function setupResponsesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const payload = parsePayload_(e);
    validatePayload_(payload);

    const sheet = getResponsesSheet_();
    const row = [
      clean_(payload.invitationId, 100),
      clean_(payload.guestName, 150),
      clean_(payload.attendance, 50),
      clean_(payload.guestCount, 10),
      clean_(payload.message, 500),
      clean_(payload.rsvpTime, 50),
      clean_(payload.language, 30),
      clean_(payload.device, 30),
      clean_(payload.pageUrl, 1000),
      new Date()
    ];

    const existingRow = findInvitationRow_(sheet, row[0]);

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json_({ ok: true, updated: Boolean(existingRow) });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health');

    if (action === 'guestbook') {
      return getGuestbook_(e);
    }

    if (action === 'rsvp') {
      return getRsvp_(e);
    }

    if (action === 'randomWish') {
      return getRandomWish_();
    }

    return json_({
      ok: true,
      service: 'Editorial Invitation V3 RSVP',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function getRsvp_(e) {
  const invitationId = clean_(e && e.parameter && e.parameter.id, 100);
  if (!invitationId) throw new Error('Invitation ID is required.');
  const sheet = getResponsesSheet_();
  const rowNumber = findInvitationRow_(sheet, invitationId);
  if (!rowNumber) return json_({ ok: true, found: false });
  const row = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  return json_({ ok:true, found:true, response:{ invitationId:String(row[0]||''), guestName:String(row[1]||''), attendance:String(row[2]||''), guestCount:String(row[3]||'1'), message:String(row[4]||''), rsvpTime:row[5] instanceof Date ? row[5].toISOString() : String(row[5]||''), language:String(row[6]||''), device:String(row[7]||''), pageUrl:String(row[8]||'') } });
}

function getGuestbook_(e) {
  const sheet = getResponsesSheet_();
  const lastRow = sheet.getLastRow();
  const requestedPage = Number((e && e.parameter && e.parameter.page) || 1);
  const requestedPageSize = Number((e && e.parameter && e.parameter.pageSize) || 24);
  const pageSize = Math.max(1, Math.min(48, Math.floor(requestedPageSize) || 24));
  const search = clean_(e && e.parameter && e.parameter.search, 80).toLowerCase();

  if (lastRow < 2) {
    return json_({ ok: true, messages: [], page: 1, pageSize, total: 0, totalPages: 1 });
  }

  // Read only the name-through-message columns, then keep rows with a public wish.
  const values = sheet.getRange(2, 2, lastRow - 1, 4).getValues();
  const allMessages = values
    .filter(row => String(row[3] || '').trim())
    .map(row => ({
      guestName: String(row[0] || 'Guest'),
      message: String(row[3] || '')
    }))
    .filter(item => !search || `${item.guestName} ${item.message}`.toLowerCase().includes(search))
    .reverse();

  const total = allMessages.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, Math.floor(requestedPage) || 1));
  const start = (page - 1) * pageSize;
  const messages = allMessages.slice(start, start + pageSize);

  return json_({ ok: true, messages, page, pageSize, total, totalPages });
}


function getRandomWish_() {
  const sheet = getResponsesSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ ok: true, message: null });

  const values = sheet.getRange(2, 2, lastRow - 1, 4).getValues();
  const messages = values
    .filter(row => String(row[3] || '').trim())
    .map(row => ({
      guestName: String(row[0] || 'Guest'),
      message: String(row[3] || '')
    }));

  if (!messages.length) return json_({ ok: true, message: null });
  return json_({ ok: true, message: messages[Math.floor(Math.random() * messages.length)] });
}

function getResponsesSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isCorrect = HEADERS.every((header, index) => currentHeaders[index] === header);

  if (!isCorrect) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function findInvitationRow_(sheet, invitationId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const finder = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(invitationId)
    .matchEntireCell(true)
    .findNext();

  return finder ? finder.getRow() : 0;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (_) {
    throw new Error('Invalid JSON request body.');
  }
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid RSVP payload.');
  }

  if (!String(payload.invitationId || '').trim()) {
    throw new Error('Invitation ID is required.');
  }

  if (!String(payload.guestName || '').trim()) {
    throw new Error('Guest name is required.');
  }

  if (!['Attending', 'Not attending'].includes(String(payload.attendance || ''))) {
    throw new Error('Attendance selection is invalid.');
  }
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
