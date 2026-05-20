/** ประเภทรูป → ส่งเป็น FormData `folder` ให้ Edge Function เลือกโฟลเดอร์ Drive */
export type DriveUploadCategory = 'before' | 'after' | 'bill'

export const DRIVE_UPLOAD_CATEGORY_LABEL: Record<DriveUploadCategory, string> = {
  before: 'ก่อนเท (Before)',
  after: 'หลังเท (After)',
  bill: 'บิลคอนกรีต (Bill)',
}
