/**
 * Google Apps Script — รับ POST JSON จาก Supabase Edge Function แล้วบันทึกไฟล์ใน Google Drive
 *
 * Setup:
 *   1. Extensions → Apps Script → วางโค้ดนี้
 *   2. Project Settings → Script Properties → เพิ่ม UPLOAD_SECRET (ค่าเดียวกับ Supabase secret GAS_UPLOAD_SECRET)
 *   3. Deploy → New deployment → Web app
 *      - Execute as: Me (ชื่อ Google account ที่มีสิทธิ์โฟลเดอร์)
 *      - Who has access: Anyone
 *   4. คัดลอก Web app URL → ใส่เป็น Supabase secret GAS_UPLOAD_URL
 *
 * Request body (JSON):
 *   secret        string   — ต้องตรงกับ Script property UPLOAD_SECRET
 *   parentFolderId string  — Drive folder ID (ถ้าไม่ส่งจะอัปไปที่ root)
 *   name          string   — ชื่อไฟล์ที่ต้องการบันทึก
 *   mimeType      string   — MIME type เช่น image/jpeg
 *   base64        string   — base64-encoded binary ของไฟล์
 *
 * Response (JSON):
 *   { fileId, url }  — สำเร็จ
 *   { error }        — ล้มเหลว
 */

// eslint-disable-next-line no-unused-vars
function doPost(e) {
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)

  try {
    const props = PropertiesService.getScriptProperties()
    const secret = props.getProperty('UPLOAD_SECRET')

    let payload
    try {
      payload = JSON.parse(e.postData.contents)
    } catch (_) {
      output.setContent(JSON.stringify({ error: 'Invalid JSON body' }))
      return output
    }

    if (!secret || payload.secret !== secret) {
      output.setContent(JSON.stringify({ error: 'Unauthorized' }))
      return output
    }

    const { parentFolderId, name, mimeType, base64 } = payload

    if (!base64 || !name || !mimeType) {
      output.setContent(JSON.stringify({ error: 'Missing required fields: name, mimeType, base64' }))
      return output
    }

    const bytes = Utilities.base64Decode(base64)
    const blob = Utilities.newBlob(bytes, mimeType, name)

    let folder
    if (parentFolderId) {
      try {
        folder = DriveApp.getFolderById(parentFolderId)
      } catch (_) {
        output.setContent(JSON.stringify({ error: 'Folder not found: ' + parentFolderId }))
        return output
      }
    } else {
      folder = DriveApp.getRootFolder()
    }

    const file = folder.createFile(blob)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

    const fileId = file.getId()
    const url = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=s1200'

    output.setContent(JSON.stringify({ fileId: fileId, url: url }))
    return output

  } catch (err) {
    output.setContent(JSON.stringify({ error: err.toString() }))
    return output
  }
}

/** รันด้วยตนเองเพื่อทดสอบ: Project Settings → Script Properties → ตรวจสอบว่า UPLOAD_SECRET ตั้งแล้ว */
// eslint-disable-next-line no-unused-vars
function testSetup() {
  const props = PropertiesService.getScriptProperties()
  const secret = props.getProperty('UPLOAD_SECRET')
  Logger.log('UPLOAD_SECRET set: ' + (secret ? 'yes (' + secret.length + ' chars)' : 'NO — ต้องตั้งใน Script Properties'))

  const root = DriveApp.getRootFolder()
  Logger.log('Drive root: ' + root.getName() + ' (' + root.getId() + ')')
}
