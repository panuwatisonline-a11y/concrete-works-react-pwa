-- สถานะเช็คการจองในหน้าสรุปรายการจอง (ถูก/ผิด)
ALTER TABLE public."Request"
  ADD COLUMN IF NOT EXISTS booking_ok boolean NULL;

COMMENT ON COLUMN public."Request".booking_ok IS
  'สรุปการจอง: true=จองสำเร็จ, false=จองไม่สำเร็จ, null=ยังไม่เช็ค';
