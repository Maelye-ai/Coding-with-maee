/**
 * GÉO-TERRAIN - SERVEUR LOCAL & SIMULATEUR D'INGESTION PIPELINE ALY (RÔLE 1)
 * Permet de tester l'application en local et de vérifier la synchronisation réseau réelle.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const INGESTION_FILE = path.join(DATA_DIR, 'aly_pipeline_ingest.json');

// S'assure que le dossier data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(INGESTION_FILE)) {
  fs.writeFileSync(INGESTION_FILE, JSON.stringify([], null, 2), 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers pour faciliter les tests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API DE SANTÉ
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'HEALTHY', pipelineTarget: 'ROLE_1_ALY', time: new Date().toISOString() }));
    return;
  }

  // 2. API D'INGESTION DU PIPELINE DU RÔLE 1 (ALY)
  if (req.url === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const record = payload.record;

        if (!record || !record.id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: "Record invalide ou manquant." }));
          return;
        }

        // Sauvegarde persistante dans le fichier d'ingestion d'Aly
        let allIngested = [];
        try {
          allIngested = JSON.parse(fs.readFileSync(INGESTION_FILE, 'utf-8'));
        } catch (e) {
          allIngested = [];
        }

        // Dédoublonnage par ID
        const existingIdx = allIngested.findIndex(r => r.id === record.id);
        const batchId = 'ALY-SRV-' + Date.now().toString(36).toUpperCase();

        const enrichedRecord = {
          ...record,
          serverIngestedAt: new Date().toISOString(),
          alyBatchId: batchId
        };

        if (existingIdx >= 0) {
          allIngested[existingIdx] = enrichedRecord;
        } else {
          allIngested.push(enrichedRecord);
        }

        fs.writeFileSync(INGESTION_FILE, JSON.stringify(allIngested, null, 2), 'utf-8');

        console.log(`[PIPELINE ALY] Fiche ${record.id} ingérée avec succès. Site: ${record.site?.name}, Substance: ${record.substance?.label}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          batchId: batchId,
          recordId: record.id,
          message: "Fiche reçue et validée par le pipeline Aly."
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. API CONSULTATION DES FICHES INGÉRÉES PAR ALY
  if (req.url === '/api/records' && req.method === 'GET') {
    try {
      const allIngested = JSON.parse(fs.readFileSync(INGESTION_FILE, 'utf-8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allIngested));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 4. SERVEUR DE FICHIERS STATIQUES (PWA)
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  // Nettoyage query parameters
  filePath = filePath.split('?')[0];

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` GÉO-TERRAIN • Serveur de Terrain & Pipeline Rôle 1 (Aly) Actif`);
  console.log(` URL Locale : http://localhost:${PORT}`);
  console.log(` Données Ingestion Pipeline : ${INGESTION_FILE}`);
  console.log(`================================================================`);
});
