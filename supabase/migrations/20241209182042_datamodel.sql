create table submissions (
  id uuid not null primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  secret_key text not null,
  text text not null
);

create unique index submissions_secret_key_idx on submissions (secret_key);

create table messages (
  id uuid not null primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  text text not null,
  from_submission_id uuid references submissions not null,
  to_submission_id uuid references submissions not null
);

-- from https://github.com/orgs/supabase/discussions/4547
REVOKE ALL PRIVILEGES ON DATABASE "postgres" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "storage" FROM "anon";
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;
