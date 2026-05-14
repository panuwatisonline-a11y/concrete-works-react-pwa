-- handle_new_user() อ้างคอลัมน์ "Job" ที่ไม่มีในตาราง profiles (คอลัมน์จริงคือ job_id)
-- ทำให้ทุก signup ล้มด้วย 500 ขณะที่ handle_new_user_profile() ถูกต้องแล้ว
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
