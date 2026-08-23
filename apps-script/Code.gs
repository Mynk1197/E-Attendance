/**
 * E-Attendance backend. Bind this script to the attendance Google Sheet.
 * Deploy: Deploy > New deployment > Web app > Execute as "Me", Access "Anyone".
 */

var SHEET_TEACHERS = 'Teachers';
var SHEET_STUDENTS = 'Students';
var SHEET_ATTENDANCE = 'Attendance';
var SHEET_HOLIDAYS = 'Holidays';

var STUDENTS_HEADERS = ['StudentID', 'Class', 'Section', 'Name', 'Surname', 'DOB', 'ScholarNo', 'Category', 'Gender', 'Active'];
var ATTENDANCE_HEADERS = ['Date', 'Class', 'Section', 'StudentID', 'Present', 'MarkedBy', 'Timestamp'];
var HOLIDAYS_HEADERS = ['Date', 'Class', 'Remark', 'ID', 'CreatedBy'];
var TEACHERS_HEADERS = ['Email', 'Name', 'ClassesAssigned'];

function doGet(e) {
  return handle(e);
}

function doPost(e) {
  return handle(e);
}

function handle(e) {
  var params = e.parameter || {};
  var action = params.action;
  var result;
  try {
    var teacher = requireAuth(params);
    switch (action) {
      case 'login':
        result = { name: teacher.name, email: teacher.email, classes: teacher.classes };
        break;
      case 'getStudents':
        result = getStudents(params);
        break;
      case 'addStudent':
        result = addStudent(params);
        break;
      case 'updateStudent':
        result = updateStudent(params);
        break;
      case 'deleteStudent':
        result = deleteStudent(params);
        break;
      case 'saveAttendance':
        result = saveAttendance(params, teacher);
        break;
      case 'getAttendance':
        result = getAttendance(params);
        break;
      case 'getReport':
        result = getReport(params);
        break;
      case 'getHolidays':
        result = getHolidays(params);
        break;
      case 'addHoliday':
        result = addHoliday(params, teacher);
        break;
      case 'deleteHoliday':
        result = deleteHoliday(params, teacher);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }
    return jsonOut({ ok: true, data: result });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Auth ----------

function requireAuth(params) {
  if (action_isPublic(params.action)) return { email: null, name: null, classes: [] };
  var idToken = params.idToken;
  if (!idToken) throw new Error('Missing idToken');
  var email = verifyIdTokenAndGetEmail(idToken);
  var teacher = getTeacherByEmail(email);
  if (!teacher) throw new Error('Not authorized: ' + email);
  return teacher;
}

function action_isPublic() {
  return false; // every action requires a valid, whitelisted teacher
}

function verifyIdTokenAndGetEmail(idToken) {
  var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error('Invalid Google token');
  var payload = JSON.parse(resp.getContentText());
  if (!payload.email || payload.email_verified !== 'true') throw new Error('Email not verified');
  return payload.email.toLowerCase();
}

function getTeacherByEmail(email) {
  var rows = sheetToObjects(SHEET_TEACHERS, TEACHERS_HEADERS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Email).toLowerCase() === email) {
      return {
        email: email,
        name: rows[i].Name,
        classes: String(rows[i].ClassesAssigned || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      };
    }
  }
  return null;
}

// ---------- Sheet helpers ----------

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}

function sheetToObjects(name, headers) {
  var sh = getSheet(name);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) {
      var cell = row[i];
      // Sheets silently converts date-looking text (e.g. a DOB typed as
      // 2015-05-06) into a real Date value; normalize it back to
      // yyyy-MM-dd so it round-trips correctly into <input type="date">.
      obj[h] = cell instanceof Date ? Utilities.formatDate(cell, 'Asia/Kolkata', 'yyyy-MM-dd') : cell;
    });
    return obj;
  });
}

function appendRow(name, headers, obj) {
  var sh = getSheet(name);
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
}

function findRowIndexByKey(name, headers, keyHeader, keyValue) {
  var sh = getSheet(name);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  var keyCol = headers.indexOf(keyHeader) + 1;
  var values = sh.getRange(2, keyCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(keyValue)) return i + 2; // 1-indexed sheet row
  }
  return -1;
}

// ---------- Students ----------

function getStudents(params) {
  var all = sheetToObjects(SHEET_STUDENTS, STUDENTS_HEADERS);
  return all.filter(function (s) {
    if (String(s.Active) === 'N') return false;
    if (params.class && String(s.Class) !== String(params.class)) return false;
    if (params.section && String(s.Section) !== String(params.section)) return false;
    return true;
  });
}

