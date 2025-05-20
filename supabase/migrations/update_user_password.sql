-- 創建一個 RPC 函數來更新用戶密碼和首次登入狀態
-- 這個函數會直接在數據庫層更新，繞過可能的緩存層
CREATE OR REPLACE FUNCTION public.update_user_password(
  user_id integer,
  new_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- 使用 SECURITY DEFINER 以確保與調用者無關的權限
AS $$
BEGIN
  -- 直接更新 data_id 表
  UPDATE public.data_id
  SET 
    password = new_password_hash,
    first_login = false
  WHERE id = user_id;
  
  -- 如果影響了一行，返回 true，否則返回 false
  RETURN FOUND;
END;
$$; 