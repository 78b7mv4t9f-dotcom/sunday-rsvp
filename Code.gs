/**
 * Sunday Program RSVP — Google Apps Script Backend
 * Bent Tree Bible Fellowship — Special Needs Ministry
 *
 * SETUP: In your Google Sheet → Extensions → Apps Script
 * Paste this file, then Deploy → New deployment → Web app
 *   Execute as: Me | Who has access: Anyone
 * Copy the Web App URL into index.html and admin.html
 *
 * REDEPLOYING AFTER CHANGES:
 * Deploy → Manage deployments → pencil → New version → Deploy
 */

const RSVP_SHEET   = 'RSVPs';
const CONFIG_SHEET = 'Settings';

function getOrCreateRSVPSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RSVP_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(RSVP_SHEET);
    sheet.appendRow(['Timestamp','Sunday Date','Caregiver Name','Participant Name','Attending','Added By']);
    sheet.getRange(1,1,1,6).setFontWeight('bold').setBackground('#252542').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    [160,110,180,180,90,120].forEach((w,i) => sheet.setColumnWidth(i+1,w));
  }
  return sheet;
}

function getOrCreateConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET);
    sheet.appendRow(['Key','Value','Description']);
    sheet.getRange(1,1,1,3).setFontWeight('bold').setBackground('#252542').setFontColor('#ffffff');
    sheet.appendRow(['openDay',  '1', 'Day sign-up opens (0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat)']);
    sheet.appendRow(['closeDay', '3', 'Day sign-up closes (same scale)']);
    sheet.appendRow(['closeHour','20','Hour sign-up closes in 24h format (20 = 8pm)']);
    sheet.setFrozenRows(1);
    [120,80,320].forEach((w,i) => sheet.setColumnWidth(i+1,w));
  }
  return sheet;
}

function readSettings() {
  const rows = getOrCreateConfigSheet().getDataRange().getValues().slice(1);
  const cfg  = {openDay:1, closeDay:3, closeHour:20};
  rows.forEach(r => {
    const k = String(r[0]).trim();
    const v = parseInt(String(r[1]).trim(), 10);
    if (!isNaN(v) && k in cfg) cfg[k] = v;
  });
  return cfg;
}

function writeSettings(s) {
  const sheet = getOrCreateConfigSheet();
  const rows  = sheet.getDataRange().getValues();
  ['openDay','closeDay','closeHour'].forEach(key => {
    if (!(key in s)) return;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === key) {
        sheet.getRange(i+1,2).setValue(s[key]);
        return;
      }
    }
    sheet.appendRow([key, s[key], '']);
  });
}

function corsOut(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'rsvp') {
      getOrCreateRSVPSheet().appendRow([
        d.timestamp||new Date().toISOString(),
        d.sundayDate||'', d.caregiver||'',
        d.participant||'', d.attending||'',
        d.addedBy||'parent'
      ]);
      return corsOut({success:true});
    }
    if (d.action === 'saveSettings') {
      writeSettings({openDay:d.openDay, closeDay:d.closeDay, closeHour:d.closeHour});
      return corsOut({success:true, settings:readSettings()});
    }
    return corsOut({success:false, error:'Unknown action'});
  } catch(err) {
    return corsOut({success:false, error:err.message});
  }
}

function doGet(e) {
  const action = ((e||{}).parameter||{}).action||'';
  if (action === 'getAll') {
    try {
      const rows = getOrCreateRSVPSheet().getDataRange().getValues().slice(1);
      return corsOut({success:true, rows: rows.filter(r=>r[1]).map(r=>({
        timestamp:r[0], sundayDate:r[1], caregiver:r[2],
        participant:r[3], attending:r[4], addedBy:r[5]||'parent'
      }))});
    } catch(err) { return corsOut({success:false,error:err.message}); }
  }
  if (action === 'getSettings') {
    try { return corsOut({success:true, settings:readSettings()}); }
    catch(err) { return corsOut({success:false,error:err.message}); }
  }
  return corsOut({status:'ok', message:'Bent Tree RSVP API running'});
}
