/**
 * Construction Career Pre-Apprenticeship - Applicant Intake
 * Google Apps Script Backend
 *
 * Handles form submissions from GitHub Pages.
 * Writes to Google Sheets and uploads docs to Google Drive.
 */

var SPREADSHEET_ID = '1yiems8RcnvMzpacbCKxCtnYp82V8c1MCXfRDlM0Pv_Y';
var SHEET_NAME = 'Submissions';

function getOrCreateFolder() {
  var folderName = 'Construction Pre-Apprenticeship - Applicant Uploads';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', service: 'Construction Intake' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    var submittedAt = Utilities.formatDate(new Date(), 'America/New_York', 'MM/dd/yyyy hh:mm:ss a');
    var folder = getOrCreateFolder();
    var applicantName = (data.firstName || '') + ' ' + (data.lastName || '');
    var resumeObj = data.resume || data.resumeFile || null;
    var resumeLink = '';
    if (resumeObj && typeof resumeObj === 'object') {
      resumeLink = uploadFile(resumeObj.data, resumeObj.name, applicantName, 'Resume', folder);
    } else if (data.resumeFile) {
      resumeLink = uploadFile(data.resumeFile, data.resumeFileName, applicantName, 'Resume', folder);
    }
    var certLinks = [];
    var certFilesArr = data.certFiles || [];
    for (var i = 0; i < certFilesArr.length; i++) {
      if (certFilesArr[i] && certFilesArr[i].data) {
        var link = uploadFile(certFilesArr[i].data, certFilesArr[i].name, applicantName, 'Cert_' + (i + 1), folder);
        if (link) certLinks.push(link);
      }
    }
    var certLink = certLinks.join(', ');
    var otherObj = data.otherDocuments || data.otherFile || null;
    var otherLink = '';
    if (otherObj && typeof otherObj === 'object' && !otherObj.length) {
      otherLink = uploadFile(otherObj.data, otherObj.name, applicantName, 'Other', folder);
    } else if (data.otherFile) {
      otherLink = uploadFile(data.otherFile, data.otherFileName, applicantName, 'Other', folder);
    }
    var sigLink = uploadSignature(data.applicantSignature, applicantName, 'Applicant_Signature', folder);
    var guardianSigLink = uploadSignature(data.guardianSignature, applicantName, 'Guardian_Signature', folder);
    var programAreas = '';
    if (data.programAreas) {
      if (typeof data.programAreas === 'object' && data.programAreas.length) {
        programAreas = data.programAreas.join(', ');
      } else {
        programAreas = String(data.programAreas);
      }
    }
    var row = [
      submittedAt,
      data.firstName || '',
      data.lastName || '',
      data.dob || '',
      data.age || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      data.cityStateZip || '',
      data.preferredContact || '',
      data.guardianName || '',
      data.guardianPhone || '',
      data.guardianEmail || '',
      data.guardianRelationship || '',
      data.enrolledInSchool || '',
      data.currentSchool || '',
      data.highestGrade || '',
      data.currentlyWorking || '',
      data.otherProgram || '',
      data.otherProgramName || '',
      data.reliableTransportation || '',
      data.scheduleLimitations || '',
      data.emergencyName || '',
      data.emergencyPhone || '',
      data.emergencyRelationship || '',
      data.whyInterested || '',
      data.experienceLevel || '',
      data.experienceDescription || '',
      programAreas,
      resumeLink,
      certLink,
      otherLink,
      data.infoAccurate || '',
      data.understandsNoGuarantee || '',
      sigLink,
      data.dateSubmitted || submittedAt,
      guardianSigLink,
      data.isUnder18 ? 'Yes' : 'No'
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadFile(base64Data, fileName, applicantName, label, folder) {
  if (!base64Data || !fileName) return '';
  try {
    var decoded = Utilities.base64Decode(base64Data);
    var safeName = (applicantName || 'Applicant') + ' - ' + label + ' - ' + fileName;
    var blob = Utilities.newBlob(decoded, getMimeType(fileName), safeName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'Upload error: ' + e.toString();
  }
}

function uploadSignature(dataUrl, applicantName, label, folder) {
  if (!dataUrl) return '';
  try {
    var marker = ';base64,';
    var idx = dataUrl.indexOf(marker);
    var base64 = (idx >= 0) ? dataUrl.substring(idx + marker.length) : dataUrl;
    var decoded = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(decoded, 'image/png', (applicantName || 'Applicant') + ' - ' + label + '.png');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'Sig upload error: ' + e.toString();
  }
}

function getMimeType(fileName) {
  var parts = fileName.split('.');
  var ext = (parts.length > 1) ? parts[parts.length - 1].toLowerCase() : '';
  var types = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic'
  };
  return types[ext] || 'application/octet-stream';
}
