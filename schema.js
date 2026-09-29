/**
 * GÉO-TERRAIN - SPÉCIFICATION DU SCHÉMA DE DONNÉES & TAXONOMIE GROUPE LEA
 * Adapté aux opérations multi-permis de LEA en Côte d'Ivoire
 * Destiné à l'exploitation automatique par le pipeline de données du Rôle 1 (Aly)
 */

const GEOLOGY_SCHEMA = {
  version: "2.0.0-LEA",
  clientCompany: "GROUPE LEA",
  pipelineTarget: "ROLE_1_ALY_INGESTION_ENGINE",

  // 1. BRANCHES & ENTITÉS DU GROUPE LEA
  entities: [
    { code: "LEA_EXPLORATION", label: "LEA Exploration Minière", role: "Titulaire des permis de recherche & travaux amont" },
    { code: "LIZETTA_MINES", label: "Lizetta Mines (Exploitation)", role: "Branche chargée de l'exploitation minière" },
    { code: "AMG_LOGISTICS", label: "Abidjan Mineral Gateway (AMG)", role: "Terminal portuaire de vrac minier (Port d'Abidjan / CHEC)" }
  ],

  // 2. PORTEFEUILLE DE PERMIS DE LEA (Côte d'Ivoire)
  // Basé sur le portefeuille officiel : PE47, PR303, PR302, PR962, PR964
  sites: [
    {
      id: "PERMIS-PE47",
      name: "Permis PE47 - Bongouanou",
      code: "PE47",
      region: "Moronou (Bongouanou)",
      country: "Côte d'Ivoire",
      surfaceKm2: 380,
      partner: "LEB",
      operatorEntity: "LIZETTA_MINES",
      primarySubstances: ["SUBST_BX"],
      authorizedSubstances: ["SUBST_BX"],
      approxCoords: { lat: 6.6508, lng: -4.7042, regionName: "Bongouanou" }
    },
    {
      id: "PERMIS-PR303",
      name: "Permis PR303 - Bongouanou",
      code: "PR303",
      region: "Moronou (Bongouanou)",
      country: "Côte d'Ivoire",
      surfaceKm2: 253,
      partner: "Opéré à 100% par LEA",
      operatorEntity: "LEA_EXPLORATION",
      primarySubstances: ["SUBST_AU", "SUBST_MN"],
      authorizedSubstances: ["SUBST_AU", "SUBST_MN"],
      approxCoords: { lat: 6.7215, lng: -4.6180, regionName: "Bongouanou Nord" }
    },
    {
      id: "PERMIS-PR302",
      name: "Permis PR302 - Béoumi",
      code: "PR302",
      region: "Gbêkê (Béoumi)",
      country: "Côte d'Ivoire",
      surfaceKm2: 380,
      partner: "Lizetta Mines-WMA",
      operatorEntity: "LIZETTA_MINES",
      primarySubstances: ["SUBST_NI", "SUBST_CO", "SUBST_CR"],
      authorizedSubstances: ["SUBST_NI", "SUBST_CO", "SUBST_CR"],
      approxCoords: { lat: 7.6740, lng: -5.5810, regionName: "Béoumi" }
    },
    {
      id: "PERMIS-PR962",
      name: "Permis PR962 - Gagnoa",
      code: "PR962",
      region: "Gôh (Gagnoa)",
      country: "Côte d'Ivoire",
      surfaceKm2: 400,
      partner: "Opéré à 100% par LEA",
      operatorEntity: "LEA_EXPLORATION",
      primarySubstances: ["SUBST_AU", "SUBST_BI"],
      authorizedSubstances: ["SUBST_AU", "SUBST_BI"],
      approxCoords: { lat: 6.1319, lng: -5.9506, regionName: "Gagnoa Est" }
    },
    {
      id: "PERMIS-PR964",
      name: "Permis PR964 - Gagnoa",
      code: "PR964",
      region: "Gôh (Gagnoa)",
      country: "Côte d'Ivoire",
      surfaceKm2: 400,
      partner: "Opéré à 100% par LEA",
      operatorEntity: "LEA_EXPLORATION",
      primarySubstances: ["SUBST_AU", "SUBST_BI"],
      authorizedSubstances: ["SUBST_AU", "SUBST_BI"],
      approxCoords: { lat: 6.0845, lng: -6.0120, regionName: "Gagnoa Ouest" }
    }
  ],

  // 3. SUBSTANCES DU PORTEFEUILLE LEA (Inclus Bauxite, Or, Manganèse, Nickel, Cobalt, Chrome, Bismuth)
  substances: [
    { code: "SUBST_BX", label: "Bauxite (Al2O3)", symbol: "Al", category: "MINERAUX_INDUSTRIELS", unit: "% Al2O3", leaAsset: "PE47 Bongouanou (Axe industriel Bauxite & transformation)" },
    { code: "SUBST_AU", label: "Or (Au)", symbol: "Au", category: "METAUX_PRECIEUX", unit: "g/t", leaAsset: "PR303 Bongouanou, PR962 & PR964 Gagnoa" },
    { code: "SUBST_MN", label: "Manganèse (Mn)", symbol: "Mn", category: "METAUX_DE_BASE", unit: "% Mn", leaAsset: "PR303 Bongouanou" },
    { code: "SUBST_NI", label: "Nickel (Ni)", symbol: "Ni", category: "METAUX_CRITIQUES_BATTERIE", unit: "% Ni", leaAsset: "PR302 Béoumi" },
    { code: "SUBST_CO", label: "Cobalt (Co)", symbol: "Co", category: "METAUX_CRITIQUES_BATTERIE", unit: "% Co", leaAsset: "PR302 Béoumi" },
    { code: "SUBST_CR", label: "Chrome (Cr)", symbol: "Cr", category: "METAUX_DE_BASE", unit: "% Cr2O3", leaAsset: "PR302 Béoumi" },
    { code: "SUBST_BI", label: "Bismuth (Bi)", symbol: "Bi", category: "METAUX_STRATEGIQUES", unit: "ppm Bi", leaAsset: "PR962 & PR964 Gagnoa" },
    { code: "SUBST_LI", label: "Lithium (Spodumène)", symbol: "Li", category: "METAUX_CRITIQUES_BATTERIE", unit: "% Li2O", leaAsset: "Reconnaissance régionale" },
    { code: "SUBST_FE", label: "Minerai de Fer (Fe)", symbol: "Fe", category: "MINERAUX_INDUSTRIELS", unit: "% Fe", leaAsset: "Vrac minier corridor AMG" }
  ],

  // 4. CATÉGORIES DE PROJET / MATURITÉ DU GROUPE LEA
  categories: [
    { code: "CAT_GREENFIELD", label: "Exploration Greenfield (Reconnaissance régionale & Prospection)", phaseNumber: 1 },
    { code: "CAT_BROWNFIELD", label: "Exploration Brownfield (Extension cibles & Forages satellites)", phaseNumber: 2 },
    { code: "CAT_RESOURCE_DEF", label: "Délinéation & Définition de Ressources (Maille serrée)", phaseNumber: 3 },
    { code: "CAT_FEASIBILITY", label: "Étude Économique & Faisabilité (PFS / DFS)", phaseNumber: 4 },
    { code: "CAT_GRADE_CONTROL", label: "Contrôle de Teneur Mine (Lizetta Mines - Exploitation)", phaseNumber: 5 },
    { code: "CAT_LOGISTICS_PORT", label: "Coordination Logistique Vrac Minier (Abidjan Mineral Gateway - AMG)", phaseNumber: 6 },
    { code: "CAT_ENVIRONMENT", label: "Suivi Environnemental & Réhabilitation (Réglementation Côte d'Ivoire)", phaseNumber: 7 }
  ],

  // 5. STADES DES TRAVAUX
  stages: [
    { code: "STAGE_MAPPING", label: "Cartographie géologique & Échantillonnage de surface", metricName: "Affleurements cartographiés", metricUnit: "points", defaultTarget: 60 },
    { code: "STAGE_GEOCHEM_SOIL", label: "Campagne géochimique sol / stream sediments", metricName: "Échantillons de sol", metricUnit: "échantillons", defaultTarget: 300 },
    { code: "STAGE_GEOPHYSICS", label: "Levé géophysique sol (Mag / IP / TDEM)", metricName: "Profils géophysiques", metricUnit: "km linéaires", defaultTarget: 40 },
    { code: "STAGE_TRENCHING", label: "Tranchées & Décapage latéritique / bauxitique", metricName: "Longueur de tranchée", metricUnit: "mètres", defaultTarget: 500 },
    { code: "STAGE_DRILL_RC", label: "Sondage destructif Circulation Inverse (RC)", metricName: "Métrage foré RC", metricUnit: "mètres", defaultTarget: 1500 },
    { code: "STAGE_DRILL_DDH", label: "Sondage carotté au diamant (DDH)", metricName: "Métrage carotté DDH", metricUnit: "mètres", defaultTarget: 800 },
    { code: "STAGE_LOGGING_CORE", label: "Logging géologique carothèque & Mesures P-XRF", metricName: "Métrage loggé", metricUnit: "mètres", defaultTarget: 800 },
    { code: "STAGE_BULK_SAMPLING", label: "Échantillonnage en vrac pour essais métallurgiques", metricName: "Tonnage prélevé", metricUnit: "tonnes", defaultTarget: 50 },
    { code: "STAGE_SAMPLING_LAB", label: "Expédition des lots vers laboratoire certifié", metricName: "Échantillons expédiés", metricUnit: "échantillons", defaultTarget: 150 }
  ],

  // 6. STATUTS OPÉRATIONNELS & DÉCISIONNELS
  statuses: [
    { code: "STAT_IN_PROGRESS", label: "En cours (Opérations nominales)", severity: "INFO", badgeColor: "#0ea5e9", flagAly: "NORMAL" },
    { code: "STAT_ANOMALY_FOUND", label: "Anomalie géologique / Indice minéralisé majeur", severity: "CRITICAL", badgeColor: "#f59e0b", flagAly: "HIGH_PRIORITY_REVIEW" },
    { code: "STAT_AWAITING_ASSAYS", label: "En attente des résultats labo (SGS/ALS)", severity: "WARNING", badgeColor: "#8b5cf6", flagAly: "PENDING_LAB" },
    { code: "STAT_VALIDATED", label: "Objectif atteint / Fiche validée conforme", severity: "SUCCESS", badgeColor: "#10b981", flagAly: "APPROVED" },
    { code: "STAT_SUSPENDED_WEATHER", label: "Suspendu - Saison des pluies / Pistes impraticables", severity: "WARNING", badgeColor: "#ec4899", flagAly: "BLOCKED_WEATHER" },
    { code: "STAT_SUSPENDED_TECH", label: "Suspendu - Panne sondeuse / Approvisionnement carburant", severity: "CRITICAL", badgeColor: "#ef4444", flagAly: "BLOCKED_TECH" },
    { code: "STAT_NON_MINERALIZED", label: "Sondage stérile / Cible infirmée", severity: "INFO", badgeColor: "#64748b", flagAly: "BARREN" },
    { code: "STAT_COMPLETED", label: "Jalon clôturé", severity: "SUCCESS", badgeColor: "#059669", flagAly: "CLOSED" }
  ],

  // 7. DESTINATAIRES MULTIPLES (Pour gérer les publics multiples de LEA)
  targetAudiences: [
    { code: "AUD_DIRECTION_LEA", label: "Direction Générale Groupe LEA (Synthèse stratégique & CODIR)", priorityLevel: "HIGH" },
    { code: "AUD_PIPELINE_ALY", label: "Pipeline Rôle 1 (Aly - Ingestion Data Lake, SIG & Modélisation)", priorityLevel: "AUTOMATED" },
    { code: "AUD_LIZETTA_OPS", label: "Lizetta Mines (Équipe Opérations & Contrôle de Faisabilité)", priorityLevel: "OPERATIONAL" },
    { code: "AUD_AMG_PORT", label: "Abidjan Mineral Gateway (AMG - Planification Logistique Portuaire)", priorityLevel: "LOGISTICS" },
    { code: "AUD_PARTNER_LEB", label: "Partenaire LEB (Joint-Venture Bauxite Bongouanou)", priorityLevel: "PARTNER" },
    { code: "AUD_PARTNER_WMA", label: "Partenaire Lizetta Mines-WMA (Nickel-Cobalt-Chrome Béoumi)", priorityLevel: "PARTNER" }
  ],

  // 8. TYPOLOGIES DE MESSAGES CLÉS POUR LE PIPELINE DU RÔLE 1 (ALY)
  keyMessageTypes: [
    { code: "MSG_ANOMALY_ALERT", label: "Alerte Découverte / Indice Majeur (Teneur élevée)", defaultPriority: "HIGH" },
    { code: "MSG_DAILY_PROGRESS", label: "Point d'étape quotidien (Avancement métrage & échantillons)", defaultPriority: "NORMAL" },
    { code: "MSG_LOGISTICS_NEED", label: "Demande logistique d'urgence (Carburant, pièces, sécurité)", defaultPriority: "HIGH" },
    { code: "MSG_LAB_DISPATCH", label: "Notification de scellés & dispatch labo (SGS/ALS)", defaultPriority: "NORMAL" },
    { code: "MSG_PERMIT_BOUNDARY", label: "Alerte foncière / Limites de permis / Environnement", defaultPriority: "HIGH" },
    { code: "MSG_PORT_CORRIDOR", label: "Point corridor évacuation minérale (Liaison vers AMG Abidjan)", defaultPriority: "MEDIUM" }
  ],

  // 9. TAGS CONTRÔLÉS SPÉCIFIQUES LEA (Côte d'Ivoire)
  controlledTags: [
    { tag: "BAUXITE_HAUTE_TENEUR", label: "#BauxiteHauteTeneur", desc: "Al2O3 > 45% et SiO2 réactive < 3% (Bongouanou PE47)" },
    { tag: "OR_VISIBLE_QUARTZ", label: "#OrVisibleQuartz", desc: "Or natif ou sulfures aurifères en veines de quartz (Gagnoa / Bongouanou)" },
    { tag: "ANOMALIE_BISMUTH", label: "#AnomalieBismuth", desc: "Signature Bi associée à la minéralisation aurifère (Gagnoa PR962/PR964)" },
    { tag: "NICKEL_LATERITIQUE", label: "#NickelLatéritique", desc: "Profil latéritique riche en Ni-Co sur péridotites (Béoumi PR302)" },
    { tag: "CHROME_CUMULATS", label: "#ChromeCumulats", desc: "Lentilles ou rubanements de chromite identifiés (Béoumi PR302)" },
    { tag: "MANGANESE_SUPERGENE", label: "#ManganèseSupergène", desc: "Oxydes de manganèse massifs en chapeau de fer (Bongouanou PR303)" },
    { tag: "QAQC_CONFORME", label: "#QAQC_Conforme", desc: "Standards certifiés CRM et blancs stériles insérés" },
    { tag: "PISTE_IMPRATICABLE", label: "#PisteImpraticable", desc: "Difficultés d'accès en saison des pluies" },
    { tag: "AMG_EVACUATION", label: "#AMG_Évacuation", desc: "Validation du schéma logistique vers le port d'Abidjan" }
  ],

  // 10. GÉOLOGUES OPÉRATEURS DU GROUPE LEA
  geologists: [
    { id: "GEO-LEA-01", name: "Dr. Kouassi Koffi", role: "Directeur de l'Exploration Groupe LEA", entity: "LEA_EXPLORATION" },
    { id: "GEO-LEA-02", name: "Awa Touré", role: "Chef de Projet Bauxite (Bongouanou PE47)", entity: "LIZETTA_MINES" },
    { id: "GEO-LEA-03", name: "Marc N'Dri", role: "Géologue Senior Or & Bismuth (Gagnoa PR962/964)", entity: "LEA_EXPLORATION" },
    { id: "GEO-LEA-04", name: "Kouadio Yao", role: "Géologue de Sonde Nickel-Cobalt-Chrome (Béoumi PR302)", entity: "LIZETTA_MINES" }
  ]
};