function addStudent(params) {
  var s = JSON.parse(params.student);
  s.StudentID = 'S' + new Date().getTime() + Math.floor(Math.random() * 1000);
  s.Active = 'Y';
  appendRow(SHEET_STUDENTS, STUDENTS_HEADERS, s);
  forceDOBAsText(findRowIndexByKey(SHEET_STUDENTS, STUDENTS_HEADERS, 'StudentID', s.StudentID), s.DOB);
  return { studentId: s.StudentID };
}

function updateStudent(params) {
  var fields = JSON.parse(params.fields);
  var rowIdx = findRowIndexByKey(SHEET_STUDENTS, STUDENTS_HEADERS, 'StudentID', params.studentId);
  if (rowIdx < 0) throw new Error('Student not found');
  var sh = getSheet(SHEET_STUDENTS);
  STUDENTS_HEADERS.forEach(function (h, i) {
    if (fields[h] !== undefined) sh.getRange(rowIdx, i + 1).setValue(fields[h]);
  });
  if (fields.DOB !== undefined) forceDOBAsText(rowIdx, fields.DOB);
  return { ok: true };
}

// Sheets auto-converts a "yyyy-MM-dd"-looking value into a real Date/
// datetime cell, which breaks the <input type="date"> round-trip. Setting
// the cell's number format to plain text ("@") before writing keeps DOB
// stored exactly as the yyyy-MM-dd string the app sent.
function forceDOBAsText(rowIdx, dobValue) {
  if (rowIdx < 0 || !dobValue) return;
  var sh = getSheet(SHEET_STUDENTS);
  var col = STUDENTS_HEADERS.indexOf('DOB') + 1;
  var cell = sh.getRange(rowIdx, col);
  cell.setNumberFormat('@');
  cell.setValue(String(dobValue));
}

// One-time repair: run manually from the Apps Script editor if existing
// DOB values were saved before forceDOBAsText was added and are showing
// as blank/garbled on edit.
function normalizeDOBColumn() {
  var sh = getSheet(SHEET_STUDENTS);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  var col = STUDENTS_HEADERS.indexOf('DOB') + 1;
  var range = sh.getRange(2, col, lastRow - 1, 1);
  var values = range.getValues();
  range.setNumberFormat('@');
  var fixed = values.map(function (row) {
    var cell = row[0];
    return [cell instanceof Date ? Utilities.formatDate(cell, 'Asia/Kolkata', 'yyyy-MM-dd') : String(cell)];
  });
  range.setValues(fixed);
}

function deleteStudent(params) {
  var rowIdx = findRowIndexByKey(SHEET_STUDENTS, STUDENTS_HEADERS, 'StudentID', params.studentId);
  if (rowIdx < 0) throw new Error('Student not found');
  var sh = getSheet(SHEET_STUDENTS);
  sh.getRange(rowIdx, STUDENTS_HEADERS.indexOf('Active') + 1).setValue('N');
  return { ok: true };
}

// ---------- Attendance ----------

function saveAttendance(params, teacher) {
  var date = params.date; // 'YYYY-MM-DD'
  var klass = params.class;
  var section = params.section || '';
  var records = JSON.parse(params.records); // [{studentId, present: 'Y'|'N'|'H'}]
  var now = new Date().toISOString();
  var sh = getSheet(SHEET_ATTENDANCE);
  var lastRow = sh.getLastRow();
  var existing = {};
  if (lastRow >= 2) {
    var values = sh.getRange(2, 1, lastRow - 1, ATTENDANCE_HEADERS.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]) === date && String(values[i][3])) {
        existing[values[i][3]] = i + 2;
      }
    }
  }
  records.forEach(function (r) {
    var rowVals = [date, klass, section, r.studentId, r.present, teacher.email, now];
    var rowIdx = existing[r.studentId];
    if (rowIdx) {
      sh.getRange(rowIdx, 1, 1, ATTENDANCE_HEADERS.length).setValues([rowVals]);
    } else {
      sh.appendRow(rowVals);
    }
  });
  return { saved: records.length };
}

function getAttendance(params) {
  var all = sheetToObjects(SHEET_ATTENDANCE, ATTENDANCE_HEADERS);
  return all.filter(function (a) {
    if (String(a.Date) !== String(params.date)) return false;
    if (params.class && String(a.Class) !== String(params.class)) return false;
    if (params.section && String(a.Section) !== String(params.section)) return false;
    return true;
  });
}

