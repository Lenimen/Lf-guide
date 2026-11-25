-- LF Coaching : comptes de l'app (visiteur / élève / coach).
-- À coller UNE fois dans Supabase › SQL Editor › New query › Run. Le script peut être relancé sans casse.
-- Aucune donnée sensible : e-mail, prénom, date de début, durée du suivi.

-- 1. Les coachs (Leni). Remplacer/ajouter l'e-mail de connexion de Leni si besoin.
create table if not exists public.coachs (
  email text primary key check (email = lower(email))
);
insert into public.coachs(email) values ('leni@thelfmethod.com') on conflict do nothing;

-- 2. Les élèves autorisés (créés par le coach dans l'app).
create table if not exists public.eleves (
  email       text primary key check (email = lower(email)),
  prenom      text not null check (char_length(prenom) between 1 and 60),
  date_debut  date,
  duree_sem   int  not null default 26 check (duree_sem between 4 and 104),
  actif       boolean not null default true,
  cree_le     timestamptz not null default now(),
  lien_suivi  text check (lien_suivi is null or lien_suivi ~ '^https://')
);

alter table public.eleves add column if not exists lien_suivi text check (lien_suivi is null or lien_suivi ~ '^https://');

-- 3. Le statut de la personne connectée, calculé à chaque requête (rien à synchroniser).
create or replace function public.mon_role() returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from coachs where email = lower(auth.jwt()->>'email')) then 'coach'
    when exists (select 1 from eleves where email = lower(auth.jwt()->>'email') and actif) then 'eleve'
    else 'visiteur' end
$$;
revoke all on function public.mon_role() from public;
grant execute on function public.mon_role() to authenticated;

-- 4. Droits (RLS) : un élève ne voit que sa ligne, le coach voit et modifie tout, un visiteur rien.
alter table public.coachs enable row level security;
alter table public.eleves enable row level security;
drop policy if exists coachs_lecture on public.coachs;
create policy coachs_lecture on public.coachs for select to authenticated using (public.mon_role() = 'coach');
drop policy if exists eleves_soi on public.eleves;
create policy eleves_soi on public.eleves for select to authenticated
  using (email = lower(auth.jwt()->>'email') or public.mon_role() = 'coach');
drop policy if exists eleves_coach_ajout on public.eleves;
create policy eleves_coach_ajout on public.eleves for insert to authenticated with check (public.mon_role() = 'coach');
drop policy if exists eleves_coach_modif on public.eleves;
create policy eleves_coach_modif on public.eleves for update to authenticated
  using (public.mon_role() = 'coach') with check (public.mon_role() = 'coach');
drop policy if exists eleves_coach_suppr on public.eleves;
create policy eleves_coach_suppr on public.eleves for delete to authenticated using (public.mon_role() = 'coach');
revoke all on public.coachs, public.eleves from anon;

-- 5. Contenus privés de l'espace élève (liens élèves, guide bikini, fiches PDF, images).
--    Rangés en base (pas en fichiers) pour pouvoir être déposés par Claude via le connecteur.
create table if not exists public.contenus (
  cle     text primary key,
  mime    text not null,
  donnees text not null,          -- texte brut (json, html) ou base64 (pdf, images)
  base64  boolean not null default false,
  maj_le  timestamptz not null default now()
);
alter table public.contenus enable row level security;
drop policy if exists contenus_lecture on public.contenus;
create policy contenus_lecture on public.contenus for select to authenticated
  using (public.mon_role() in ('eleve','coach'));
drop policy if exists contenus_coach on public.contenus;
create policy contenus_coach on public.contenus for all to authenticated
  using (public.mon_role() = 'coach') with check (public.mon_role() = 'coach');
revoke all on public.contenus from anon;
