-- อนุญาต role ใหม่: inspector, document, engineer (เดิมมักมีแค่ admin, manager, user)

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    role IN (
      'admin',
      'user',
      'inspector',
      'document',
      'engineer',
      'manager'
    )
  );

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'manager = legacy (ใช้ inspector ในแอป); ค่าอื่นต้องตรงกับ ASSIGNABLE_ROLES + admin';
