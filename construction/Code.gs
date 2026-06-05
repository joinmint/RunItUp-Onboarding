/**
 * Construction Career Pre-Apprenticeship – Applicant Intake
 * Google Apps Script Backend
 * 
 * Handles form submissions from GitHub Pages form.
 * Writes to Google Sheets + uploads documents to Google Drive.
 * 
 * SPREADSHEET: 1yiems8RcnvMzpacbCKxCtnYp82V8c1MCXfRDlM0Pv_Y
 * DRIVE FOLDER: Created automatically on first run
 */

var SPREADSHEET_ID = '1yiems8RcnvMzpacbCKxCtnYp82V8c1MCXfRDlM0Pv_Y';
var SHEET_NAME = 'Submissions';
var PARENT_FOLDER_ID = '1jJ1fDmwzmIyGB5NTvmmxtkLrsWpbv8km'; // Run It Up – Instructor Submissions parent

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var submittedAt = new Date();
    var formattedTimestamp = Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'MM/dd/yyyy hh:mm:ss a');
    
    // Get or create the uploads folder
    var folder = getOrCreateFolder();
    var applicantName = data.firstName + ' ' + data.lastName;
    
    // Upload documents to Drive
    var resumeLink = uploadFile(folder, data.resume, applicantName, 'Resume');
    var certsLink = uploadFile(folder, data.certifications, applicantName, 'Certifications');
    var otherLink = uploadFile(folder, data.otherDocuments, applicantName, 'OtherDocs');
    
    // Upload signatures to Drive
    var applicantSigLink = '';
    if (data.applicantSignature) {
      var sigBlob = Utilities.newBlob(Utilities.base64Decode(data.applicantSignature), 'image/png', applicantName + ' - Applicant Signature.png');
      var sigFile = folder.createFile(sigBlob);
      sigFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      applicantSigLink = sigFile.getUrl();
    }
    
    var guardianSigLink = '';
    if (data.guardianSignature) {
      var gSigBlob = Utilities.newBlob(Utilities.base64Decode(data.guardianSignature), 'image/png', applicantName + ' - Guardian Signature.png');
      var gSigFile = folder.createFile(gSigBlob);
      gSigFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      guardianSigLink = gSigFile.getUrl();
    }
    
    // Write row to spreadsheet
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    var row = [
      formattedTimestamp,                        // Submitted At
      data.firstName || '',                      // First Name
      data.lastName || '',                       // Last Name
      data.dob || '',                            // Date of Birth
      data.age || '',                            // Age
      data.phone || '',                          // Phone Number
      data.email || '',                          // Email Address
      data.address || '',                        // Home Address
      data.cityStateZip || '',                   // City, State, ZIP
      data.preferredContact || '',               // Preferred Contact
      data.isMinor ? 'Yes' : 'No',              // Under 18
      data.guardianName || '',                   // Parent/Guardian Name
      data.guardianPhone || '',                  // Parent/Guardian Phone
      data.guardianEmail || '',                  // Parent/Guardian Email
      data.guardianRelationship || '',           // Relationship to Applicant (Parent)
      data.enrolledInSchool || '',               // Enrolled in School
      data.school || '',                         // Current/Recent School
      data.highestGrade || '',                   // Highest Grade Completed
      data.currentlyWorking || '',               // Currently Working
      data.inAnotherProgram || '',               // In Another Program
      data.otherProgramName || '',               // Other Program Name
      data.transportation || '',                 // Reliable Transportation
      data.scheduleLimitations || '',            // Schedule Limitations
      data.emergencyName || '',                  // Emergency Contact Name
      data.emergencyPhone || '',                 // Emergency Contact Phone
      data.emergencyRelationship || '',          // Emergency Contact Relationship
      data.whyInterested || '',                  // Why Interested
      data.experienceLevel || '',                // Experience Level
      data.experienceDescription || '',          // Experience Description
      data.programAreas || '',                   // Interested Program Areas
      resumeLink,                                // Resume Link
      certsLink,                                 // Certifications Link
      otherLink,                                 // Other Documents Link
      data.infoAccurate || '',                   // Info Accurate
      data.understandsNoGuarantee || '',         // Understands No Guarantee
      applicantSigLink,                          // Applicant Signature
      data.dateSubmitted || '',                  // Date Submitted
      guardianSigLink                            // Parent/Guardian Signature
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', service: 'Construction Pre-Apprenticeship Intake' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function uploadFile(folder, fileData, applicantName, docType) {
  if (!fileData || !fileData.data) return '';
  
  try {
    var fileName = applicantName + ' - ' + docType + ' - ' + (fileData.name || 'upload');
    var blob = Utilities.newBlob(Utilities.base64Decode(fileData.data), fileData.mimeType || 'application/octet-stream', fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log('Upload error for ' + docType + ': ' + err);
    return 'Upload failed';
  }
}

function getOrCreateFolder() {
  var folderName = 'Construction Pre-Apprenticeship – Applicant Uploads';
  
  // Check if folder already exists in parent
  try {
    var parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
    var folders = parent.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parent.createFolder(folderName);
  } catch (err) {
    // Fallback: create in root
    var rootFolders = DriveApp.getFoldersByName(folderName);
    if (rootFolders.hasNext()) {
      return rootFolders.next();
    }
    return DriveApp.createFolder(folderName);
  }
}
