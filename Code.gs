function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById('1lnNyUa0sG1ugesJzzKHGJ15GKAw-bd7dbE4eBnAgsww');
    var sheet = ss.getSheetByName('Submissions') || ss.getSheets()[0];
    var submittedAt = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'});
    var folderId = '1jJ1fDmwzmIyGB5NTvmmxtkLrsWpbv8km';
    var activities = data.activities || [];
    for (var i = 0; i < activities.length; i++) {
      var a = activities[i];
      var proofLink = '';
      if (a.proofFileName && a.proofFileData) {
        try {
          var blob = Utilities.newBlob(
            Utilities.base64Decode(a.proofFileData),
            a.proofFileMime || 'application/octet-stream',
            a.proofFileName
          );
          var folder = DriveApp.getFolderById(folderId);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          proofLink = file.getUrl();
        } catch (fileErr) {
          proofLink = 'Upload failed: ' + fileErr.message;
        }
      }
      sheet.appendRow([
        submittedAt,
        data.instructorName || '',
        data.email || '',
        a.activity || '',
        a.section || '',
        a.hours || '',
        a.dateCompleted || '',
        a.description || '',
        proofLink
      ]);
    }
    return ContentService.createTextOutput(
      JSON.stringify({status: 'success', rows: activities.length})
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({status: 'error', message: err.message})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({status: 'ok', message: 'Run It Up Onboarding endpoint is live'})
  ).setMimeType(ContentService.MimeType.JSON);
}
