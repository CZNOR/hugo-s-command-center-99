-- RLS : la base n'est lisible et modifiable que par les fonctions Vercel de l'app.
-- Elles envoient l'en-tête x-server-key (variable SUPABASE_SERVER_KEY) ;
-- seule son empreinte SHA-256 est stockée ici. La clé anon seule ne lit plus rien.
create or replace function public.is_app_server() returns boolean
language sql stable as $$
  select coalesce(
    encode(extensions.digest(current_setting('request.headers', true)::json->>'x-server-key', 'sha256'), 'hex')
      = 'fab6046e6aa2862f846574fe31d46bcc0c6f3bca5b611d3af0021613b1b44dd0',
    false)
$$;

do $$
declare t text; p record;
begin
  for p in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy app_server on public.%I for all to anon using (public.is_app_server()) with check (public.is_app_server())', t);
  end loop;
end $$;
