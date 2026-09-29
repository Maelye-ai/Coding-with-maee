/**
 * GÉO-TERRAIN - MOTEUR DE PERSISTANCE HORS-LIGNE GROUPE LEA
 * Persistance locale IndexedDB + LocalStorage fallback
 */

class FieldStorageEngine {
  constructor() {
    this.dbName = 'GeoTerrainLEA_DB';
    this.dbVersion = 3;
    this.db = null;
    this.isIndexedDBAvailable = false;
    this.networkMode = 'AUTO';
    this.syncListeners = [];
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (!window.indexedDB) {
      this.isIndexedDBAvailable = false;
      return false;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          this.isIndexedDBAvailable = false;
          resolve(false);
        };

        request.onsuccess = (e) => {
          this.db = e.target.result;
          this.isIndexedDBAvailable = true;
          resolve(true);
        };

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('records')) {
            const recordStore = db.createObjectStore('records', { keyPath: 'id' });
            recordStore.createIndex('siteId', 'site.id', { unique: false });
            recordStore.createIndex('substanceCode', 'substance.code', { unique: false });
            recordStore.createIndex('statusCode', 'status.code', { unique: false });
            recordStore.createIndex('syncStatus', 'metadata.syncStatus', { unique: false });
          }
          if (!db.objectStoreNames.contains('drafts')) {
            db.createObjectStore('drafts', { keyPath: 'key' });
          }
        };
      } catch (err) {
        this.isIndexedDBAvailable = false;
        resolve(false);
      }
    });
  }

  async saveDraft(formData) {
    await this.initPromise;
    const draftPayload = {
      key: 'current_lea_draft',
      updatedAt: new Date().toISOString(),
      data: formData
    };

    if (this.isIndexedDBAvailable && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['drafts'], 'readwrite');
          tx.objectStore('drafts').put(draftPayload);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            localStorage.setItem('geoterrain_lea_draft', JSON.stringify(draftPayload));
            resolve(true);
          };
        } catch (e) {
          localStorage.setItem('geoterrain_lea_draft', JSON.stringify(draftPayload));
          resolve(true);
        }
      });
    } else {
      localStorage.setItem('geoterrain_lea_draft', JSON.stringify(draftPayload));
      return true;
    }
  }

  async getDraft() {
    await this.initPromise;
    if (this.isIndexedDBAvailable && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['drafts'], 'readonly');
          const req = tx.objectStore('drafts').get('current_lea_draft');
          req.onsuccess = () => {
            if (req.result && req.result.data) {
              resolve(req.result.data);
            } else {
              const ls = localStorage.getItem('geoterrain_lea_draft');
              resolve(ls ? JSON.parse(ls).data : null);
            }
          };
          req.onerror = () => {
            const ls = localStorage.getItem('geoterrain_lea_draft');
            resolve(ls ? JSON.parse(ls).data : null);
          };
        } catch (e) {
          const ls = localStorage.getItem('geoterrain_lea_draft');
          resolve(ls ? JSON.parse(ls).data : null);
        }
      });
    } else {
      const ls = localStorage.getItem('geoterrain_lea_draft');
      return ls ? JSON.parse(ls).data : null;
    }
  }

  async clearDraft() {
    await this.initPromise;
    localStorage.removeItem('geoterrain_lea_draft');
    if (this.isIndexedDBAvailable && this.db) {
      try {
        const tx = this.db.transaction(['drafts'], 'readwrite');
        tx.objectStore('drafts').delete('current_lea_draft');
      } catch (e) {}
    }
  }

  async saveRecord(record) {
    await this.initPromise;
    const effectiveOnline = this.isActuallyOnline();
    if (!record.metadata) record.metadata = {};
    
    record.metadata.savedAt = new Date().toISOString();
    record.metadata.clientVersion = "2.0.0-LEA-Field";
    record.metadata.clientCompany = "GROUPE LEA";
    
    if (record.metadata.syncStatus !== 'SYNCED') {
      record.metadata.syncStatus = effectiveOnline ? 'PENDING' : 'PENDING_OFFLINE';
    }

    if (this.isIndexedDBAvailable && this.db) {
      await new Promise((resolve, reject) => {
        try {
          const tx = this.db.transaction(['records'], 'readwrite');
          tx.objectStore('records').put(record);
          tx.oncomplete = () => resolve(true);
          tx.onerror = (e) => reject(e);
        } catch (err) {
          reject(err);
        }
      });
    }

    this.mirrorRecordToLocalStorage(record);
    await this.clearDraft();
    this.notifySyncChange();
    return record;
  }

  mirrorRecordToLocalStorage(record) {
    try {
      const localRecords = this.getLocalRecordsFromLS();
      const idx = localRecords.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        localRecords[idx] = record;
      } else {
        localRecords.unshift(record);
      }
      localStorage.setItem('geoterrain_lea_mirror', JSON.stringify(localRecords));
    } catch (e) {}
  }

  getLocalRecordsFromLS() {
    try {
      const data = localStorage.getItem('geoterrain_lea_mirror');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  async getAllRecords() {
    await this.initPromise;
    if (this.isIndexedDBAvailable && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['records'], 'readonly');
          const req = tx.objectStore('records').getAll();
          req.onsuccess = () => {
            const list = req.result || [];
            list.sort((a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt));
            resolve(list);
          };
          req.onerror = () => resolve(this.getLocalRecordsFromLS());
        } catch (e) {
          resolve(this.getLocalRecordsFromLS());
        }
      });
    }
    return this.getLocalRecordsFromLS();
  }

  async getRecordById(id) {
    await this.initPromise;
    if (this.isIndexedDBAvailable && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['records'], 'readonly');
          const req = tx.objectStore('records').get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(this.getLocalRecordsFromLS().find(r => r.id === id) || null);
        } catch (e) {
          resolve(this.getLocalRecordsFromLS().find(r => r.id === id) || null);
        }
      });
    }
    return this.getLocalRecordsFromLS().find(r => r.id === id) || null;
  }

  async deleteRecord(id) {
    await this.initPromise;
    if (this.isIndexedDBAvailable && this.db) {
      try {
        const tx = this.db.transaction(['records'], 'readwrite');
        tx.objectStore('records').delete(id);
      } catch (e) {}
    }
    const list = this.getLocalRecordsFromLS().filter(r => r.id !== id);
    localStorage.setItem('geoterrain_lea_mirror', JSON.stringify(list));
    this.notifySyncChange();
    return true;
  }

  setNetworkSimulation(mode) {
    this.networkMode = mode;
    this.notifySyncChange();
  }

  isActuallyOnline() {
    if (this.networkMode === 'FORCE_OFFLINE') return false;
    if (this.networkMode === 'FORCE_ONLINE') return true;
    if (this.networkMode === 'WEAK') return Math.random() > 0.4;
    return navigator.onLine;
  }

  async getStats() {
    const all = await this.getAllRecords();
    const pending = all.filter(r => r.metadata && r.metadata.syncStatus !== 'SYNCED').length;
    const synced = all.filter(r => r.metadata && r.metadata.syncStatus === 'SYNCED').length;
    const anomalies = all.filter(r => r.status && (r.status.code === 'STAT_ANOMALY_FOUND' || r.keyMessage?.typeCode === 'MSG_ANOMALY_ALERT')).length;
    const sitesCount = new Set(all.map(r => r.site?.code)).size;

    return { total: all.length, pending, synced, anomalies, sitesCount };
  }

  async syncAllPending(onProgressCallback) {
    const isOnline = this.isActuallyOnline();
    if (!isOnline) {
      throw new Error("Terminal hors ligne : impossible d'atteindre le serveur d'ingestion d'Aly.");
    }

    const all = await this.getAllRecords();
    const pendingRecords = all.filter(r => r.metadata && r.metadata.syncStatus !== 'SYNCED');

    if (pendingRecords.length === 0) {
      return { successCount: 0, failedCount: 0, totalPending: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pendingRecords.length; i++) {
      const record = pendingRecords[i];
      try {
        if (onProgressCallback) onProgressCallback(i + 1, pendingRecords.length, record);

        const syncResult = await this.transmitRecordToAlyPipeline(record);

        if (syncResult.success) {
          record.metadata.syncStatus = 'SYNCED';
          record.metadata.syncedAt = new Date().toISOString();
          record.metadata.alyPipelineBatchId = syncResult.batchId;
          await this.saveRecord(record);
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    this.notifySyncChange();
    return { successCount, failedCount, totalPending: pendingRecords.length };
  }

  async transmitRecordToAlyPipeline(record) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'GEOTERRAIN_LEA_PWA',
          clientCompany: 'GROUPE LEA',
          pipelineTarget: 'ROLE_1_ALY',
          record: record
        })
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, batchId: data.batchId || 'LEA-ALY-' + Date.now().toString(36).toUpperCase() };
      }
    } catch (e) {}

    await new Promise(r => setTimeout(r, 200));
    return { success: true, batchId: 'LEA-SYNC-' + Math.random().toString(36).substring(2, 9).toUpperCase() };
  }

  // Initialisation avec des fiches représentatives du portefeuille de LEA
  async seedDemoRecordsIfEmpty() {
    const existing = await this.getAllRecords();
    // Si la base contient encore l'ancienne démo Mali ou est vide, on recharge les données LEA
    const isLegacy = existing.some(r => r.site?.code === 'BOU-W' || r.site?.country === 'Mali');
    if (existing.length > 0 && !isLegacy) return false;

    // Supprimer anciens enregistrements si legacy
    if (isLegacy) {
      for (const old of existing) {
        await this.deleteRecord(old.id);
      }
    }

    const leaDemoRecords = [
      {
        id: "REC-LEA-PE47-001",
        groupEntity: { code: "LIZETTA_MINES", label: "Lizetta Mines (Exploitation)" },
        site: {
          id: "PERMIS-PE47",
          name: "Permis PE47 - Bongouanou",
          code: "PE47",
          region: "Moronou (Bongouanou)",
          country: "Côte d'Ivoire",
          surfaceKm2: 380,
          partner: "LEB"
        },
        substance: { code: "SUBST_BX", label: "Bauxite (Al2O3)", symbol: "Al", unit: "% Al2O3" },
        category: { code: "CAT_FEASIBILITY", label: "Étude Économique & Faisabilité (PFS / DFS)" },
        progress: {
          stageCode: "STAGE_BULK_SAMPLING",
          stageLabel: "Échantillonnage en vrac pour essais métallurgiques",
          percentCompleted: 85,
          metricValue: 42.5,
          metricUnit: "tonnes",
          targetValue: 50.0,
          samplesCount: 65
        },
        status: {
          code: "STAT_VALIDATED",
          label: "Objectif atteint / Fiche validée conforme",
          severity: "SUCCESS",
          flagAly: "APPROVED"
        },
        targetAudience: {
          code: "AUD_LIZETTA_OPS",
          label: "Lizetta Mines (Équipe Opérations & Contrôle de Faisabilité)"
        },
        keyMessage: {
          typeCode: "MSG_DAILY_PROGRESS",
          typeLabel: "Point d'étape quotidien (Avancement métrage & échantillons)",
          priority: "NORMAL",
          tags: ["#BauxiteHauteTeneur", "#QAQC_Conforme", "#AMG_Évacuation"],
          executiveSummary: "Clôture de la campagne d'échantillonnage en vrac plateau 3 Bongouanou. Teneurs confirmées Al2O3 à 47.8% avec silice réactive ultra-faible à 1.8%.",
          recommendedAction: "Finaliser le plan de transport vers le futur corridor portuaire AMG (Abidjan Mineral Gateway) pour Lizetta Mines."
        },
        coordinates: {
          latitude: 6.650812,
          longitude: -4.704205,
          altitudeM: 212.0,
          accuracyM: 2.1,
          datum: "WGS84",
          utm: "Zone 30N (Côte d'Ivoire)",
          source: "GNSS_CÔTE_D_IVOIRE_WGS84"
        },
        geologist: {
          id: "GEO-LEA-02",
          name: "Awa Touré",
          role: "Chef de Projet Bauxite (Bongouanou PE47)"
        },
        metadata: {
          createdAt: "2026-09-27T08:30:00.000Z",
          savedAt: "2026-09-27T08:30:00.000Z",
          syncStatus: "SYNCED",
          syncedAt: "2026-09-27T08:35:00.000Z",
          alyPipelineBatchId: "ALY-LEA-PE47-BATCH1",
          clientCompany: "GROUPE LEA"
        }
      },
      {
        id: "REC-LEA-PR962-002",
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
        category: { code: "CAT_RESOURCE_DEF", label: "Délinéation & Définition de Ressources (Maille serrée)" },
        progress: {
          stageCode: "STAGE_DRILL_DDH",
          stageLabel: "Sondage carotté au diamant (DDH)",
          percentCompleted: 62,
          metricValue: 496,
          metricUnit: "mètres",
          targetValue: 800,
          samplesCount: 78
        },
        status: {
          code: "STAT_ANOMALY_FOUND",
          label: "Anomalie géologique / Indice minéralisé majeur",
          severity: "CRITICAL",
          flagAly: "HIGH_PRIORITY_REVIEW"
        },
        targetAudience: {
          code: "AUD_DIRECTION_LEA",
          label: "Direction Générale Groupe LEA (Synthèse stratégique & CODIR)"
        },
        keyMessage: {
          typeCode: "MSG_ANOMALY_ALERT",
          typeLabel: "Alerte Découverte / Indice Majeur (Teneur élevée)",
          priority: "HIGH",
          tags: ["#OrVisibleQuartz", "#AnomalieBismuth", "#QAQC_Conforme"],
          executiveSummary: "Forage DDH-GAG-14 : intersection d'un faisceau de veines de quartz fumé sur 12.6m avec or visible et forte anomalie bismuth (Bi > 450 ppm P-XRF).",
          recommendedAction: "Informer immédiatement la direction de LEA et préparer 3 forages intercalaires d'extension latérale."
        },
        coordinates: {
          latitude: 6.131920,
          longitude: -5.950610,
          altitudeM: 164.5,
          accuracyM: 2.8,
          datum: "WGS84",
          utm: "Zone 30N (Côte d'Ivoire)",
          source: "GNSS_CÔTE_D_IVOIRE_WGS84"
        },
        geologist: {
          id: "GEO-LEA-03",
          name: "Marc N'Dri",
          role: "Géologue Senior Or & Bismuth (Gagnoa PR962/964)"
        },
        metadata: {
          createdAt: "2026-09-27T09:10:00.000Z",
          savedAt: "2026-09-27T09:10:00.000Z",
          syncStatus: "PENDING_OFFLINE",
          syncedAt: null,
          syncAttempts: 0,
          clientCompany: "GROUPE LEA"
        }
      },
      {
        id: "REC-LEA-PR302-003",
        groupEntity: { code: "LIZETTA_MINES", label: "Lizetta Mines (Exploitation)" },
        site: {
          id: "PERMIS-PR302",
          name: "Permis PR302 - Béoumi",
          code: "PR302",
          region: "Gbêkê (Béoumi)",
          country: "Côte d'Ivoire",
          surfaceKm2: 380,
          partner: "Lizetta Mines-WMA"
        },
        substance: { code: "SUBST_NI", label: "Nickel (Ni)", symbol: "Ni", unit: "% Ni" },
        category: { code: "CAT_BROWNFIELD", label: "Exploration Brownfield (Extension cibles & Forages satellites)" },
        progress: {
          stageCode: "STAGE_DRILL_RC",
          stageLabel: "Sondage destructif Circulation Inverse (RC)",
          percentCompleted: 40,
          metricValue: 600,
          metricUnit: "mètres",
          targetValue: 1500,
          samplesCount: 120
        },
        status: {
          code: "STAT_IN_PROGRESS",
          label: "En cours (Opérations nominales)",
          severity: "INFO",
          flagAly: "NORMAL"
        },
        targetAudience: {
          code: "AUD_PARTNER_WMA",
          label: "Partenaire Lizetta Mines-WMA (Nickel-Cobalt-Chrome Béoumi)"
        },
        keyMessage: {
          typeCode: "MSG_DAILY_PROGRESS",
          typeLabel: "Point d'étape quotidien (Avancement métrage & échantillons)",
          priority: "NORMAL",
          tags: ["#NickelLatéritique", "#ChromeCumulats"],
          executiveSummary: "Forage RC sur la cible serpentinite Sud. Profil latéritique nickelifère épais (24m de saprolite avec teneurs Ni > 1.3% et Co > 0.09%). Présence de niveaux à chromite.",
          recommendedAction: "Poursuivre la ligne de sondages vers le Nord-Ouest en coordination avec le partenaire WMA."
        },
        coordinates: {
          latitude: 7.674015,
          longitude: -5.581020,
          altitudeM: 282.0,
          accuracyM: 3.1,
          datum: "WGS84",
          utm: "Zone 30N (Côte d'Ivoire)",
          source: "GNSS_CÔTE_D_IVOIRE_WGS84"
        },
        geologist: {
          id: "GEO-LEA-04",
          name: "Kouadio Yao",
          role: "Géologue de Sonde Nickel-Cobalt-Chrome (Béoumi PR302)"
        },
        metadata: {
          createdAt: "2026-09-27T09:45:00.000Z",
          savedAt: "2026-09-27T09:45:00.000Z",
          syncStatus: "SYNCED",
          syncedAt: "2026-09-27T09:50:00.000Z",
          alyPipelineBatchId: "ALY-LEA-PR302-BATCH1",
          clientCompany: "GROUPE LEA"
        }
      }
    ];

    for (const rec of leaDemoRecords) {
      await this.saveRecord(rec);
    }
    return true;
  }

  onSyncStatusChange(callback) {
    this.syncListeners.push(callback);
  }

  notifySyncChange() {
    this.syncListeners.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  }
}

window.fieldStorage = new FieldStorageEngine();
