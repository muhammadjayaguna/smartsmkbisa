-- 1. Hapus fungsi lama jika sudah ada (karena tipe return-nya mungkin berbeda)
DROP FUNCTION IF EXISTS get_recent_conversations(uuid);
DROP FUNCTION IF EXISTS delete_user(text);
DROP FUNCTION IF EXISTS delete_user(uuid);

-- 2. Buat ulang fungsi untuk mendapatkan obrolan terakhir
CREATE OR REPLACE FUNCTION get_recent_conversations(user_uuid uuid)
RETURNS TABLE (
  other_user_id uuid,
  last_message_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN sender_id = user_uuid THEN receiver_id 
      ELSE sender_id 
    END AS other_user_id,
    MAX(created_at) AS last_message_at
  FROM public.direct_messages
  WHERE sender_id = user_uuid OR receiver_id = user_uuid
  GROUP BY 
    CASE 
      WHEN sender_id = user_uuid THEN receiver_id 
      ELSE sender_id 
    END;
$$;

-- 3. Buat ulang fungsi untuk menghapus pengguna
CREATE OR REPLACE FUNCTION delete_user(target_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hapus profil dari public.users (Ini berlaku untuk user Supabase maupun Firebase)
  DELETE FROM public.users WHERE auth_id = target_user_id;

  -- Cek apakah format ID adalah UUID (artinya ini user dari Supabase Auth, bukan Firebase)
  IF target_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    DELETE FROM auth.users WHERE id = target_user_id::uuid;
  END IF;
END;
$$;