// ---------- Reports ----------

function dateRangeForPeriod(period, dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  var start, end;
  if (period === 'daily') {
    start = new Date(d); end = new Date(d);
  } else if (period === 'weekly') {
    var day = d.getDay(); // 0=Sun
    start = new Date(d); start.setDate(d.getDate() - day);
    end = new Date(start); end.setDate(start.getDate() + 6);
  } else { // monthly
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  return { start: start, end: end };
}

function toDateStr(d) {
  return Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd');
}

function getReport(params) {
  var klass = params.class;
  var section = params.section || '';
  var range = dateRangeForPeriod(params.period, params.date);

  var students = getStudents({ class: klass, section: section });
  var studentById = {};
  students.forEach(function (s) { studentById[s.StudentID] = s; });
  var totalStrength = students.length;

  var holidays = sheetToObjects(SHEET_HOLIDAYS, HOLIDAYS_HEADERS).filter(function (h) {
    var hd = new Date(h.Date + 'T00:00:00');
    return hd >= range.start && hd <= range.end && (String(h.Class) === String(klass) || String(h.Class) === 'ALL');
  });
  var holidayDates = {};
  holidays.forEach(function (h) { holidayDates[h.Date] = h.Remark; });

  var attendance = sheetToObjects(SHEET_ATTENDANCE, ATTENDANCE_HEADERS).filter(function (a) {
    var ad = new Date(a.Date + 'T00:00:00');
    if (!(ad >= range.start && ad <= range.end)) return false;
    if (String(a.Class) !== String(klass)) return false;
    if (section && String(a.Section) !== String(section)) return false;
    return true;
  });

  var days = [];
  for (var d = new Date(range.start); d <= range.end; d.setDate(d.getDate() + 1)) {
    var ds = toDateStr(d);
    var dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || holidayDates[ds]) {
      days.push({ date: ds, holiday: true, remark: holidayDates[ds] || 'Sunday' });
      continue;
    }
    var dayRecords = attendance.filter(function (a) { return a.Date === ds; });
    var summary = summarizeDay(dayRecords, studentById, totalStrength);
    summary.date = ds;
    summary.holiday = false;
    days.push(summary);
  }

  var totals = { totalStrength: totalStrength, boysPresent: 0, girlsPresent: 0, totalPresent: 0, totalAbsent: 0, scPresent: 0, stPresent: 0, obcPresent: 0, genPresent: 0, daysCounted: 0 };
  days.forEach(function (day) {
    if (day.holiday) return;
    totals.daysCounted++;
    totals.boysPresent += day.boysPresent;
    totals.girlsPresent += day.girlsPresent;
    totals.totalPresent += day.totalPresent;
    totals.totalAbsent += day.totalAbsent;
    totals.scPresent += day.scPresent;
    totals.stPresent += day.stPresent;
    totals.obcPresent += day.obcPresent;
    totals.genPresent += day.genPresent;
  });

  return { period: params.period, class: klass, section: section, days: days, totals: totals };
}

function summarizeDay(dayRecords, studentById, totalStrength) {
  var s = { boysPresent: 0, girlsPresent: 0, totalPresent: 0, totalAbsent: 0, scPresent: 0, stPresent: 0, obcPresent: 0, genPresent: 0 };
  dayRecords.forEach(function (r) {
    var student = studentById[r.StudentID];
    if (!student || String(r.Present) !== 'Y') return;
    s.totalPresent++;
    if (String(student.Gender) === 'M') s.boysPresent++;
    if (String(student.Gender) === 'F') s.girlsPresent++;
    var cat = String(student.Category || '').toUpperCase();
    if (cat === 'SC') s.scPresent++;
    else if (cat === 'ST') s.stPresent++;
    else if (cat === 'OBC') s.obcPresent++;
    else s.genPresent++;
  });
  s.totalAbsent = totalStrength - s.totalPresent;
  return s;
}

// ---------- Holidays ----------

function getHolidays(params) {
  var all = sheetToObjects(SHEET_HOLIDAYS, HOLIDAYS_HEADERS);
  return all.filter(function (h) {
    if (params.dateFrom && h.Date < params.dateFrom) return false;
    if (params.dateTo && h.Date > params.dateTo) return false;
    if (params.class && String(h.Class) !== String(params.class) && String(h.Class) !== 'ALL') return false;
    return true;
  });
}

