// Notifications push de l'app LF Coaching.
// - mode "cron" (appel quotidien par pg_cron, en-tête x-lf-cle) : envoie UNE notification groupée par élève
//   avec ce qui est nouveau, en respectant ses réglages (types, fréquence). Plafond : 1 par jour (ou 1 par semaine).
// - mode "test" (appel depuis la page Paramètres, jeton de l'utilisateur connecté) : notification test sur son téléphone.
// Les clés VAPID sont dans le coffre Supabase (vault), lues par la fonction lf_secrets() réservée au service.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-lf-cle", "Content-Type": "application/json" };
const rep = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: CORS });
const HEURES: Record<string, number> = { jour: 20, semaine: 6.5 * 24 };

async function envoyer(email: string, sub: unknown, charge: Record<string, unknown>) {
  try {
    await webpush.sendNotification(sub as webpush.PushSubscription, JSON.stringify(charge), { TTL: 86400 });
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await sb.from("reglages").update({ push: null }).eq("email", email); // abonnement expiré
    console.log("push refusé", email.replace(/(.).*@/, "$1…@"), code);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return rep({});
  const s = (await sb.rpc("lf_secrets")).data as Record<string, string> | null;
  if (!s?.lf_vapid_prive) return rep({ erreur: "clés absentes" }, 500);
  webpush.setVapidDetails(s.lf_vapid_sujet, s.lf_vapid_public, s.lf_vapid_prive);
  const corps = await req.json().catch(() => ({}));

  if (corps.mode === "test") {
    const jeton = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
    const u = (await sb.auth.getUser(jeton)).data.user;
    if (!u?.email) return rep({ erreur: "non connecté" }, 401);
    const r = (await sb.from("reglages").select("push").eq("email", u.email.toLowerCase()).maybeSingle()).data;
    if (!r?.push) return rep({ ok: false, raison: "pas d'abonnement" });
    const ok = await envoyer(u.email.toLowerCase(), r.push, { titre: "LF Coaching", texte: "C'est bon, les notifications marchent sur ce téléphone.", lien: "#notifs" });
    return rep({ ok });
  }

  if (req.headers.get("x-lf-cle") !== s.lf_cron_cle) return rep({ erreur: "refusé" }, 403);
  const depuis = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ data: notifs }, { data: regs }] = await Promise.all([
    sb.from("notifs").select("id,email,type,titre,lien,push_le,lue_le,cree_le").gte("cree_le", depuis),
    sb.from("reglages").select("email,types,frequence,push").not("push", "is", null),
  ]);
  let envoyes = 0;
  for (const r of regs || []) {
    if (r.frequence === "app") continue;
    const siens = (notifs || []).filter((n) => n.email === r.email);
    const dernier = Math.max(0, ...siens.filter((n) => n.push_le).map((n) => Date.parse(n.push_le)));
    if (Date.now() - dernier < (HEURES[r.frequence] || 20) * 36e5) continue; // plafond
    const a = siens.filter((n) => !n.push_le && !n.lue_le && (r.types || {})[n.type] !== false);
    if (!a.length) continue;
    const texte = a.length === 1 ? a[0].titre : a.length + " nouveautés : " + a.slice(0, 3).map((n) => n.titre).join(" · ") + (a.length > 3 ? "…" : "");
    const ok = await envoyer(r.email, r.push, { titre: "LF Coaching", texte, lien: a.length === 1 && a[0].lien ? a[0].lien : "#notifs" });
    if (ok) { envoyes++; await sb.from("notifs").update({ push_le: new Date().toISOString() }).in("id", a.map((n) => n.id)); }
  }
  return rep({ ok: true, envoyes });
});
