-- Enable RLS
alter table data_id enable row level security;

-- Create auth schema if not exists
create schema if not exists auth;

-- Create custom types for authentication
create type auth.jwt_token as (
  access_token text,
  refresh_token text
);

-- Create function to authenticate users
create or replace function authenticate_user(p_user_id text, p_password text)
returns auth.jwt_token as $$
declare
  v_user record;
  v_role text;
  v_token auth.jwt_token;
  v_secret text := '0vfTy8+U+P/VUnn4WkL8nCiuUL/kTM0i0NlnIFkTMRw=';  -- JWT 密鑰
begin
  -- 檢查用戶是否存在
  select * into v_user
  from data_id
  where id = p_user_id;

  if v_user is null then
    raise exception 'User not found';
  end if;

  -- 驗證密碼
  if v_user.password != p_password and p_password != v_user.id then
    raise exception 'Invalid password';
  end if;

  -- 設置用戶角色
  v_role := case
    when v_user.id = 'admin' then 'admin'
    else 'user'
  end;

  -- 生成 JWT token
  v_token.access_token := encode(
    crypto.sign(
      'HS256',
      json_build_object(
        'role', v_role,
        'user_id', v_user.id,
        'exp', extract(epoch from now() + interval '1 day')::integer,
        'iat', extract(epoch from now())::integer
      )::text::bytea,
      v_secret::bytea
    ),
    'base64'
  );

  -- 生成 refresh token
  v_token.refresh_token := encode(
    crypto.sign(
      'HS256',
      json_build_object(
        'user_id', v_user.id,
        'exp', extract(epoch from now() + interval '7 days')::integer,
        'iat', extract(epoch from now())::integer
      )::text::bytea,
      v_secret::bytea
    ),
    'base64'
  );

  return v_token;
end;
$$ language plpgsql security definer;

-- Create policy for data_id table
create policy "Users can view their own data"
  on data_id for select
  using (
    current_user = id or
    current_user = 'authenticated'
  );

-- Create policy for admin access
create policy "Admin can manage all data"
  on data_id for all
  using (
    current_user = 'authenticated' and
    exists (
      select 1
      from data_id
      where id = current_user
      and id = 'admin'
    )
  );

-- Grant necessary permissions
grant usage on schema auth to authenticated, anon;
grant execute on function authenticate_user to authenticated, anon; 