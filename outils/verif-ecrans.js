/* Vérification avant chaque mise en ligne de l'app : capture chaque vue en largeur iPhone
   (390 et 320 px), iPad (820 px) et ordinateur (1280 px), en visiteur, en élève et en coach (données fictives), et signale :
   - un débordement horizontal de la page ;
   - un élément qui sort de sa carte ou de sa colonne (champ date, select, image...) ;
   - une classe d'en-tête global (.top) réutilisée dans une vue ;
   - une sous-page (ou un sous-écran d'onglet) sans flèche retour en haut ;
   - une page qui ne s'ouvre pas tout en haut, ou un texte caché sous l'en-tête fixe.
   Usage : node outils/verif-ecrans.js [dossier-captures] [dossier-fiches]
   (sert app/ sur le port 8768). Sortie non nulle s'il y a un problème. */
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const APP=path.join(__dirname,'..','app');const OUT=process.argv[2]||'captures';const FICHES=process.argv[3]||'';
fs.mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.css':'text/css'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);let f=u.startsWith('/guides/')?path.join(APP,'..',u.slice(8)):path.join(APP,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8768);
const contenus={};if(FICHES&&fs.existsSync(FICHES))fs.readdirSync(FICHES).filter(f=>f.endsWith('.html')).forEach(f=>contenus['fiche-'+f]=fs.readFileSync(path.join(FICHES,f),'utf8'));
const ELEVES=[{email:'eleve.avec.un.long.email@exemple.com',prenom:'Maximilien',date_debut:null,duree_sem:26,lien_suivi:null,actif:true},{email:'b@exemple.com',prenom:'Noah',date_debut:'2026-06-29',duree_sem:26,lien_suivi:'https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit',actif:true}];
function faux(contenus,eleves){
  function q(t){var f={t:t,cle:null};var o={select:()=>o,order:()=>o,like:()=>o,upsert:()=>o,update:()=>o,insert:()=>o,in:()=>o,not:()=>o,gte:()=>o,limit:()=>o,
    eq:(k,v)=>{if(k==='cle')f.cle=v;return o},maybeSingle:()=>{f.one=1;return o},
    then:(ok,ko)=>Promise.resolve(t==='notifs'?{data:[{id:1,type:'etape',titre:'Ton contrat n\'est pas encore signé',texte:'Cherche l\'e-mail de DocuSeal, vérifie aussi tes spams. Une fois signé, recoche l\'étape.',lien:'https://wa.me/32488870608',cree_le:new Date().toISOString(),lue_le:null},{id:2,type:'leni',titre:'Pense à ta photo de face demain matin',texte:null,lien:null,cree_le:'2026-11-20T10:00:00Z',lue_le:'2026-11-21T10:00:00Z'}]}:t==='etapes_eleve'?{data:[{email:'b@exemple.com',etape:'contrat',coche:false,par:'verif',quand:'2026-11-25T18:00:00Z',message:'Ton contrat n\'est pas encore signé sur DocuSeal.',lien:'https://wa.me/32488870608'},{email:'b@exemple.com',etape:'start',coche:true,par:'eleve',quand:'2026-11-24T18:00:00Z'}]}:t==='eleves'?{data:eleves}:t==='contenus'?(f.one?(contenus[f.cle]?{data:{mime:'text/html',donnees:contenus[f.cle],base64:false}}:{data:null}):{data:Object.keys(contenus).map(k=>({cle:k}))}):{data:[]}).then(ok,ko)};return o}
  return {from:q,functions:{invoke:()=>Promise.resolve({data:{ok:true}})},auth:{signOut:()=>Promise.resolve(),onAuthStateChange:()=>{}}};
}
const ROLES={visiteur:['accueil','appel','guides','contact','connexion','mensurations','potentiel','posing'],eleve:['demarrer','formation','ressources','bikini','echauffement','parrainage','tuto','vacuum','cheatmeals','notifs','parametres'],coach:['coach','notifs']};
(async()=>{const b=await chromium.launch();let pb=0;const log=m=>{console.log(m)};
for(const w of [390,320,820,1280]){
  const p=await b.newPage({viewport:{width:w,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message+(process.env.PILE?' @ '+(e.stack||'').split('\n').slice(1,3).join(' '):'')));
  await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'..','academy.html'),'utf8')}));
  await p.goto('http://localhost:8768/');await p.waitForTimeout(800);
  for(const role of Object.keys(ROLES)){
    await p.evaluate(([role,contenus,eleves,fx])=>{window.sb=eval('('+fx+')')(contenus,eleves);sb=window.sb;MOI.role=role;MOI.email=role==='visiteur'?null:'x@exemple.com';MOI.eleve=role==='eleve'?{prenom:'Test'}:null;document.body.dataset.role=role;if(window.appliquerRole)appliquerRole()},[role,contenus,ELEVES,faux.toString()]);
    for(const v of ROLES[role]){
      await p.evaluate(v=>{location.hash='#'+v;route()},v);await p.waitForTimeout(500);if(v==='coach')await p.evaluate(()=>document.querySelectorAll('#co-list details').forEach(d=>d.open=true));
      const pbs=await p.evaluate((v)=>{const out=[];
        if(['accueil','appel','demarrer','formation','ressources','coach'].indexOf(v)<0&&document.getElementById('retour').hidden)out.push('pas de flèche retour sur une sous-page');
        if(document.body.dataset.vue!==v)out.push('la vue affichée est « '+document.body.dataset.vue+' » au lieu de « '+v+' »');const W=document.documentElement.clientWidth;
        const pill=document.getElementById('who-link').textContent.trim(),attendu={visiteur:'Se connecter',eleve:'Test',coach:'Coach'}[document.body.dataset.role];
        if(attendu&&pill!==attendu)out.push('bouton du haut « '+pill+' » au lieu de « '+attendu+' » ('+document.body.dataset.role+')');
        if(window.scrollY>0)out.push('la page ne s\'ouvre pas tout en haut (défilée de '+Math.round(window.scrollY)+' px)');
        const hb=document.querySelector('.top').getBoundingClientRect().bottom;
        const v0=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);
        if(v0)[...v0.querySelectorAll('h1,h2,h3,p,.eyebrow,a,button,label')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden').slice(0,6).forEach(e=>{const t=e.getBoundingClientRect().top;if(t<hb-1)out.push('texte recouvert par l\'en-tête : « '+(e.textContent||'').trim().slice(0,30)+' »')});
        if(document.documentElement.scrollWidth>W+1)out.push('page plus large que l\'écran ('+document.documentElement.scrollWidth+' px)');
        const vue=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);if(!vue)return ['aucune vue visible'];
        vue.querySelectorAll('.top').forEach(t=>{if(!t.closest('#lfa'))out.push('classe .top (en-tête global) utilisée dans la vue')});
        vue.querySelectorAll('input,select,textarea,img,button,.card,.etape,table').forEach(el=>{const r=el.getBoundingClientRect();if(!r.width)return;
          let par=el.parentElement;while(par&&par!==vue&&getComputedStyle(par).overflowX==='visible'&&!par.classList.contains('card'))par=par.parentElement;
          if(!par||el.closest('.tbl'))return;if(par!==vue&&!par.classList.contains('card')&&getComputedStyle(par).overflowX!=='visible')return;const pr=par.getBoundingClientRect();
          if(r.right>pr.right+1||r.left<pr.left-1)out.push((el.tagName.toLowerCase()+(el.type?'['+el.type+']':'')+' '+(el.className||'')).trim()+' déborde de '+(par.className||par.tagName));});
        return [...new Set(out)]},v);
      const nom=w+'-'+role+'-'+v;await p.screenshot({path:path.join(OUT,nom+'.png'),fullPage:true});
      /* sous-états d'un onglet : module de formation ouvert, réservation de créneau → flèche retour obligatoire, et elle ramène au niveau 1 */
      const sous={formation:'#lf-root [data-mod]',appel:'[data-motif]'}[v];
      if(sous&&await p.$(sous)){await p.click(sous);await p.waitForTimeout(300);
        const r=await p.evaluate(async()=>{const o=[];if(document.getElementById('retour').hidden)o.push('pas de flèche retour dans le sous-écran');else{document.getElementById('retour').click();await new Promise(r=>setTimeout(r,150));if(!document.getElementById('retour').hidden)o.push('la flèche retour ne ramène pas à l\'onglet')}return o});
        await p.waitForTimeout(200);pbs.push(...r.map(x=>x+' ('+v+')'));}
      if(pbs.length){pb++;log('✗ '+nom+' : '+pbs.join(' ; '))}else log('✓ '+nom);
    }
  }
  if(errs.length){pb++;log('✗ erreurs JS ('+w+') : '+errs.join(' | '))}
  await p.close();
}
await b.close();srv.close();process.exit(pb?1:0)})();
