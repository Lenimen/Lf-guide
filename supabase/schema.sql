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

-- 26/11 : étapes « Démarrer » déjà faites, cochées par le coach
alter table public.eleves add column if not exists etapes_faites text[] not null default '{}';
alter table public.eleves add column if not exists lien_contrat text check (lien_contrat is null or lien_contrat ~ '^https://(docuseal\.(com|eu|co)|[a-z0-9.-]*docuseal[a-z0-9.-]*)/'); -- lien de signature DocuSeal collé par Leni (bouton « Signer mon contrat »)

-- 26/11 : statistiques anonymes (ajout par tous, lecture coach seulement, aucune donnée personnelle)
create table if not exists public.stats(
  id bigint generated always as identity primary key,
  quand timestamptz not null default now(),
  type text not null check (type in ('visite','vue','clic')),
  cible text not null check (length(cible)<=40),
  source text check (length(source)<=40),
  role text check (role in ('visiteur','eleve','coach','ouvert'))
);
alter table public.stats enable row level security;
drop policy if exists stats_ajout on public.stats;
create policy stats_ajout on public.stats for insert to anon, authenticated with check (true);
drop policy if exists stats_coach on public.stats;
create policy stats_coach on public.stats for select to authenticated using (public.mon_role()='coach');
grant insert on public.stats to anon, authenticated;
grant select on public.stats to authenticated;

-- ===== Étapes « Démarrer », notifications, réglages (26/11/2026) =====
-- etapes_eleve : coches de l'élève (par eleve/auto), de Leni (coach) ou de la vérification du soir (verif, avec message + lien).
create table if not exists public.etapes_eleve(
  email text not null, etape text not null check (length(etape)<=20),
  coche boolean not null default true,
  par text not null default 'eleve' check (par in ('eleve','auto','coach','verif')),
  quand timestamptz not null default now(),
  message text check (length(message)<=300),
  lien text check (lien is null or lien ~ '^https://'),
  primary key (email, etape));
-- RLS : l'élève lit/écrit ses lignes (par eleve/auto, sans message), le coach tout.

-- notifs : centre de notifications. Une seule relance par étape = clé unique (email, cle).
create table if not exists public.notifs(
  id bigserial primary key, email text not null,
  type text not null check (type in ('etape','leni','formation')),
  cle text check (length(cle)<=40), titre text not null check (length(titre)<=80),
  texte text check (length(texte)<=500), lien text check (lien is null or lien ~ '^(https://|#)'),
  cree_le timestamptz not null default now(), lue_le timestamptz, push_le timestamptz,
  unique (email, cle));
-- RLS : l'élève lit les siennes et ne peut modifier que lue_le (grant update (lue_le)) ; le coach tout.

-- reglages : types de notifications, fréquence (jour = 1 par jour max, semaine, app = pas de push), abonnement push.
create table if not exists public.reglages(
  email text primary key,
  types jsonb not null default '{"etape":true,"leni":true,"formation":true}',
  frequence text not null default 'jour' check (frequence in ('jour','semaine','app')),
  push jsonb, maj_le timestamptz not null default now());

-- Clés VAPID et clé du cron : dans le coffre (vault), noms lf_vapid_prive, lf_vapid_public, lf_vapid_sujet, lf_cron_cle.
-- lf_secrets() (security definer, service_role seulement) les donne à la fonction notifs-push.
-- lf_relances() : chaque jour 16:40 UTC, relance la prochaine étape après 3 jours sans avancer (élèves ayant ouvert l'app)
--                 et annonce les nouveaux modules de formation le jour de leur sortie.
-- pg_cron : 'lf-relances' (40 16 * * *) puis 'lf-notifs-push' (0 17 * * *, net.http_post vers functions/v1/notifs-push).
-- Vérification des contrats DocuSeal : tâche planifiée Claude, 17:23 heure de Bruxelles.

-- ===== Formation (26/11/2026) =====
-- formation_eleve(email, module, fait_le, envoye_le, vu_le) : modules terminés (recopiés depuis le téléphone de l'élève).
-- formation_envois(id, email, lecon, texte, envoye_le, vu_le) : « Envoyer à Leni » ; liste « À revoir » de l'espace coach.
-- lf_envoi_exercice(p_lecon, p_texte) (security definer, élève) : enregistre l'envoi et crée une notification pour le coach (type 'eleve').
-- lf_relances() : relance d'étape (jamais « start » ni « video »), nouveaux modules, et avis sur le coaching
--   (fenêtres 3e semaine, mi-parcours, 3 semaines avant la fin, calculées sur date_debut et duree_sem).
