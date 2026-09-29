/**
 * TEST AUTOMATISÉ - VALIDATION DE LA CONFIGURATION GROUPE LEA (CÔTE D'IVOIRE)
 * Teste les permis LEA, la projection cartographique, et les pièces jointes
 */

const { GEOLOGY_SCHEMA, validateRecordForAlyPipeline } = require('./js/schema.js');
const http = require('http');

console.log("=== VÉRIFICATION SPÉCIFIQUE GROUPE LEA (CÔTE D'IVOIRE) ===");

// 1. Validation du portefeuille officiel de permis de LEA
console.log("\n[TEST 1] Validation des Permis LEA présentés publiquement :");
const permitCodes = GEOLOGY_SCHEMA.sites.map(s => s.code);
console.log(`- Permis configurés : ${permitCodes.join(', ')}`);

const expectedPermits = ["PE47", "PR303", "PR302", "PR962", "PR964"];
const allPermitsPresent = expectedPermits.every(p => permitCodes.includes(p));

if (allPermitsPresent) {
  console.log("-> TEST 1.1 RÉUSSI : Les 5 permis officiels de LEA sont présents (PE47, PR303, PR302, PR962, PR964).");
} else {
  console.error("-> TEST 1.1 ÉCHOUÉ : Permis manquants.");
  process.exit(1);
}

// 2. Validation des substances spécifiques (Bauxite, Or, Manganèse, Nickel, Cobalt, Chrome, Bismuth)
console.log("\n[TEST 2] Validation des Substances du portefeuille LEA :");
const substanceCodes = GEOLOGY_SCHEMA.substances.map(s => s.code);
console.log(`- Substances configurées : ${substanceCodes.join(', ')}`);

const expectedSubstances = ["SUBST_BX", "SUBST_AU", "SUBST_MN", "SUBST_NI", "SUBST_CO", "SUBST_CR", "SUBST_BI"];
const allSubstancesPresent = expectedSubstances.every(s => substanceCodes.includes(s));

if (allSubstancesPresent) {
  console.log("-> TEST 2 RÉUSSI : Bauxite, Or, Manganèse, Nickel, Cobalt, Chrome et Bismuth sont tous configurés.");
} else {
  console.error("-> TEST 2 ÉCHOUÉ : Substances manquantes.");
  process.exit(1);
}

// 3. Validation des branches du groupe (LEA Exploration, Lizetta Mines, AMG)
console.log("\n[TEST 3] Validation des Entités & Branches du Groupe LEA :");
const entityCodes = GEOLOGY_SCHEMA.entities.map(e => e.code);
console.log(`- Entités configurées : ${entityCodes.join(', ')}`);

if (entityCodes.includes("LEA_EXPLORATION") && entityCodes.includes("LIZETTA_MINES") && entityCodes.includes("AMG_LOGISTICS")) {
  console.log("-> TEST 3 RÉUSSI : LEA Exploration, Lizetta Mines et Abidjan Mineral Gateway (AMG) sont intégrées.");
} else {
  console.error("-> TEST 3 ÉCHOUÉ : Entités manquantes.");
  process.exit(1);
}

// 3.1 Validation de la présence locale de Leaflet pour la vue Satellite hors-ligne
const fs = require('fs');
console.log("\n[TEST 3.1] Validation des composants de la Vue Satellite (Leaflet) :");
if (fs.existsSync('js/leaflet.js') && fs.existsSync('css/leaflet.css')) {
  const jsSize = fs.statSync('js/leaflet.js').size;
  const cssSize = fs.statSync('css/leaflet.css').size;
  console.log(`- Leaflet JS disponible (${(jsSize / 1024).toFixed(1)} Ko), CSS disponible (${(cssSize / 1024).toFixed(1)} Ko)`);
  console.log("-> TEST 3.1 RÉUSSI : Moteur cartographique Satellite 100% autonome hors-ligne.");
} else {
  console.error("-> TEST 3.1 ÉCHOUÉ : Fichiers Leaflet manquants.");
  process.exit(1);
}

// 4. Validation mathématique de la projection cartographique pour chaque permis
console.log("\n[TEST 4] Validation du positionnement cartographique des 5 permis :");
function svgPointFromCoords(lat, lng) {
  const svgX = 185 + (lng - (-5.5810)) / 0.0104;
  const svgY = 100 - (lat - 7.6740) / 0.0245;
  return {
    pctX: (svgX / 400) * 100,
    pctY: (svgY / 240) * 100
  };
}

