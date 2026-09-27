PATCH NOTE EN BAS

[Chrome Web Store](https://chromewebstore.google.com/detail/wikimasters-prix-moyen-co/pkcnhclbagpfmlmolfcgedcmbccffgci)

[firefox addons](https://addons.mozilla.org/en-US/firefox/addon/wikimasters-tools-prix-moyen/)
merci à rodrigorod pour le port firefox

# WikiMastersTools-kzfamily

Add-on créé par la kzfamily.

**100% vibecodé**

## Installation (Chrome / Chromium / Opera / Brave)

1. Télécharger ou cloner le dépôt :

```bash
git clone https://github.com/qkerman/WikiMastersTools-kzfamily.git
```

Ou télécharger en haut à droite "code" > telecharger le zip

2. Ouvrir `chrome://extensions/` dans Chrome / Chromium.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier `WikiMastersTools-kzfamily` (dézippé) qui contient `manifest.json`.
6. Refresh WikiMasters.

## Installation (Firefox)

1. Ouvrir Firefox et aller sur `about:debugging#/runtime/this-firefox`.
2. Cliquer sur **Charger un module temporaire...** (Load Temporary Add-on...).
3. Sélectionner le fichier [manifest.json](manifest.json) situé dans le dossier de l'extension.
4. Rafraîchir WikiMasters (F5).

> Pour empaqueter l'extension pour Firefox (AMO ou distribution) :  
> `npx web-ext build` (le fichier zip sera généré dans `web-ext-artifacts/`).

## Mise à jour

```bash
cd ~/Downloads/WikiMastersTools-kzfamily
git pull
```

Ou retélécharger manuellement et remplacer le dossier.

Puis cliquer sur **Recharger** dans `chrome://extensions/` et faire un F5 sur WikiMasters.

## Patch note

*Heure de Paris*

- **27/09/2026 — 20:36** — V4.15.14 : le fallback texte des cartes sans image est désormais une couche directe de la carte, indépendante du wrapper image WikiMasters et de ses règles `!important`. Le nom est forcé au premier plan dans la zone haute, avec la couleur de rareté et un fond dédié plus lisible.
- **27/09/2026 — 20:29** — V4.15.13 : correction définitive du fallback sans image : le titre typographique est forcé au-dessus des couches full-art (une règle générique le masquait derrière le voile), et les cartes sans image utilisent désormais une palette sombre neutre teintée par la rareté au lieu de la palette noire extraite du logo.
- **27/09/2026 — 20:20** — V4.15.12 : correction du fallback des cartes réellement sans image : auto-réparation des cartes déjà marquées sans image, injection forcée du titre à la place du logo et fond indépendant de la palette noire calculée depuis le logo WikiMasters.
- **27/09/2026 — 20:12** — V4.15.11 : le titre principal des cartes full-art reprend désormais automatiquement la couleur de leur rareté, comme la bordure et les autres accents visuels.
- **27/09/2026 — 20:06** — V4.15.10 : lorsqu’aucune image native, Wikidata ou Wikimedia n’est disponible, le logo WikiMasters est masqué et remplacé par un artwork typographique utilisant le nom de la carte, automatiquement dimensionné selon sa longueur et teinté avec la couleur de rareté.
- **27/09/2026 — 19:55** — V4.15.9 : correction des images Wikidata/Wikimedia utilisées quand une carte n’a pas d’image native : suppression des contraintes du placeholder (`w-[52%]`, `max-w`, ratio 4:3) afin que l’image de remplacement occupe toute la couche full-art et profite correctement du recadrage/zoom adaptatif.
- **27/09/2026 — 19:41** — V4.15.8 : les overlays natifs des cartes shiny (L+) sont fortement allégés sur le design full-art afin de laisser l’image visible ; le reflet shiny reste discret au repos et légèrement plus présent au survol.
- **27/09/2026 — 19:34** — V4.15.7 : amélioration du full-art pour les images avec beaucoup de marge/fond autour du sujet : détection automatique de la zone réellement occupée par l’illustration et zoom adaptatif de l’image nette, sans sur-recadrer les artworks déjà bien remplis.
- **27/09/2026 — 19:27** — V4.15.6 : refonte du full-art : suppression du voile arc-en-ciel au repos, foil holographique visible uniquement au survol et synchronisé avec l’inclinaison 3D de la carte, plus bordures métalliques colorées selon la rareté (L/UR/SR/R/PC/C).
- **27/09/2026 — 12:29** — V4.15.5 : le bouton Paramètres apparaît désormais sur toutes les pages où le compteur WikiBidous est présent et clignote tant qu’il n’a jamais été cliqué ; ce signal est ensuite désactivé définitivement dans le stockage local.
- **26/09/2026 — 21:31** — V4.15.4 : restauration de l’état manquant du widget de vérification `/pulls` après la modularisation (`acknowledgedChecks` et `uiResponseProfile`).
- **26/09/2026 — 21:27** — V4.15.3 : correction de la vérification automatique sur `/pulls` : le champ honeypot `website` sert uniquement de repère, la vraie case est cochée puis l’extension attend que le bouton « Continuer » soit activé avant de le valider.
- **25/09/2026 — 20:14** — V4.4 : amélioration des images manquantes avec des fallbacks 100 % ouverts et sans clé API : PokéAPI pour les Pokémon, Wikidata (image P18 / logo P154), puis Wikipedia/Wikimedia FR et EN. Les anciens échecs d’image sont invalidés pour être retestés.
- **25/09/2026 — 19:13** — V4.3 : ajout d’un menu Paramètres sur `/pulls`, organisé par catégories, pour activer ou désactiver individuellement le design des cartes, Wikipédia/Wikimedia, les outils de prix et collection, les fonctions de paquets et l’estimation des échanges.
- **25/09/2026 — 18:48** — V4.2.2 : correction du suivi des statistiques de tirage après la modularisation (`recordPullStats`).
- **25/09/2026 — 18:00** — V4.2 / V4.2.1 : cartes full-art/holographiques avec couleurs adaptées à l’image, détection automatique du ratio portrait/carré/paysage, rendu plus propre du fond et suppression du flou derrière le texte. Suppression du flash de l’ancien design grâce à un skeleton/spinner avant l’affichage de la carte améliorée. Architecture entièrement découpée par fonctionnalités : prix, collection, classement, ventes, paquets, échanges, effets de cartes et bridge réseau.
- **24/09/2026 — 23:30** — Ouverture des paquets avec temporisation aléatoire supplémentaire pour mieux respecter le rythme du site.
- **24/09/2026 — 23:27** — Le classement « Plus chères » fonctionne aussi avec un cache de prix partiel.
- **24/09/2026 — 23:21** — Ajout de l’ouverture automatique des paquets toutes les 20 à 100 minutes avec récapitulatif cumulé.

- **24/09/2026 — 22:32** — V4 : images manquantes via Wikimedia, statistiques de tirage, bouton Wikipédia sur les cartes et mode compact.
- **23/09/2026 — 13:25** — Compatibilité multi-navigateurs : support officiel de Firefox (Manifest V3 / gecko ID), Brave et Opera, avec runtime universel.
- **22/09/2026 — 17:37** — Ajout du prix moyen lors de l’inspection d’une carte dans la collection globale.
- **21/09/2026 — 08:35** — Ajout de la mise en vente directe depuis le classement des cartes les plus chères.
- **19/09/2026 — 17:45** — Ajout de l’estimation des échanges avec le prix de chaque carte et le total de chaque côté.
- **19/09/2026 — 12:01** — Ajout du bouton « Tout ouvrir » pour ouvrir tous les paquets et afficher les cartes obtenues triées par prix moyen.
- **19/09/2026 — 09:26** — Ajout de l’affichage du prix moyen à chaque paquet ouvert.
- **18/09/2026 — 19:58** — Ajout d’une option pour charger uniquement le prix des nouvelles cartes.
- **18/09/2026 — 19:07** — Ajout du choix des raretés à charger.
- **18/09/2026 — 19:00** — Ajout du prix moyen sur les annonces Marketplace.
- **18/09/2026 — 18:48** — Ajout du classement des cartes les plus chères.
- **18/09/2026 — 18:30** — Ajout de l’affichage du prix moyen dans la collection.
