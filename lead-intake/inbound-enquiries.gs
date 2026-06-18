/**
 * Inbound Enquiries 2026 — Google Apps Script
 *
 * Install on the spreadsheet linked to your Google Form (not the form itself).
 *
 * Live spreadsheet:
 * https://docs.google.com/spreadsheets/d/1bGdMpUf8ATttFP2CL4lC3EJexmO3jW3dbHLqKc0S8jg/edit
 * ID: 1bGdMpUf8ATttFP2CL4lC3EJexmO3jW3dbHLqKc0S8jg
 *
 * Setup:
 * 1. Open the spreadsheet → Extensions → Apps Script → paste this file → Save.
 * 2. Run setupSheetHeaders once (authorize when prompted).
 * 3. Triggers → Add trigger → onFormSubmit → From spreadsheet → On form submit.
 */

var STATUS_COLUMN = 'Status';
var DEFAULT_STATUS = 'Pending';

var FORM_HEADERS = [
  'Timestamp',
  'Full Name',
  'Business Email',
  'Company',
  'Job Title',
  'Company Size',
  'Automation Problems',
  STATUS_COLUMN
];

/**
 * One-time: ensure Status column exists and is labelled correctly.
 * Safe to re-run — only adds the column if missing.
 */
function setupSheetHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var statusIndex = headers.indexOf(STATUS_COLUMN);

  if (statusIndex === -1) {
    var newCol = lastCol + 1;
    sheet.getRange(1, newCol).setValue(STATUS_COLUMN);
    sheet.getRange(1, newCol).setFontWeight('bold');
  }
}

/**
 * Form submit trigger — sets Status to Pending on each new row.
 */
function onFormSubmit(e) {
  if (!e || !e.range) {
    return;
  }

  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var statusCol = getOrCreateStatusColumn_(sheet);

  sheet.getRange(row, statusCol).setValue(DEFAULT_STATUS);
}

function getOrCreateStatusColumn_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var statusIndex = headers.indexOf(STATUS_COLUMN);

  if (statusIndex !== -1) {
    return statusIndex + 1;
  }

  var newCol = lastCol + 1;
  sheet.getRange(1, newCol).setValue(STATUS_COLUMN).setFontWeight('bold');
  return newCol;
}
