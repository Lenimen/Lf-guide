/* Vérification avant chaque mise en ligne de l'app : capture chaque vue en largeur iPhone
   (390 et 320 px), iPad (820 px), ordinateur (1280 px) et app installée sur iPhone (encoche simulée), en visiteur, en élève et en coach (données fictives), et signale :
   - un débordement horizontal de la page ;
   - un élément qui sort de sa carte ou de sa colonne (champ date, select, image...) ;
   - une classe d'en-tête global (.top) réutilisée dans une vue ;
   - une sous-page (ou un sous-écran d'onglet) sans flèche retour en haut ;
   - une page qui ne s'ouvre pas tout en haut, ou un texte caché sous l'en-tête fixe.
   - des blocs collés, un titre trop près du cadre au-dessus, ou une lueur claire qui déborde sur un titre ;
   - chez un élève : un texte destiné aux visiteurs (« gratuit », « Réserver un appel », « Deviens un athlète »).
   Usage : node outils/verif-ecrans.js [dossier-captures] [dossier-fiches]
   (sert app/ sur le port 8768). Sortie non nulle s'il y a un problème. */
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const APP=path.join(__dirname,'..','app');const OUT=process.argv[2]||'captures';const FICHES=process.argv[3]||'';
fs.mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.css':'text/css'};
/* ?encoche=47 : simule l'app installée sur iPhone (zone de l'encoche en haut), invisible dans un navigateur normal */
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const enc=(q.url.match(/[?&]encoche=(\d+)/)||[])[1];let f=u.startsWith('/guides/')?path.join(APP,'..',u.slice(8)):path.join(APP,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}if(enc&&f.endsWith('.html'))d=String(d).replace(/env\(safe-area-inset-top(,\s*0px)?\)/g,enc+'px');r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8768);
const contenus={};if(FICHES&&fs.existsSync(FICHES))fs.readdirSync(FICHES).filter(f=>f.endsWith('.html')).forEach(f=>contenus['fiche-'+f]=fs.readFileSync(path.join(FICHES,f),'utf8'));
const ELEVES=[{email:'eleve.avec.un.long.email@exemple.com',prenom:'Maximilien',date_debut:null,duree_sem:26,lien_suivi:null,actif:true},{email:'b@exemple.com',prenom:'Noah',date_debut:'2026-06-29',duree_sem:26,lien_suivi:'https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit',actif:true}];
function faux(contenus,eleves){
  function q(t){var f={t:t,cle:null};var o={select:()=>o,order:()=>o,like:()=>o,upsert:()=>o,update:()=>o,insert:()=>o,in:()=>o,is:()=>o,not:()=>o,gte:()=>o,limit:()=>o,
    eq:(k,v)=>{if(k==='cle')f.cle=v;return o},maybeSingle:()=>{f.one=1;return o},
    then:(ok,ko)=>Promise.resolve(t==='prepa_etapes'?{data:[{id:1,email:'b@exemple.com',jour:'2026-12-01',titre:'Appel de construction de la prépa',detail:null,scene:false,fait:true},{id:2,email:'b@exemple.com',jour:'2027-01-05',titre:'Début de la sèche',detail:'Bilans toutes les semaines, photos le lundi.',scene:false,fait:false},{id:3,email:'b@exemple.com',jour:'2027-05-15',titre:'WNBF Belgique',detail:null,scene:true,fait:false}]}:t==='paiements'?{data:[{id:1,email:'b@exemple.com',echeance:'2026-10-12',montant:400,moyen:'stripe',paye_le:'2026-10-12',lien:null},{id:2,email:'b@exemple.com',echeance:'2026-11-12',montant:400,moyen:'wero',paye_le:null,lien:null},{id:3,email:'b@exemple.com',echeance:'2026-12-12',montant:400,moyen:'stripe',paye_le:null,lien:'https://buy.stripe.com/test_exemple'}]}:t==='formation_envois'?{data:[{id:1,email:'b@exemple.com',lecon:'C01.4',texte:'Contexte : mardi, séance Legs.\nObservation : la presse était prise.',envoye_le:'2026-11-25T18:00:00Z',vu_le:null}]}:t==='notifs'?{data:[{id:1,type:'etape',titre:'Ton contrat n\'est pas encore signé',texte:'Cherche l\'e-mail de DocuSeal, vérifie aussi tes spams. Une fois signé, recoche l\'étape.',lien:'https://wa.me/32488870608',cree_le:new Date().toISOString(),lue_le:null},{id:2,type:'leni',titre:'Pense à ta photo de face demain matin',texte:null,lien:null,cree_le:'2026-11-20T10:00:00Z',lue_le:'2026-11-21T10:00:00Z'}]}:t==='etapes_eleve'?{data:[{email:'b@exemple.com',etape:'contrat',coche:false,par:'verif',quand:'2026-11-25T18:00:00Z',message:'Ton contrat n\'est pas encore signé sur DocuSeal.',lien:'https://wa.me/32488870608'},{email:'b@exemple.com',etape:'start',coche:true,par:'eleve',quand:'2026-11-24T18:00:00Z'}]}:t==='eleves'?{data:eleves}:t==='contenus'?(f.one?(contenus[f.cle]?{data:{mime:'text/html',donnees:contenus[f.cle],base64:false}}:{data:null}):{data:Object.keys(contenus).map(k=>({cle:k}))}):{data:[]}).then(ok,ko)};return o}
  return {from:q,functions:{invoke:()=>Promise.resolve({data:{ok:true}})},auth:{signOut:()=>Promise.resolve(),onAuthStateChange:()=>{}}};
}
const ROLES={visiteur:['accueil','appel','guides','contact','connexion','mensurations','potentiel','posing'],eleve:['accueil','prepa','paiements','demarrer','formation','ressources','bikini','echauffement','parrainage','tuto','vacuum','cheatmeals','notifs','parametres'],coach:['coach','notifs']};
(async()=>{const b=await chromium.launch();let pb=0;const log=m=>{console.log(m)};
/* Mise à jour : le service worker doit revalider les pages (GitHub Pages met max-age=600, sinon l'ancienne version reste 10 min) */
if(!/cache:'no-cache'/.test(fs.readFileSync(path.join(APP,'sw.js'),'utf8'))){pb++;log('✗ sw.js : les pages ne sont pas revalidées (cache:\'no-cache\' manquant), une mise en ligne peut rester invisible 10 min')}else log('✓ sw.js revalide les pages à chaque ouverture');
for(const w of [390,320,820,1280,1920,2560,'390-app-installee']){
  const W=parseInt(w),ENC=typeof w==='string';
  const p=await b.newPage({viewport:{width:W,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message+(process.env.PILE?' @ '+(e.stack||'').split('\n').slice(1,3).join(' '):'')));
  await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'..','academy.html'),'utf8')}));
  await p.goto('http://localhost:8768/'+(ENC?'?encoche=47':''));await p.waitForTimeout(800);
  for(const role of Object.keys(ROLES)){
    await p.evaluate(([role,contenus,eleves,fx])=>{window.sb=eval('('+fx+')')(contenus,eleves);sb=window.sb;MOI.role=role;MOI.email=role==='visiteur'?null:'x@exemple.com';MOI.eleve=role==='eleve'?{prenom:'Test',lien_contrat:'https://docuseal.com/s/exemple'}:null;document.body.dataset.role=role;if(window.appliquerRole)appliquerRole()},[role,contenus,ELEVES,faux.toString()]);
    for(const v of ROLES[role]){
      await p.evaluate(v=>{location.hash='#'+v;route()},v);await p.waitForTimeout(500);if(v==='coach')await p.evaluate(()=>document.querySelectorAll('#co-list details').forEach(d=>d.open=true));
      const pbs=await p.evaluate((v)=>{const out=[];
        if(['accueil','appel','demarrer','formation','ressources','coach'].indexOf(v)<0&&document.getElementById('retour').hidden)out.push('pas de flèche retour sur une sous-page');
        if(document.body.dataset.vue!==v)out.push('la vue affichée est « '+document.body.dataset.vue+' » au lieu de « '+v+' »');const W=document.documentElement.clientWidth;
        const pill=document.getElementById('who-link').textContent.trim(),attendu={visiteur:'Se connecter',eleve:'Test',coach:'Coach'}[document.body.dataset.role];
        if(attendu&&pill!==attendu)out.push('bouton du haut « '+pill+' » au lieu de « '+attendu+' » ('+document.body.dataset.role+')');
        /* style unique : rien de l'ancienne Academy (bordures épaisses, coins carrés, Verdana) */
        document.querySelectorAll('#lfa *').forEach(e=>{if(!e.getBoundingClientRect().width)return;const c=getComputedStyle(e);
          if(['Top','Right','Bottom','Left'].some(k=>parseFloat(c['border'+k+'Width'])>=2&&c['border'+k+'Style']!=='none'))out.push('style ancienne Academy : bordure épaisse ('+(e.className||e.tagName)+')');
          if(/verdana/i.test(c.fontFamily))out.push('style ancienne Academy : police Verdana ('+(e.className||e.tagName)+')');
          if(e.matches('.screen,.case,.end,.out,.who,.check,.toc,.btn,textarea,input')&&parseFloat(c.borderTopLeftRadius)<6)out.push('style ancienne Academy : coin carré ('+(e.className||e.tagName)+')');});
        /* texte d'aide ou attribut coupé (apostrophe non échappée) */
        const OK=/^(id|class|style|href|src|alt|type|name|value|placeholder|data-[\w-]+|aria-[\w-]+|role|title|target|rel|for|checked|disabled|hidden|maxlength|minlength|min|max|step|rows|cols|autocomplete|inputmode|width|height|loading|fetchpriority|accept|multiple|required|pattern|novalidate|tabindex|lang|controls|playsinline|preload|poster|muted|allow|allowfullscreen|frameborder|open|selected|readonly|spellcheck|enterkeyhint|draggable|dir|viewbox|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)$/i;
        document.querySelectorAll('main.view:not([hidden]) :is(input,textarea,select,a,button,label,img,iframe,video)').forEach(e=>{[...e.attributes].forEach(at=>{if(!OK.test(at.name))out.push('attribut cassé « '+at.name+' » sur '+e.tagName.toLowerCase()+' (texte d\'aide coupé ?)')})});
        if(window.scrollY>0)out.push('la page ne s\'ouvre pas tout en haut (défilée de '+Math.round(window.scrollY)+' px)');
        const hb=document.querySelector('.top').getBoundingClientRect().bottom;
        const v0=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);
        if(v0)[...v0.querySelectorAll('h1,h2,h3,p,.eyebrow,a,button,label')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden').slice(0,6).forEach(e=>{const t=e.getBoundingClientRect().top;if(t<hb-1)out.push('texte recouvert par l\'en-tête : « '+(e.textContent||'').trim().slice(0,30)+' »')});
        /* espacement entre blocs : cartes collées, titre trop près du cadre au-dessus, lueur claire qui déborde sur un titre */
        if(v0){const B=[...v0.querySelectorAll('.card,.sec-head,.etape,figure,.page-head,.line')].filter(e=>{const r=e.getBoundingClientRect();return r.height&&r.width&&!e.parentElement.closest('.card,.line,.etape,.voile,#lfa,.co-cards')&&getComputedStyle(e).position!=='absolute'});
          const nom=e=>(e.querySelector('h1,h2,h3,.eyebrow,.fed,summary')||e).textContent.trim().replace(/\s+/g,' ').slice(0,28);
          for(let i=1;i<B.length;i++){const a=B[i-1],b=B[i];if(a.contains(b)||b.contains(a))continue;const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
            if(rb.left>=ra.right-1||rb.right<=ra.left+1||rb.top<ra.top)continue; // côte à côte (grille) : pas un empilement
            const g=rb.top-ra.bottom,mini=b.matches('.sec-head')?18:8;
            if(g<mini)out.push((b.matches('.sec-head')?'titre trop près du bloc au-dessus':'blocs collés')+' : « '+nom(a)+' » / « '+nom(b)+' » ('+Math.round(g)+' px)');
            if(b.matches('.sec-head,.page-head')){const sh=getComputedStyle(a).boxShadow;(sh.match(/rgba?\([^)]*\)[^,]*(?=,\s*rgba?|$)/g)||[]).forEach(o=>{const c=(o.match(/rgba?\(([^)]*)\)/)[1]).split(',').map(parseFloat),al=c.length>3?c[3]:1;if(/inset/.test(o)||al<.08||c[0]+c[1]+c[2]<450)return;
              const n=(o.replace(/rgba?\([^)]*\)/,'').match(/-?[\d.]+px/g)||[]).map(parseFloat),bas=(n[1]||0)+(n[3]||0)+(n[2]||0)*.6;if(bas>g)out.push('lueur claire de « '+nom(a)+' » qui déborde sur le titre « '+nom(b)+' »')})}}}
        /* la carte « Ton avis » ne demande jamais la date de début ni la durée (elles viennent de l'espace coach), quel que soit le rôle */
        if([...document.querySelectorAll('#satis-debut,#satis-duree,#satis-mod')].some(e=>e.offsetParent))out.push('la carte « Ton avis » demande la date de début ou la durée ('+document.body.dataset.role+')');
        /* « Démarrer » : l'élève ne peut pas cocher lui-même le contrat (DocuSeal seulement) ni la vidéo perso (Leni seulement) — bug Noah 26/11 */
        if(v==='paiements'){const pro=document.getElementById('pa-pro');if(!pro)out.push('prochaine échéance non affichée');else if(!/BE97 1030 8541 6349/.test(pro.textContent)||!/\+32 488 87 06 08/.test(pro.textContent)||!pro.querySelector('[data-pa-copy]'))out.push('échéance Wero/virement sans IBAN à copier (moyen habituel non affiché)')}
        if(document.querySelector('main.view:not([hidden]) a[href*="systeme.io/school"]'))out.push('lien vers l\'ancienne Academy Systeme.io (la formation est dans l\'app)');
        if(v==='coach'){const a=document.getElementById('co-act');if(!a||a.hidden)out.push('carte « Activité récente » absente de l\'espace coach')}
        if(v==='coach'){const k=document.getElementById('co-kpi');if(!k||k.hidden||k.querySelectorAll('button').length<4)out.push('indicateurs visuels absents en haut de l\'espace coach');if(!document.querySelector('#co-list .co-bars'))out.push('barres de progression absentes des fiches élèves')}
        {const vis=[...document.querySelectorAll('.tabs a')].filter(a=>getComputedStyle(a).display!=='none').map(a=>a.getAttribute('data-tab')||'vue-eleve');if(document.body.dataset.role==='coach'&&vis.some(t=>['accueil','appel','demarrer','formation','ressources'].indexOf(t)>=0))out.push('onglets élève visibles dans l\'espace coach : '+vis.join(', '));if(document.body.dataset.role==='eleve'&&vis.indexOf('notifs')>=0)out.push('onglets coach visibles chez l\'élève')}
        if(v==='appel'&&document.body.dataset.role==='eleve'&&document.querySelector('[data-motif="decouverte"]'))out.push('« Je veux être coaché » proposé à un élève déjà coaché');
        if(v==='demarrer'){const lib=[...document.querySelectorAll('#steps button[data-step]')].map(x=>x.getAttribute('data-step')).filter(x=>x==='contrat'||x==='video');if(lib.length)out.push('étape cochable par l\'élève alors qu\'elle doit être vérifiée : '+lib.join(', '))}
        /* grand écran : menu à gauche (pas de barre du bas façon téléphone), et l'espace coach prend la largeur */
        if(W>=1200){const t=document.querySelector('.tabs').getBoundingClientRect();if(!(t.height>innerHeight*.8&&t.width<320&&t.left<=1))out.push('grand écran : barre d\'onglets en bas au lieu du menu à gauche');
          if(v==='coach'&&v0){const dispo=W-t.width,l=v0.getBoundingClientRect().width;if(l<dispo*.8)out.push('grand écran : l\'espace coach n\'occupe que '+Math.round(l/dispo*100)+' % de la largeur')}}
        /* un élève ne voit ni l'acquisition (« Réserver un appel », « Deviens un athlète ») ni le mot « gratuit » */
        if(document.body.dataset.role==='eleve'&&v0){const tx=v0.innerText||'';const m=tx.match(/gratuit\w*|r[ée]server (un|mon) appel|deviens un\s+athl[èe]te/ig);if(m)out.push('texte destiné aux visiteurs affiché à un élève : « '+[...new Set(m)].join(' », « ')+' »')}
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
      const dejaDedans=v==='formation'&&await p.$('#lfa-home'); // la formation peut s'ouvrir directement sur le module en cours
      if(dejaDedans||(sous&&await p.$(sous))){if(!dejaDedans){await p.click(sous);await p.waitForTimeout(300);}
        if(v==='formation'){ /* leçon ouverte : style unique et textes d'aide entiers, sur chaque écran du module */
          for(let i=0;i<8;i++){const r2=await p.evaluate(()=>{const o=[];document.querySelectorAll('#lfa *').forEach(e=>{if(!e.getBoundingClientRect().width)return;const c=getComputedStyle(e);
              if(['Top','Right','Bottom','Left'].some(k=>parseFloat(c['border'+k+'Width'])>=2&&c['border'+k+'Style']!=='none'))o.push('style ancienne Academy : bordure épaisse ('+(e.className||e.tagName)+')');
              if(/verdana/i.test(c.fontFamily))o.push('style ancienne Academy : police Verdana');
              if(e.matches('.screen,.case,.end,.out,.who,.check,.toc,.btn,textarea,input')&&parseFloat(c.borderTopLeftRadius)<6)o.push('style ancienne Academy : coin carré ('+(e.className||e.tagName)+')')});
              document.querySelectorAll('#lfa textarea[placeholder]').forEach(t=>{if([...t.attributes].length>3)o.push('texte d\'aide coupé : « '+t.placeholder+' »')});return o});
            pbs.push(...new Set(r2));
            if(i===3)await p.screenshot({path:path.join(OUT,nom+'-lecon.png'),fullPage:true});
            const nx=await p.$('#lfa-next');if(!nx||await nx.isDisabled())break;await nx.click();await p.waitForTimeout(150);}
        }
        const r=await p.evaluate(async()=>{const o=[];if(document.getElementById('retour').hidden)o.push('pas de flèche retour dans le sous-écran');else{document.getElementById('retour').click();await new Promise(r=>setTimeout(r,150));if(!document.getElementById('retour').hidden)o.push('la flèche retour ne ramène pas à l\'onglet')}return o});
        await p.waitForTimeout(200);pbs.push(...r.map(x=>x+' ('+v+')'));}
      if(pbs.length){pb++;log('✗ '+nom+' : '+pbs.join(' ; '))}else log('✓ '+nom);
    }
  }
  /* Vue visiteur : chaque onglet et chaque bouton doit produire une réaction visible (page, fenêtre, message). */
  if(w===390){
    await p.evaluate(([contenus,eleves,fx])=>{window.sb=eval('('+fx+')')(contenus,eleves);sb=window.sb;MOI.role='visiteur';MOI.email=null;MOI.eleve=null;document.body.dataset.role='visiteur';appliquerRole()},[contenus,ELEVES,faux.toString()]);
    p.on('popup',pp=>pp.close().catch(()=>{}));
    const snap=()=>p.evaluate(()=>location.hash+'|'+(document.body.dataset.imprime||'')+'|'+document.body.innerHTML.length+'|'+document.body.innerHTML.slice(0,5000).length+'|'+[...document.querySelectorAll('main.view:not([hidden]),.voile:not([hidden]),.toast.on')].map(e=>e.id+e.className+e.innerHTML.length).join(','));
    const muets=[];
    for(const t of ['accueil','appel','demarrer','formation','ressources']){
      await p.evaluate(()=>{location.hash='#accueil';route();document.getElementById('verrou').hidden=true});await p.waitForTimeout(200);
      const avant=await snap();await p.click('.tabs a[data-tab="'+t+'"]');await p.waitForTimeout(350);
      if(t!=='accueil'&&(await snap())===avant)muets.push('onglet '+t);
    }
    for(const v of ROLES.visiteur){
      await p.evaluate(v=>{location.hash='#'+v;route();document.getElementById('verrou').hidden=true},v);await p.waitForTimeout(300);
      const n=await p.evaluate(()=>{const vue=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);return vue?[...vue.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled).length:0});
      for(let i=0;i<n;i++){
        await p.evaluate(v=>{if(location.hash!=='#'+v){location.hash='#'+v;route()}document.getElementById('verrou').hidden=true},v);await p.waitForTimeout(150);
        const avant=await snap();
        const lab=await p.evaluate(i=>{const vue=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);const b=[...vue.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled)[i];if(!b)return null;
          /* l'impression (PDF) ouvre une fenêtre du système : comptée comme réaction */
          const imp=()=>{document.body.dataset.imprime=Date.now()};window.print=imp;document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.print=imp}catch(e){}});b.click();return (b.textContent||b.getAttribute('aria-label')||b.id).trim().slice(0,30)},i);
        if(lab===null)continue;await p.waitForTimeout(300);
        if((await snap())===avant)muets.push(v+' : bouton « '+lab+' »');
      }
    }
    if(muets.length){pb++;log('✗ visiteur, sans réaction visible : '+muets.join(' ; '))}else log('✓ visiteur : chaque onglet et chaque bouton réagit');
  }
  if(errs.length){pb++;log('✗ erreurs JS ('+w+') : '+errs.join(' | '))}
  await p.close();
}
/* Aperçu coach (Visiteur / Élève) : bandeau visible, rôle simulé, et AUCUNE écriture (ni base, ni téléphone de Leni). */
{const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/supabase-js/,r=>r.fulfill({contentType:'text/javascript',body:`window.__ecritures=[];window.supabase={createClient:function(){
    function q(t){var o={},un=0;['select','order','like','in','is','not','gte','limit','eq'].forEach(function(k){o[k]=function(){return o}});o.maybeSingle=function(){un=1;return o};
      ['insert','upsert','update','delete'].forEach(function(k){o[k]=function(){window.__ecritures.push(t+'.'+k);return o}});
      o.then=function(ok,ko){var e={email:'b@exemple.com',prenom:'Noah',date_debut:'2026-06-29',duree_sem:26,lien_suivi:null,lien_contrat:null,etapes_faites:[],actif:true};return Promise.resolve(t==='eleves'?{data:un?e:[e]}:{data:un?null:[]}).then(ok,ko)};return o}
    return {from:q,rpc:function(n){if(n!=='mon_role')window.__ecritures.push('rpc.'+n);return Promise.resolve({data:n==='mon_role'?'coach':null})},functions:{invoke:function(){window.__ecritures.push('fn');return Promise.resolve({data:null})}},
      auth:{getSession:function(){return Promise.resolve({data:{session:{user:{email:'coach@exemple.com'}}}})},onAuthStateChange:function(){},signOut:function(){return Promise.resolve()}}}}};`}));
  const o=[];
  for(const a of [{role:'eleve',email:'b@exemple.com'},{role:'eleve'},{role:'visiteur'}]){
    await p.goto('http://localhost:8768/');await p.evaluate(a=>{localStorage.setItem('lf-onboarding','{"temoin":1}');sessionStorage.setItem('lf-apercu',JSON.stringify(a))},a);
    await p.reload();await p.waitForTimeout(900);
    const r=await p.evaluate(async a=>{const o=[];const ban=document.getElementById('apercu');if(!ban||ban.hidden)o.push('bandeau d\'aperçu absent');
      const role=document.body.dataset.role||'';const pill=document.getElementById('who-link').textContent.trim();
      if(a.role==='visiteur'&&pill!=='Se connecter')o.push('aperçu visiteur : bouton du haut « '+pill+' »');
      if(a.role==='eleve'){location.hash='#demarrer';await new Promise(r=>setTimeout(r,300));const c=document.querySelector('#steps [data-step]');if(c){c.click();await new Promise(r=>setTimeout(r,300))}
        if(document.body.dataset.vue!=='demarrer')o.push('aperçu élève : Démarrer ne s\'ouvre pas');}
      if(window.__ecritures.length)o.push('écriture en base pendant l\'aperçu : '+window.__ecritures.join(', '));
      if(localStorage.getItem('lf-onboarding')!=='{"temoin":1}')o.push('le téléphone du coach a été modifié pendant l\'aperçu');
      return o},a);
    await Promise.all([p.waitForNavigation({timeout:5000}).catch(()=>{}),p.click('#apercu-x').catch(()=>r.push('bouton « Revenir en coach » introuvable'))]);
    if(await p.evaluate(()=>sessionStorage.getItem('lf-apercu')))r.push('« Revenir en coach » ne quitte pas l\'aperçu');
    o.push(...r.map(x=>x+' ('+(a.email||a.role)+')'));await p.waitForTimeout(600);
  }
  if(errs.length)o.push('erreurs JS : '+errs.join(' | '));
  if(o.length){pb++;log('✗ aperçu coach : '+o.join(' ; '))}else log('✓ aperçu coach : visiteur, élève type, élève choisi, sans aucune écriture');
  await p.close();}
await b.close();srv.close();process.exit(pb?1:0)})();
