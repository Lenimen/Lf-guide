# App web LF Coaching (étapes 1 à 3)

App installable (PWA) : Safari › Partager › « Sur l'écran d'accueil ». Pas d'App Store.
Aucune donnée d'élève : les coches du démarrage restent dans le téléphone (localStorage), rien n'est envoyé.

## Ce qu'il y a
- `index.html` : toute l'app (accueil public avec photo, réservation d'appel, guides, contact, démarrage avec la barre qui se charge, formation, fiches, guide posing bikini).
- Rendez-vous (`MOTIFS`) : 4 motifs (je veux être coaché, posing, point pendant le suivi, fin d'accompagnement), questions par motif + « Comment tu m'as connu ? » (prospects), réponses jointes à la réservation dans les notes. « Je veux être coaché » passe par la candidature Systeme.io (qualification, mineurs). Les autres ouvrent l'agenda Cal.com (intégré dans l'app sur le vrai site). À faire : créer un type d'événement Cal.com par motif et mettre les liens dans `LIENS.agendaPosing / agendaPoint / agendaFin` (aujourd'hui tous sur « decouverte »). Agenda 100 % maison : seulement avec le serveur de l'étape 4.
- Guide posing bikini (`#bikini`) : seulement dans l'espace élève (Fiches), pas lié depuis l'accueil. Photos WNBF / NPC News créditées sous chaque image, risque accepté par Leni le 24/11. Attention : sans connexion, l'espace élève n'est pas protégé par un mot de passe, il est juste non lié.
- `photos/` : photos de Leni sur scène (WNBF short bleu, podium BFBF ; onglet Formation : WNBF de profil, cadrage vertical torse entier, bannière haute 4:5), choisies le 25/11 à la demande de Leni (pas de photos de salle).
- Tous les réglages sont en haut du script : `MARQUE` (nom + sous-titre), `LIENS`, `GUIDES`, `ETAPES`, `MODULES`, `RESSOURCES`.
- `manifest.webmanifest`, `sw.js` (hors ligne, changer VERSION à chaque mise en ligne), `icons/`, `ressources/` (fiches PDF génériques).

## Formulaires
Ils restent ceux d'aujourd'hui (candidature, questionnaire de départ, guides sur Systeme.io, avec ?source=app). Rien de nouveau n'écrit dans Notion pour l'instant.

## Places réservées (pas construites)
- `#slot-satisfaction` : questionnaire de satisfaction (fil « Concevoir le questionnaire de satisfaction »).
- `#slot-suivi` : étape 4, suivi qui remplace Fitbrothers (Supabase UE + relecture RGPD avant toute vraie donnée).

## Mise en ligne (go de Leni le 25/11)
GitHub Pages (gratuit, sans compte en plus) via `.github/workflows/app-pages.yml` : chaque modification de `app/` sur main est mise en ligne sur app.thelfmethod.com. Réglages faits une fois par Leni : Settings > Pages > Source « GitHub Actions » + domaine app.thelfmethod.com ; DNS OVH : CNAME `app` -> `lenimen.github.io.`

## À vérifier
- Nouveau message LF START prêt à valider : /mnt/project-files/outils/app-lf/lf-start-v2-brouillon.md
- Le lien Loom du tuto de l'app de suivi : Loom est résilié, accès jusqu'au 28/11/2026. Remplacer `LIENS.tutoSuivi` par le lien Drive.
- `LIENS.bienvenue` : lien Drive de la vidéo Bienvenue (partagée par lien).
- `MODULES` : recopié de academy.html, à mettre à jour si les dates de sortie changent.

## Parrainage (ajouté le 25/11, idée de Leni)
- Vue `#parrainage` (onglet Fiches). Carte en tête des Fiches et sur l'accueil pour les élèves (appareil déjà passé par l'espace élève).
- Conditions reprises du programme validé le 06/10 : par pote qui démarre, le parrain choisit 1 mois offert (ajouté à la fin du suivi) ou 1 séance présentiel de 2 h (déplacement déjà prévu ou région liégeoise, valable 6 mois). Le filleul paie plein tarif et a un appel prioritaire sous 48 h.
- Code = `LF-` + prénom saisi par l'élève ; lien = candidature `?source=parrain-<prenom>`. Le prénom reste dans le téléphone (localStorage `lf-parrain`).

## Questionnaire de satisfaction (25/11)
- Carte en tête des Fiches (et sur l'accueil quand c'est le moment). L'élève indique une fois la date de début de son plan et la durée (16, 20, 24 semaines ou 6 mois), gardées sur son téléphone.
- Fenêtres : semaine 3 (jours 21-34), mi-parcours (jours 84-104), fin (3 dernières semaines). Lien `LIENS.satisfaction` (?g=satisfaction&v=s3|mid|fin&prenom=, prénom repris du parrainage s'il est rempli).
- Notifications push : pas encore. Elles demandent un petit serveur qui envoie les rappels (prévu avec l'étape 4, Supabase/Cloudflare). En attendant, rappel affiché à l'ouverture de l'app.

## Comptes visiteur / élève / coach (25/11, choix de Leni : vrais comptes)
- Supabase (UE, offre gratuite). Réglage dans `index.html` : `SUPA = { url, anon }` (clé anon publique par conception). Vide = app ouverte comme avant.
- Base : `supabase/schema.sql` (tables `coachs`, `eleves`, `contenus`, fonction `mon_role()`, droits RLS). Coach si e-mail dans `coachs`, élève si dans `eleves` et actif, sinon visiteur.
- Connexion : e-mail + code à 6 chiffres (Supabase Auth). Le modèle d'e-mail « Magic Link » doit contenir `{{ .Token }}`.
- Espace coach (`#coach`) : ajouter un élève (prénom, e-mail, début, durée), modifier la date, désactiver.
- Contenus élèves (liens Drive/Loom, guide bikini, fiches PDF, photos bikini) retirés du dépôt public, rangés dans la table `contenus`. Sources privées : /mnt/project-files/outils/app-lf/contenus-eleves/ ; SQL de chargement : `genere-contenus-sql.py`.
- L'historique Git public contient encore les anciennes versions de ces fichiers (fiches génériques, photos WNBF/NPC publiques, aucune donnée élève).
