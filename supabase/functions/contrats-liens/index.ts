// Liens de signature des contrats (DocuSeal) pour le bouton « Signer mon contrat » de l'app.
// Appel quotidien par pg_cron (en-tête x-lf-cle), juste avant la vérification des contrats de 17:23.
// Pour chaque élève actif : cherche ses signataires DocuSeal par e-mail (GET /submitters?q=),
//  - contrat pas encore signé → eleves.lien_contrat = https://docuseal.com/s/{slug}
//  - contrat signé → lien effacé (le bouton disparaît).
// La clé API DocuSeal est un secret de la fonction (DOCUSEAL_API_KEY), posé par Leni dans le tableau de bord Supabase.
// Le champ manuel de l'espace coach reste en secours : un lien collé par Leni n'est remplacé que par un lien DocuSeal plus récent.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CLE = Deno.env.get("DOCUSEAL_API_KEY") || "";
const API = (Deno.env.get("DOCUSEAL_API_URL") || "https://api.docuseal.com").replace(/\/$/, "");
const SITE = API.includes("docuseal.eu") ? "https://docuseal.eu" : "https://docuseal.com";
const rep = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

type Signataire = { email?: string; slug?: string; status?: string; completed_at?: string | null; created_at?: string };

Deno.serve(async (req) => {
  const s = (await sb.rpc("lf_secrets")).data as Record<string, string> | null;
  if (!s?.lf_cron_cle || req.headers.get("x-lf-cle") !== s.lf_cron_cle) return rep({ erreur: "refusé" }, 403);
  if (!CLE) return rep({ ok: false, raison: "clé DocuSeal absente (secret DOCUSEAL_API_KEY)" });

  const { data: eleves } = await sb.from("eleves").select("email,lien_contrat").eq("actif", true);
  let poses = 0, effaces = 0, erreurs = 0;
  for (const e of eleves || []) {
    const r = await fetch(`${API}/submitters?q=${encodeURIComponent(e.email)}&limit=20`, { headers: { "X-Auth-Token": CLE } });
    if (!r.ok) { erreurs++; if (r.status === 401) return rep({ ok: false, raison: "clé DocuSeal refusée" }); continue; }
    const j = await r.json();
    const l: Signataire[] = (Array.isArray(j) ? j : j.data || []).filter((x: Signataire) => (x.email || "").toLowerCase() === e.email);
    if (!l.length) continue;
    l.sort((a, b) => Date.parse(b.created_at || "0") - Date.parse(a.created_at || "0"));
    const signe = l.some((x) => x.status === "completed");
    const attente = l.find((x) => x.status !== "completed" && x.status !== "declined" && x.slug);
    if (signe && !attente) {
      if (e.lien_contrat) { await sb.from("eleves").update({ lien_contrat: null }).eq("email", e.email); effaces++; }
    } else if (attente) {
      const lien = `${SITE}/s/${attente.slug}`;
      if (e.lien_contrat !== lien) { await sb.from("eleves").update({ lien_contrat: lien }).eq("email", e.email); poses++; }
    }
  }
  return rep({ ok: true, eleves: (eleves || []).length, poses, effaces, erreurs });
});
