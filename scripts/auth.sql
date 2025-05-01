-- Enable RLS
alter table data_id enable row level security;

-- Create auth schema if not exists
create schema if not exists auth;

-- Create function to handle user authentication
create or replace function auth.handle_new_user()
returns trigger as $$
begin
  -- Extract user ID from email
  declare
    user_id text;
  begin
    user_id := split_part(new.email, '@', 1);
    
    -- Check if user exists in data_id table
    if exists (select 1 from public.data_id where id = user_id) then
      return new;
    else
      raise exception 'User not found in data_id table';
    end if;
  end;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure auth.handle_new_user();

-- Create policy for data_id table
create policy "Users can view their own data"
  on data_id for select
  using (
    auth.uid() in (
      select id::uuid
      from auth.users
      where email = concat(id, '@pennine.com')
    )
  );

-- Create policy for admin access
create policy "Admin can view all data"
  on data_id for all
  using (
    auth.uid() in (
      select id::uuid
      from auth.users
      where email = 'admin@pennine.com'
    )
  ); 