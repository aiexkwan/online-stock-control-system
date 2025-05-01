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
  v_token.access_token := sign(
    json_build_object(
      'role', v_role,
      'user_id', v_user.id,
      'exp', extract(epoch from now() + interval '1 day')::integer
    ),
    current_setting('app.jwt_secret')
  );

  -- 生成 refresh token
  v_token.refresh_token := sign(
    json_build_object(
      'user_id', v_user.id,
      'exp', extract(epoch from now() + interval '7 days')::integer
    ),
    current_setting('app.jwt_secret')
  );

  return v_token;
end;
$$ language plpgsql security definer;

-- Create policy for data_id table
create policy "Users can view their own data"
  on data_id for select
  using (
    auth.uid()::text = id or
    auth.jwt_claim('role')::text = 'admin'
  );

-- Create policy for admin access
create policy "Admin can manage all data"
  on data_id for all
  using (
    auth.jwt_claim('role')::text = 'admin'
  ); 