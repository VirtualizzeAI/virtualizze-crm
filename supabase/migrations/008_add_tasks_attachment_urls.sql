alter table public.tasks
add column if not exists attachment_urls text[] not null default '{}';
