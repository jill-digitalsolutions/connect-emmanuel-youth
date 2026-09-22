-- RLS policies only restrict rows; the `authenticated` role also needs the
-- base SQL-level table grants that Supabase's dashboard normally issues
-- automatically when tables are created through its UI. Since these tables
-- were created via raw SQL, that step never happened.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Any tables added in the future also get these grants automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
