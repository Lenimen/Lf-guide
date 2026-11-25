# App web LF Coaching (étapes 1 à 3)

App installable (PWA) : Safari › Partager › « Sur l'écran d'accueil ». Pas d'App Store.
Aucune donnée d'élève : les coches du démarrage restent dans le téléphone (localStorage), rien n'est envoyé.

## Ce qu'il y a
- `index.html` : toute l'app (accueil public avec photo, réservation d'appel, guides, contact, démarrage avec la barre qui se charge, formation, fiches, guide posing bikini).
- Rendez-vous (`MOTIFS`) : 4 motifs (je veux être coaché, posing, point pendant le suivi, fin d'accompagnement), questions par motif + « Comment tu m'as connu ? » (prospects), réponses jointes à la réservation dans les notes. « Je veux être coaché » passe par la candidature Systeme.io (qualification, mineurs). Les autres ouvrent l'agenda Cal.com (intégré dans l'app sur le vrai site). À faire : créer un type d'événement Cal.com par motif et mettre les liens dans `LIENS.agendaPosing / agendaPoint / agendaFin` (aujourd'hui tous sur « decouverte »). Agenda 100 % maison : seulement avec le serveur de l'étape 4.
- Guide posing bikini (`#bikini`) : seulement dans l'espace élève (Fiches), pas lié depuis l'accueil. Photos WNBF / NPC News créditées sous chaque image, risque accepté par Leni le 24/11. Attention : sans connexion, l'espace élève n'est pas protégé par un mot de passe, il est juste non lié.
- `photos/` : photos de Leni sur scène (WNBF short bleu, podium BFBF ; onglet Formation : WNBF de profil, recadré haut du corps en 1400×700), choisies le 25/11 à la demande de Leni (pas de photos de salle).
- Tous les réglages sont en haut du script : `MARQUE` (nom + sous-titre), `LIENS`, `GUIDES`, `ETAPES`, `MODULES`, `RESSOURCES`.
- `manifest.webmanifest`, `sw.js` (hors ligne, changer VERSION à chaque mise en ligne), `icons/`, `ressources/` (fiches PDF génériques).

## Formulaires
Ils restent ceux d'aujourd'hui (candidature, questionnaire de départ, guides sur Systeme.io, avec ?source=app). Rien de nouveau n'écrit dans Notion pour l'instant.

## Places réservées (pas construites)
- `#slot-satisfaction` : questionnaire de satisfaction (fil « Concevoir le questionnaire de satisfaction »).
- `#slot-suivi` : étape 4, suivi qui remplace Fitbrothers (Supabase UE + relecture RGPD avant toute vraie donnée).

## Mise en ligne prévue (pas faite, attend le go de Leni)
Cloudflare Pages sur app.thelfmethod.com, dossier `app/` de ce dépôt.

## À vérifier
- Nouveau message LF START prêt à valider : /mnt/project-files/outils/app-lf/lf-start-v2-brouillon.md
- Le lien Loom du tuto de l'app de suivi : Loom est résilié, accès jusqu'au 28/11/2026. Remplacer `LIENS.tutoSuivi` par le lien Drive.
- `LIENS.bienvenue` : lien Drive de la vidéo Bienvenue (partagée par lien).
- `MODULES` : recopié de academy.html, à mettre à jour si les dates de sortie changent.
