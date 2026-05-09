begin;

alter table public.pipeline_stages
add column if not exists description text;

commit;