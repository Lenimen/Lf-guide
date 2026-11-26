/* Vérification avant chaque mise en ligne de l'app : capture chaque vue en largeur iPhone
   (390 px et 320 px), en visiteur, en élève et en coach (données fictives), et signale :
   - un débordement horizontal de la page ;
   - un élément qui sort de sa carte ou de sa colonne (champ date, select, image...) ;
   - une classe d'en-tête global (.top) réutilisée dans une vue.
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
  function q(t){var f={t:t,cle:null};var o={select:()=>o,order:()=>o,like:()=>o,upsert:()=>o,update:()=>o,insert:()=>o,
    eq:(k,v)=>{if(k==='cle')f.cle=v;return o},maybeSingle:()=>{f.one=1;return o},
    then:(ok,ko)=>Promise.resolve(t==='eleves'?{data:eleves}:t==='contenus'?(f.one?(contenus[f.cle]?{data:{mime:'text/html',donnees:contenus[f.cle],base64:false}}:{data:null}):{data:Object.keys(contenus).map(k=>({cle:k}))}):{data:[]}).then(ok,ko)};return o}
  return {from:q,auth:{signOut:()=>Promise.resolve(),onAuthStateChange:()=>{}}};
}
const ROLES={visiteur:['accueil','appel','guides','contact','connexion','mensurations','potentiel','posing'],eleve:['demarrer','formation','ressources','bikini','echauffement','parrainage','vacuum','cheatmeals'],coach:['coach']};
(async()=>{const b=await chromium.launch();let pb=0;const log=m=>{console.log(m)};
for(const w of [390,320]){
  const p=await b.newPage({viewport:{width:w,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'..','academy.html'),'utf8')}));
  await p.goto('http://localhost:8768/');await p.waitForTimeout(800);
  for(const role of Object.keys(ROLES)){
    await p.evaluate(([role,contenus,eleves,fx])=>{window.sb=eval('('+fx+')')(contenus,eleves);sb=window.sb;MOI.role=role;MOI.email=role==='visiteur'?null:'x@exemple.com';MOI.eleve=role==='eleve'?{prenom:'Test'}:null;if(window.appliquerRole)appliquerRole()},[role,contenus,ELEVES,faux.toString()]);
    for(const v of ROLES[role]){
      await p.evaluate(v=>{location.hash='#'+v;route()},v);await p.waitForTimeout(500);
      const pbs=await p.evaluate(()=>{const out=[];const W=document.documentElement.clientWidth;
        if(document.documentElement.scrollWidth>W+1)out.push('page plus large que l\'écran ('+document.documentElement.scrollWidth+' px)');
        const vue=[...document.querySelectorAll('main.view')].find(m=>!m.hidden);if(!vue)return ['aucune vue visible'];
        vue.querySelectorAll('.top').forEach(t=>{if(!t.closest('#lfa'))out.push('classe .top (en-tête global) utilisée dans la vue')});
        vue.querySelectorAll('input,select,textarea,img,button,.card,.etape,table').forEach(el=>{const r=el.getBoundingClientRect();if(!r.width)return;
          let par=el.parentElement;while(par&&par!==vue&&getComputedStyle(par).overflowX==='visible'&&!par.classList.contains('card'))par=par.parentElement;
          if(!par||el.closest('.tbl'))return;if(par!==vue&&!par.classList.contains('card')&&getComputedStyle(par).overflowX!=='visible')return;const pr=par.getBoundingClientRect();
          if(r.right>pr.right+1||r.left<pr.left-1)out.push((el.tagName.toLowerCase()+(el.type?'['+el.type+']':'')+' '+(el.className||'')).trim()+' déborde de '+(par.className||par.tagName));});
        return [...new Set(out)]});
      const nom=w+'-'+role+'-'+v;await p.screenshot({path:path.join(OUT,nom+'.png'),fullPage:true});
      if(pbs.length){pb++;log('✗ '+nom+' : '+pbs.join(' ; '))}else log('✓ '+nom);
    }
  }
  if(errs.length){pb++;log('✗ erreurs JS ('+w+') : '+errs.join(' | '))}
  await p.close();
}
await b.close();srv.close();process.exit(pb?1:0)})();