// Validateur formel pour le pipeline de données d'Aly (Rôle 1)
function validateRecordForAlyPipeline(record) {
  const errors = [];

  if (!record.site || !record.site.id) errors.push("Permis LEA obligatoire.");
  if (!record.substance || !record.substance.code) errors.push("Substance obligatoire.");
  if (!record.category || !record.category.code) errors.push("Catégorie de projet obligatoire.");
  if (!record.progress || !record.progress.stageCode) errors.push("Stade d'avancement obligatoire.");
  if (record.progress.percentCompleted === undefined || record.progress.percentCompleted === null || record.progress.percentCompleted < 0 || record.progress.percentCompleted > 100) {
    errors.push("Taux d'avancement doit être compris entre 0 et 100%.");
  }
  if (!record.status || !record.status.code) errors.push("Statut opérationnel obligatoire.");
  if (!record.keyMessage || !record.keyMessage.typeCode) errors.push("Type de message clé obligatoire.");
  if (!record.keyMessage.executiveSummary || record.keyMessage.executiveSummary.trim().length < 5) {
    errors.push("Le message clé (synthèse exécutive) doit contenir au moins 5 caractères.");
  }
  if (!record.coordinates || typeof record.coordinates.latitude !== 'number' || typeof record.coordinates.longitude !== 'number') {
    errors.push("Coordonnées GPS terrain obligatoires (format WGS84).");
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GEOLOGY_SCHEMA, validateRecordForAlyPipeline };
}