GEOLOGY_SCHEMA.sites.forEach(site => {
  const pt = svgPointFromCoords(site.approxCoords.lat, site.approxCoords.lng);
  console.log(`- Permis ${site.code} (${site.name}) -> X: ${pt.pctX.toFixed(1)}%, Y: ${pt.pctY.toFixed(1)}%`);
  if (pt.pctX < 0 || pt.pctX > 100 || pt.pctY < 0 || pt.pctY > 100) {
    console.error(`-> Erreur de projection pour ${site.code}`);
    process.exit(1);
  }
});
console.log("-> TEST 4 RÉUSSI : Tous les permis sont situés à l'intérieur de la carte géographique ivoirienne.");

// 5. Test d'ingestion d'une fiche réelle LEA avec PIÈCE JOINTE (Photo carotte) vers /api/sync
console.log("\n[TEST 5] Test d'ingestion d'un relevé avec Pièce Jointe vers /api/sync :");

const leaRecordWithAttachment = {
  id: "REC-LEA-PHOTO-TEST",
  company: "GROUPE LEA",
  groupEntity: { code: "LEA_EXPLORATION", label: "LEA Exploration Minière" },
  site: {
    id: "PERMIS-PR962",
    name: "Permis PR962 - Gagnoa",
    code: "PR962",
    region: "Gôh (Gagnoa)",
    country: "Côte d'Ivoire",
    surfaceKm2: 400,
    partner: "Opéré à 100% par LEA"
  },
  substance: { code: "SUBST_AU", label: "Or (Au)", symbol: "Au", unit: "g/t" },
  category: { code: "CAT_RESOURCE_DEF", label: "Délinéation de Ressources" },
  progress: {
    stageCode: "STAGE_DRILL_DDH",
    stageLabel: "Sondage carotté DDH",
    percentCompleted: 65,
    metricValue: 520,
    metricUnit: "mètres"
  },
  status: { code: "STAT_ANOMALY_FOUND", label: "Anomalie géologique", severity: "CRITICAL" },
  targetAudience: { code: "AUD_DIRECTION_LEA", label: "Direction Générale Groupe LEA" },
  keyMessage: {
    typeCode: "MSG_ANOMALY_ALERT",
    typeLabel: "Alerte Découverte",
    executiveSummary: "Faisceau filonien aurifère à or visible avec signature bismuth (> 500 ppm Bi) recoupé sur 14.8m.",
    recommendedAction: "Planifier des forages intercalaires vers le permis limitrophe PR964."
  },
  coordinates: {
    latitude: 6.131920,
    longitude: -5.950610,
    altitudeM: 165.0,
    accuracyM: 2.5,
    datum: "WGS84",
    utm: "Zone 30N (Côte d'Ivoire)"
  },
  attachment: {
    name: "carotte_forage_DDH_GAG18.jpg",
    type: "image/jpeg",
    size: 45200,
    dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...",
    timestamp: new Date().toISOString()
  },
  metadata: {
    createdAt: new Date().toISOString(),
    clientCompany: "GROUPE LEA",
    syncStatus: "PENDING_OFFLINE"
  }
};

const validation = validateRecordForAlyPipeline(leaRecordWithAttachment);
if (!validation.isValid) {
  console.error("-> VALIDATION ÉCHOUÉE :", validation.errors);
  process.exit(1);
}
console.log("- Fiche avec pièce jointe 100% conforme au schéma Aly.");

const postData = JSON.stringify({
  source: 'GEOTERRAIN_LEA_PWA',
  clientCompany: 'GROUPE LEA',
  pipelineTarget: 'ROLE_1_ALY',
  record: leaRecordWithAttachment
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let responseData = '';
  res.on('data', chunk => { responseData += chunk; });
  res.on('end', () => {
    console.log(`- Réponse serveur HTTP ${res.statusCode} :`, responseData);
    const parsed = JSON.parse(responseData);
    if (parsed.success && parsed.batchId) {
      console.log(`-> TEST 5 RÉUSSI : Fiche avec pièce jointe synchronisée avec succès (batchId: ${parsed.batchId})`);
      console.log("\n=== TOUTES LES VALIDATIONS SONT RÉUSSIES ===");
      process.exit(0);
    } else {
      console.error("-> TEST 5 ÉCHOUÉ.");
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`- Erreur de transmission : ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
