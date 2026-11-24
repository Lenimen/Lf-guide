# App web LF Coaching (étapes 1 à 3)

App installable (PWA) : Safari › Partager › « Sur l'écran d'accueil ». Pas d'App Store.
Aucune donnée d'élève : les coches du démarrage restent dans le téléphone (localStorage), rien n'est envoyé.

## Ce qu'il y a
- `index.html` : toute l'app (accueil public, guides, contact, démarrage avec la barre qui se charge, formation, fiches).
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
- Le lien Loom du tuto de l'app de suivi : Loom est résilié, accès jusqu'au 28/11/2026. Remplacer `LIENS.tutoSuivi` par le lien Drive.
- `LIENS.bienvenue` : lien Drive de la vidéo Bienvenue (partagée par lien).
- `MODULES` : recopié de academy.html, à mettre à jour si les dates de sortie changent.
