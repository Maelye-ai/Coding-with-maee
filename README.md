# ⛏️ GÉO-TERRAIN • GROUPE LEA (Côte d'Ivoire)

> Application de collecte géologique déconnectée et d'interfaçage automatique avec le pipeline du **Rôle 1 (Aly)**, adaptée au portefeuille multi-permis et multi-entités du **Groupe LEA**.

---

## 🏛️ 1. Profil Opérationnel du Groupe LEA

Le Groupe LEA se déploie sur trois piliers stratégiques interconnectés :
1. **Exploration Minière (LEA Exploration)** : gestion des permis de recherche amont, acquisition géophysique, cartographie et campagnes de sondages (RC/DDH).
2. **Exploitation Minière (Lizetta Mines)** : branche en charge de la mise en valeur, des études de faisabilité et de l'exploitation.
3. **Logistique Portuaire (Abidjan Mineral Gateway - AMG)** : grand projet de terminal vrac minier au Port Autonome d'Abidjan (mené avec China Harbour Engineering Company - CHEC, investissement de 250M USD) pour fluidifier l'évacuation des minerais.

---

## 🗺️ 2. Portefeuille Officiel des Permis LEA

| Permis | Région (RCI) | Superficie | Substances Indiquées | Branche Opératrice | Partenaire |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PE47** | Moronou (Bongouanou) | 380 km² | **Bauxite** (Al2O3) | Lizetta Mines | LEB |
| **PR303** | Moronou (Bongouanou) | 253 km² | **Or** (Au), **Manganèse** (Mn) | LEA Exploration | Opéré à 100% par LEA |
| **PR302** | Gbêkê (Béoumi) | 380 km² | **Nickel** (Ni), **Cobalt** (Co), **Chrome** (Cr) | Lizetta Mines | Lizetta Mines-WMA |
| **PR962** | Gôh (Gagnoa) | 400 km² | **Or** (Au), **Bismuth** (Bi) | LEA Exploration | Opéré à 100% par LEA |
| **PR964** | Gôh (Gagnoa) | 400 km² | **Or** (Au), **Bismuth** (Bi) | LEA Exploration | Opéré à 100% par LEA |

> **Point de Vigilance Intégré :** L'application traite ces données comme hypothèses de travail flexibles. Les géologues peuvent ajuster les paramètres de terrain tout en restant dans le cadre des taxonomies contrôlées.

---

## 👥 3. Gestion des Publics Multiples & Routage Automatique

Pour répondre au besoin *"plusieurs permis et plusieurs publics à gérer en parallèle"*, chaque fiche comporte un sélecteur contrôlé de **Destinataire Principal** :
- **Direction Générale Groupe LEA** (synthèse stratégique, découvertes, alertes prioritaires).
- **Pipeline Rôle 1 (Aly)** (ingestion brute normalisée, mise à jour SIG, calculs géostatistiques).
- **Lizetta Mines** (ingénieurs d'exploitation, contrôle teneur, essais métallurgiques).
- **Abidjan Mineral Gateway (AMG)** (planification logistique et capacité d'évacuation portuaire).
- **Partenaires Joint-Venture** (`LEB` pour PE47, `Lizetta Mines-WMA` pour PR302).

---

## 🌐 4. Fonctionnement Hors-Ligne & Projection Côte d'Ivoire

- **Projection Cartographique** : WGS84 / **UTM Zone 30N (Côte d'Ivoire)**.
- **Stockage Local Double Résilience** : `IndexedDB` (`GeoTerrainLEA_DB`) + `LocalStorage`.
- **Mode Plein Soleil** : Contraste extérieur maximal pour lecture sur tablette sous fort ensoleillement en Côte d'Ivoire.
- **Synchronisation Différée** : Les fiches créées sur les pistes de Bongouanou, Béoumi ou Gagnoa sont enregistrées localement et transmises dès le retour au camp de base ou via liaison satellite vers `/api/sync`.