function addHoliday(params, teacher) {
  var klass = params.class || 'ALL';
  var existing = sheetToObjects(SHEET_HOLIDAYS, HOLIDAYS_HEADERS).filter(function (h) {
    return String(h.Date) === String(params.date) && String(h.Class) === String(klass);
  });
  if (existing.length > 0) {
    throw new Error('A holiday is already added for this date. Delete it first to add a different one.');
  }
  var id = 'H' + new Date().getTime() + Math.floor(Math.random() * 1000);
  appendRow(SHEET_HOLIDAYS, HOLIDAYS_HEADERS, {
    Date: params.date,
    Class: params.class || 'ALL',
    Remark: params.remark || 'Holiday',
    ID: id,
    CreatedBy: teacher.email,
  });
  forceCellAsText(SHEET_HOLIDAYS, HOLIDAYS_HEADERS, findRowIndexByKey(SHEET_HOLIDAYS, HOLIDAYS_HEADERS, 'ID', id), 'Date', params.date);
  return { id: id };
}

// Same fix as forceDOBAsText, generalized: writing a date cell lets Sheets
// auto-convert it, and depending on the spreadsheet's own timezone setting
// that can land on a different calendar day than what was actually typed.
// Forcing plain-text format keeps the exact yyyy-MM-dd string.
function forceCellAsText(sheetName, headers, rowIdx, columnHeader, value) {
  if (rowIdx < 0 || !value) return;
  var sh = getSheet(sheetName);
  var col = headers.indexOf(columnHeader) + 1;
  var cell = sh.getRange(rowIdx, col);
  cell.setNumberFormat('@');
  cell.setValue(String(value));
}

// One-time repair: run manually if holiday dates were saved before this
// fix and are displaying a day off from what was actually entered.
function normalizeHolidayDates() {
  var sh = getSheet(SHEET_HOLIDAYS);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  var col = HOLIDAYS_HEADERS.indexOf('Date') + 1;
  var range = sh.getRange(2, col, lastRow - 1, 1);
  var values = range.getValues();
  range.setNumberFormat('@');
  var fixed = values.map(function (row) {
    var cell = row[0];
    return [cell instanceof Date ? Utilities.formatDate(cell, 'Asia/Kolkata', 'yyyy-MM-dd') : String(cell)];
  });
  range.setValues(fixed);
}

function deleteHoliday(params, teacher) {
  var rowIdx = findRowIndexByKey(SHEET_HOLIDAYS, HOLIDAYS_HEADERS, 'ID', params.id);
  if (rowIdx < 0) throw new Error('Holiday not found');
  var sh = getSheet(SHEET_HOLIDAYS);
  var createdBy = sh.getRange(rowIdx, HOLIDAYS_HEADERS.indexOf('CreatedBy') + 1).getValue();
  if (String(createdBy).toLowerCase() !== teacher.email) throw new Error('You can only delete holidays you created');
  sh.deleteRow(rowIdx);
  return { ok: true };
}

// One-time repair: run manually if holidays added before ID/CreatedBy
// existed need those columns backfilled so they can be deleted.
function backfillHolidayIds() {
  var sh = getSheet(SHEET_HOLIDAYS);
  sh.getRange(1, 1, 1, HOLIDAYS_HEADERS.length).setValues([HOLIDAYS_HEADERS]);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  var idCol = HOLIDAYS_HEADERS.indexOf('ID') + 1;
  var createdByCol = HOLIDAYS_HEADERS.indexOf('CreatedBy') + 1;
  var ids = sh.getRange(2, idCol, lastRow - 1, 1).getValues();
  var owner = Session.getEffectiveUser().getEmail().toLowerCase();
  for (var i = 0; i < ids.length; i++) {
    if (!ids[i][0]) {
      sh.getRange(i + 2, idCol).setValue('H' + new Date().getTime() + i);
      sh.getRange(i + 2, createdByCol).setValue(owner);
    }
  }
}

// ---------- One-time setup helper ----------
// Run this once from the Apps Script editor to create sheet tabs with headers.
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var defs = [
    [SHEET_TEACHERS, TEACHERS_HEADERS],
    [SHEET_STUDENTS, STUDENTS_HEADERS],
    [SHEET_ATTENDANCE, ATTENDANCE_HEADERS],
    [SHEET_HOLIDAYS, HOLIDAYS_HEADERS]
  ];
  defs.forEach(function (def) {
    var name = def[0], headers = def[1];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  });
}
