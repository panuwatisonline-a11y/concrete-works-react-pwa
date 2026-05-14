-- ลบแถว booked ซ้ำต่อคำขอ (เก็บแถว id เล็กสุด)
DELETE FROM "Request_Log" l
WHERE l.id IN (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY id) AS rn
    FROM "Request_Log"
    WHERE action = 'booked'
  ) t
  WHERE t.rn > 1
);

-- หนึ่งแถว booked ต่อ request_id (กัน trigger + แอป หรือ race)
CREATE UNIQUE INDEX IF NOT EXISTS idx_request_log_one_booked_per_request
  ON "Request_Log" (request_id)
  WHERE action = 'booked';
