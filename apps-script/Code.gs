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
var HOLIDAYS_HEADERS = ['Date', 'Class', 'Remark'];
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
        result = addHoliday(params);
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
  return { ok: true };
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

function addHoliday(params) {
  appendRow(SHEET_HOLIDAYS, HOLIDAYS_HEADERS, { Date: params.date, Class: params.class || 'ALL', Remark: params.remark || 'Holiday' });
  return { ok: true };
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
