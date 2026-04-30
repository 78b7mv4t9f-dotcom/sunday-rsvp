/**
 * Sunday Program RSVP — Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com → New project
 * 2. Paste this entire file into the editor
 * 3. Click "Deploy" → "New deployment" → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Click "Deploy" and copy the Web App URL
 * 5. Paste that URL into index.html and admin.html where it says:
 *    YOUR_GOOGLE_APPS_SCRIPT_URL_HERE
 */

const SHEET_NAME = 'RSVPs';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Sunday Date', 'Caregiver Name', 'Participant Name', 'Attending']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Handle POST requests (new RSVP submission)
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'rsvp') {
      const sheet = getOrCreateSheet();
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.sundayDate,
        data.caregiver,
        data.participant,
        data.attending
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (admin fetch all data)
function doGet(e) {
  const params = e.parameter;

  if (params.action === 'getAll') {
    try {
      const sheet = getOrCreateSheet();
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const data = rows.slice(1).map(row => ({
        timestamp:   row[0],
        sundayDate:  row[1],
        caregiver:   row[2],
        participant: row[3],
        attending:   row[4]
      }));
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, rows: data }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default response
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Sunday RSVP API running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
