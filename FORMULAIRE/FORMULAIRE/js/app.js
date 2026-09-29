/**
 * CORE-MINING OPS • GROUPE LEA
 * Contrôleur applicatif néo-brutaliste avec VUE SATELLITE (Leaflet + Esri World Imagery)
 * et Gestion des Pièces Jointes (Photos de terrain / Carottes / PDF)
 * Compatible avec le pipeline de données du Rôle 1 (Aly)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab-item');
  const tabContents = document.querySelectorAll('.tab-content');

  // Form Elements
  const form = document.getElementById('geologyFieldForm');
  const siteSelect = document.getElementById('siteSelect');
  const substanceSelect = document.getElementById('substanceSelect');
  const categorySelect = document.getElementById('categorySelect');
  const progressSlider = document.getElementById('progressSlider');
  const progressValDisplay = document.getElementById('progressValDisplay');
  const statusChoiceGrid = document.getElementById('statusChoiceGrid');
  const selectedStatusInput = document.getElementById('selectedStatusInput');
  const keyMessageInput = document.getElementById('keyMessageInput');
  const demoFillBtn = document.getElementById('demoFillBtn');

  // Interactive Satellite Map Elements
  const interactiveMapViewport = document.getElementById('interactiveMapViewport');
  const btnMapSatellite = document.getElementById('btnMapSatellite');
  const btnMapTopo = document.getElementById('btnMapTopo');
  const mapExpandBtn = document.getElementById('mapExpandBtn');
  const mapCoordsBadge = document.getElementById('mapCoordsBadge');
  const mapTargetName = document.getElementById('mapTargetName');
  const mapUtmZoneBadge = document.getElementById('mapUtmZoneBadge');
  const mapGpsFixBtn = document.getElementById('mapGpsFixBtn');

  // Attachment Elements
  const attachmentFileInput = document.getElementById('attachmentFileInput');
  const attachmentDropzone = document.getElementById('attachmentDropzone');
  const attachmentPreviewBox = document.getElementById('attachmentPreviewBox');
  const attachmentThumbPreview = document.getElementById('attachmentThumbPreview');
  const attachmentFileName = document.getElementById('attachmentFileName');
  const attachmentFileSize = document.getElementById('attachmentFileSize');
  const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');
  const attachmentCountLabel = document.getElementById('attachmentCountLabel');

  // Header & Status
  const syncStatusBadge = document.getElementById('syncStatusBadge');
  const syncStatusText = document.getElementById('syncStatusText');
  const quickSyncBtn = document.getElementById('quickSyncBtn');

  // History List & Search
  const reportsListContainer = document.getElementById('reportsListContainer');
  const reportSearchInput = document.getElementById('reportSearchInput');
  const reportFilterSelect = document.getElementById('reportFilterSelect');

  // Dashboard KPIs
  const kpiTotalRecords = document.getElementById('kpiTotalRecords');
  const kpiSitesCount = document.getElementById('kpiSitesCount');

  // Exports
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportGeoJsonBtn = document.getElementById('exportGeoJsonBtn');
  const exportJsonBatchBtn = document.getElementById('exportJsonBatchBtn');
  const viewJsonSchemaBtn = document.getElementById('viewJsonSchemaBtn');

  // Modal
  const detailModal = document.getElementById('detailModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCopyBtn = document.getElementById('modalCopyBtn');

  let activeModalRecord = null;

  // État local des Coordonnées et de la Pièce Jointe
  let currentRecordCoords = {
    latitude: 6.6508,
    longitude: -4.7042,
    altitudeM: 210.0,
    accuracyM: 2.5,
    datum: "WGS84",
    utm: "Zone 30N (Côte d'Ivoire)"
  };

  let currentAttachment = null;

  // Leaflet Map Handles
  let leafletMap = null;
  let currentMarker = null;
  let satelliteGroup = null;
  let topoLayer = null;

  // ==========================================================================
  // 1. NAVIGATION PAR ONGLETS (DOCK INFÉRIEUR)
  // ==========================================================================
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTabId = tab.dataset.tab;
      
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      if (targetTabId === 'tabInspect') {
        setTimeout(() => {
          if (leafletMap) leafletMap.invalidateSize();
        }, 120);
      }

      if (targetTabId === 'tabHistory') {
        renderReportsList();
      }
      if (targetTabId === 'tabDashboard') {
        updateDashboardKPIs();
      }
    });
  });

  // ==========================================================================
  // 2. GESTION DE LA GRILLE 2x2 DES STATUTS
  // ==========================================================================
  if (statusChoiceGrid) {
    statusChoiceGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.status-choice-btn');
      if (!btn) return;

      document.querySelectorAll('.status-choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedStatusInput.value = btn.dataset.value;
    });
  }

  // ==========================================================================
  // 3. JAUGE D'AVANCEMENT
  // ==========================================================================
  if (progressSlider) {
    progressSlider.addEventListener('input', () => {
      progressValDisplay.textContent = `${progressSlider.value}%`;
    });
  }

  // ==========================================================================
  // 4. VUE SATELLITE HAUTE RÉSOLUTION (LEAFLET + ESRI WORLD IMAGERY)
  // ==========================================================================

  function findClosestPermit(lat, lng) {
    let closest = null;
    let minDist = Infinity;

    GEOLOGY_SCHEMA.sites.forEach(site => {
      if (site.approxCoords) {
        const dLat = site.approxCoords.lat - lat;
        const dLng = site.approxCoords.lng - lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDist) {
          minDist = dist;
          closest = site;
        }
      }
    });

    return { site: closest, distance: minDist };
  }

  function updatePositionFromCoords(lat, lng, targetPermitId = null, skipToast = false) {
    const safeLat = parseFloat(lat.toFixed(6));
    const safeLng = parseFloat(lng.toFixed(6));

    if (currentMarker) {
      currentMarker.setLatLng([safeLat, safeLng]);
    }

    currentRecordCoords = {
      latitude: safeLat,
      longitude: safeLng,
      altitudeM: 210.0,
      accuracyM: 2.5,
      datum: "WGS84",
      utm: window.geoLocator.toUTM(safeLat, safeLng)
    };

    if (mapCoordsBadge) {
      mapCoordsBadge.textContent = `${safeLat.toFixed(4)}°, ${safeLng.toFixed(4)}°`;
    }

    if (mapUtmZoneBadge) {
      mapUtmZoneBadge.textContent = currentRecordCoords.utm;
    }

    // Trouver le permis le plus proche
    let permit = null;
    if (targetPermitId) {
      permit = GEOLOGY_SCHEMA.sites.find(s => s.id === targetPermitId);
    } else {
      const match = findClosestPermit(safeLat, safeLng);
      if (match.site && match.distance < 0.65) {
        permit = match.site;
      }
    }

    if (permit) {
      if (siteSelect && siteSelect.value !== permit.id) {
        siteSelect.value = permit.id;
      }
      if (permit.primarySubstances?.length > 0 && substanceSelect) {
        substanceSelect.value = permit.primarySubstances[0];
      }
      if (mapTargetName) {
        mapTargetName.textContent = `${permit.name} (${permit.code})`;
      }
      if (!skipToast) {
        showToast(`Cible pointée : ${permit.name}`, "info");
      }
    } else {
      if (mapTargetName) {
        mapTargetName.textContent = `Point satellite (${safeLat.toFixed(3)}°N, ${safeLng.toFixed(3)}°W)`;
      }
    }
  }

  function initSatelliteMap() {
    if (typeof L === 'undefined') {
      console.warn("Leaflet indisponible.");
      return;
    }

    if (!interactiveMapViewport || leafletMap) return;

    // Coordonnées de départ : Bongouanou (PE47 - Moronou)
    const initialLat = currentRecordCoords.latitude || 6.6508;
    const initialLng = currentRecordCoords.longitude || -4.7042;

    leafletMap = L.map('interactiveMapViewport', {
      center: [initialLat, initialLng],
      zoom: 10,
      zoomControl: true,
      attributionControl: true
    });

    // 1. Couche Satellite Esri World Imagery (Haute Résolution)
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri &bull; Vue Satellite'
    });

    // 2. Couche Labels Villes & Frontières (pour lisibilité terrain)
    const esriLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.85
    });

    satelliteGroup = L.layerGroup([esriSatellite, esriLabels]);

    // 3. Couche Topographique / Rues OpenStreetMap
    topoLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    // Vue SATELLITE par défaut (active au démarrage)
    satelliteGroup.addTo(leafletMap);

    // Épingle personnalisée néo-brutaliste déplaçable
    const brutalistMarkerIcon = L.divIcon({
      className: 'brutalist-leaflet-marker',
      html: '<div class="brutalist-marker-icon" title="Glissez-moi pour affiner la position">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 28]
    });

    currentMarker = L.marker([initialLat, initialLng], {
      icon: brutalistMarkerIcon,
      draggable: true,
      autoPan: true
    }).addTo(leafletMap);

    // Concessions & Permis Miniers officiels du Groupe LEA
    const permitOverlays = [
      {
        id: "PERMIS-PE47",
        name: "PE47 & PR303 • Bongouanou (Moronou)",
        desc: "Bauxite (Lizetta) & Or/Mn (LEA)",
        color: "#f59e0b",
        coords: [
          [6.56, -4.82], [6.78, -4.82], [6.78, -4.56], [6.56, -4.56]
        ]
      },
      {
        id: "PERMIS-PR302",
        name: "PR302 • Béoumi (Gbêkê)",
        desc: "Nickel, Cobalt, Chrome",
        color: "#0284c7",
        coords: [
          [7.57, -5.70], [7.78, -5.70], [7.78, -5.46], [7.57, -5.46]
        ]
      },
      {
        id: "PERMIS-PR962",
        name: "PR962 & PR964 • Gagnoa (Gôh)",
        desc: "Or & Bismuth",
        color: "#10b981",
        coords: [
          [6.02, -6.08], [6.24, -6.08], [6.24, -5.84], [6.02, -5.84]
        ]
      }
    ];

    permitOverlays.forEach(p => {
      const polygon = L.polygon(p.coords, {
        color: p.color,
        weight: 2,
        fillColor: p.color,
        fillOpacity: 0.18,
        dashArray: '5, 5'
      }).addTo(leafletMap);

      polygon.bindTooltip(`<strong>${p.name}</strong><br><span style="font-size:10px;">${p.desc}</span>`, {
        sticky: true
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        updatePositionFromCoords(e.latlng.lat, e.latlng.lng, p.id);
        leafletMap.flyTo(e.latlng, 12, { duration: 0.8 });
      });
    });

    // Repère AMG Port d'Abidjan
    const amgIcon = L.divIcon({
      className: 'brutalist-leaflet-marker',
      html: '<div style="font-size: 20px; line-height: 1;">🚢</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([5.3097, -4.0127], { icon: amgIcon })
      .addTo(leafletMap)
      .bindTooltip("<strong>Abidjan Mineral Gateway (AMG)</strong><br><span style=" + '"font-size:10px;"' + ">Terminal portuaire de vrac minier</span>");

    // Clic n'importe où sur la carte satellite
    leafletMap.on('click', (e) => {
      updatePositionFromCoords(e.latlng.lat, e.latlng.lng);
    });

    // Déplacement de l'épingle
    currentMarker.on('dragend', () => {
      const pos = currentMarker.getLatLng();
      updatePositionFromCoords(pos.lat, pos.lng);
    });
  }

  // Initialisation de la carte satellite Leaflet
  initSatelliteMap();

  // Bouton Commutateur Vue SATELLITE
  if (btnMapSatellite) {
    btnMapSatellite.addEventListener('click', (e) => {
      e.preventDefault();
      if (!leafletMap) return;
      if (topoLayer) leafletMap.removeLayer(topoLayer);
      if (satelliteGroup) satelliteGroup.addTo(leafletMap);
      btnMapSatellite.classList.add('active');
      btnMapTopo?.classList.remove('active');
      showToast("🛰️ Vue Satellite Haute Résolution activée", "info");
    });
  }

  // Bouton Commutateur Vue CARTE (Topographique)
  if (btnMapTopo) {
    btnMapTopo.addEventListener('click', (e) => {
      e.preventDefault();
      if (!leafletMap) return;
      if (satelliteGroup) leafletMap.removeLayer(satelliteGroup);
      if (topoLayer) topoLayer.addTo(leafletMap);
      btnMapTopo.classList.add('active');
      btnMapSatellite?.classList.remove('active');
      showToast("🗺️ Vue Carte Topographique activée", "info");
    });
  }

  // Bouton Plein Écran / Agrandir la hauteur de la carte
  if (mapExpandBtn) {
    mapExpandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!interactiveMapViewport) return;
      interactiveMapViewport.classList.toggle('expanded');
      const isExpanded = interactiveMapViewport.classList.contains('expanded');
      mapExpandBtn.textContent = isExpanded ? '⛶ RÉDUIRE' : '⛶ PLEIN ÉCRAN';
      setTimeout(() => {
        if (leafletMap) leafletMap.invalidateSize();
      }, 260);
    });
  }

  // Synchronisation lors de la sélection du site dans la liste déroulante
  if (siteSelect) {
    siteSelect.addEventListener('change', () => {
      const permit = GEOLOGY_SCHEMA.sites.find(s => s.id === siteSelect.value);
      if (permit) {
        if (permit.primarySubstances?.length > 0 && substanceSelect) {
          substanceSelect.value = permit.primarySubstances[0];
        }

        if (permit.approxCoords) {
          updatePositionFromCoords(permit.approxCoords.lat, permit.approxCoords.lng, permit.id, true);
          if (leafletMap) {
            leafletMap.flyTo([permit.approxCoords.lat, permit.approxCoords.lng], 12, { duration: 1.0 });
          }
        }
      }
    });
  }

  // Bouton "Fixer GPS"
  if (mapGpsFixBtn) {
    mapGpsFixBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      showToast("📡 Acquisition du signal GNSS satellite...", "warning");

      const currentPermit = GEOLOGY_SCHEMA.sites.find(s => s.id === siteSelect?.value);
      const siteCode = currentPermit ? currentPermit.code : 'PE47';

      try {
        const fix = await window.geoLocator.captureFieldPosition(siteCode);
        updatePositionFromCoords(fix.latitude, fix.longitude);
        if (leafletMap) {
          leafletMap.flyTo([fix.latitude, fix.longitude], 15, { duration: 1.2 });
        }
        showToast(`📍 GPS Fixé : ±${fix.accuracyM}m (${fix.utm})`, "success");
      } catch (err) {
        showToast("Erreur GNSS : " + err.message, "error");
      }
    });
  }

  // ==========================================================================
  // 5. GESTION DES PIÈCES JOINTES (PHOTOS CAROTTES / AFFLEUREMENTS / PDF)
  // ==========================================================================

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Ko';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} Ko`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} Mo`;
  }

  function handleAttachmentFile(file) {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("Le fichier dépasse la limite recommandée de 8 Mo.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const isImage = file.type.startsWith('image/');

      currentAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: dataUrl,
        timestamp: new Date().toISOString()
      };

      if (attachmentThumbPreview) {
        if (isImage) {
          attachmentThumbPreview.innerHTML = `<img src="${dataUrl}" alt="Aperçu" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
          attachmentThumbPreview.innerHTML = `📄`;
        }
      }

      if (attachmentFileName) attachmentFileName.textContent = file.name;
      if (attachmentFileSize) attachmentFileSize.textContent = formatFileSize(file.size);

      if (attachmentPreviewBox) attachmentPreviewBox.classList.add('active');
      if (attachmentDropzone) attachmentDropzone.style.display = 'none';
      if (attachmentCountLabel) attachmentCountLabel.textContent = '1 FICHIER';

      showToast(`Pièce jointe ajoutée : ${file.name}`, "success");
    };

    reader.onerror = () => {
      showToast("Erreur de lecture du fichier sélectionné.", "error");
    };

    reader.readAsDataURL(file);
  }

  function clearCurrentAttachment() {
    currentAttachment = null;
    if (attachmentFileInput) attachmentFileInput.value = '';
    if (attachmentPreviewBox) attachmentPreviewBox.classList.remove('active');
    if (attachmentDropzone) attachmentDropzone.style.display = 'flex';
    if (attachmentCountLabel) attachmentCountLabel.textContent = '0 FICHIER';
    if (attachmentThumbPreview) attachmentThumbPreview.innerHTML = '📄';
  }

  // Événements de sélection et drag & drop
  if (attachmentDropzone && attachmentFileInput) {
    attachmentDropzone.addEventListener('click', () => {
      attachmentFileInput.click();
    });

    attachmentFileInput.addEventListener('change', () => {
      if (attachmentFileInput.files && attachmentFileInput.files[0]) {
        handleAttachmentFile(attachmentFileInput.files[0]);
      }
    });

    // Drag & Drop
    attachmentDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      attachmentDropzone.style.borderColor = '#00478f';
      attachmentDropzone.style.background = '#eff6ff';
    });

    attachmentDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      attachmentDropzone.style.borderColor = '';
      attachmentDropzone.style.background = '';
    });

    attachmentDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      attachmentDropzone.style.borderColor = '';
      attachmentDropzone.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleAttachmentFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (removeAttachmentBtn) {
    removeAttachmentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearCurrentAttachment();
      showToast("Pièce jointe retirée.", "info");
    });
  }

  // ==========================================================================
  // 6. REMPLISSAGE DÉMO RAPIDE (AVEC PHOTO CAROTTE FORAGE)
  // ==========================================================================
  const DEMO_CORE_SVG_DATA = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <rect width="400" height="240" fill="#0f172a"/>
  <!-- Tube de carottier -->
  <rect x="25" y="30" width="350" height="75" rx="4" fill="#64748b" stroke="#000" stroke-width="2"/>
  <rect x="25" y="130" width="350" height="75" rx="4" fill="#475569" stroke="#000" stroke-width="2"/>
  <!-- Fractures et veines quartzeuses minéralisées (Or visible) -->
  <path d="M 80 30 Q 120 65 140 105 M 200 30 Q 220 50 250 105 M 290 30 L 320 105" stroke="#fde047" stroke-width="4.5" fill="none" opacity="0.9"/>
  <circle cx="125" cy="70" r="4.5" fill="#facc15" stroke="#000" stroke-width="1"/>
  <circle cx="215" cy="55" r="3.5" fill="#facc15" stroke="#000" stroke-width="1"/>
  <circle cx="305" cy="85" r="4" fill="#facc15" stroke="#000" stroke-width="1"/>
  <path d="M 60 130 Q 90 165 110 205 M 180 130 Q 230 170 270 205" stroke="#fde047" stroke-width="5" fill="none" opacity="0.9"/>
  <circle cx="95" cy="170" r="4" fill="#facc15" stroke="#000" stroke-width="1"/>
  <circle cx="240" cy="180" r="5" fill="#facc15" stroke="#000" stroke-width="1"/>
  <!-- Textes techniques de carothèque -->
  <rect x="30" y="35" width="230" height="18" fill="#000" opacity="0.75"/>
  <text x="35" y="48" font-family="monospace" font-size="10" fill="#facc15" font-weight="bold">FORAGE DDH-GAG-18 • GAGNOA PR962</text>
  <rect x="30" y="135" width="220" height="18" fill="#000" opacity="0.75"/>
  <text x="35" y="148" font-family="monospace" font-size="10" fill="#38bdf8" font-weight="bold">PASSE: 14.2m - 16.5m (HQ) • Au+Bi</text>
</svg>
  `);

  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', () => {
      // 1. Permis Gagnoa PR962
      siteSelect.value = "PERMIS-PR962";
      substanceSelect.value = "SUBST_AU";
      categorySelect.value = "CAT_RESOURCE_DEF";
      progressSlider.value = 65;
      progressValDisplay.textContent = "65%";

      // 2. Statut Incident
      document.querySelectorAll('.status-choice-btn').forEach(b => b.classList.remove('selected'));
      const incidentBtn = document.querySelector('.status-choice-btn[data-value="STAT_ANOMALY_FOUND"]');
      if (incidentBtn) incidentBtn.classList.add('selected');
      selectedStatusInput.value = "STAT_ANOMALY_FOUND";

      // 3. Message clé
      keyMessageInput.value = "Inspection Forage DDH-GAG-18 (Gagnoa PR962) : filon quartzeux minéralisé recoupé sur 14.8m. Or visible et anomalie bismuth > 450 ppm.";

      // 4. Centrage de la carte satellite sur Gagnoa PR962
      updatePositionFromCoords(6.1319, -5.9506, "PERMIS-PR962", true);
      if (leafletMap) {
        leafletMap.flyTo([6.1319, -5.9506], 13, { duration: 1.0 });
      }

      // 5. Injection de la photo de carotte de démonstration
      currentAttachment = {
        name: "carotte_forage_DDH_GAG18.svg",
        type: "image/svg+xml",
        size: 28400,
        dataUrl: DEMO_CORE_SVG_DATA,
        timestamp: new Date().toISOString()
      };

      if (attachmentThumbPreview) {
        attachmentThumbPreview.innerHTML = `<img src="${DEMO_CORE_SVG_DATA}" alt="Carotte de forage" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
      if (attachmentFileName) attachmentFileName.textContent = currentAttachment.name;
      if (attachmentFileSize) attachmentFileSize.textContent = formatFileSize(currentAttachment.size);
      if (attachmentPreviewBox) attachmentPreviewBox.classList.add('active');
      if (attachmentDropzone) attachmentDropzone.style.display = 'none';
      if (attachmentCountLabel) attachmentCountLabel.textContent = '1 FICHIER';

      showToast("Données démo Gagnoa + Vue Satellite + Photo carotte chargées !", "success");
    });
  }

  // ==========================================================================
  // 7. ENREGISTREMENT DU FORMULAIRE TERRAIN DANS INDEXEDDB
  // ==========================================================================
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const permit = GEOLOGY_SCHEMA.sites.find(s => s.id === siteSelect.value) || {
        id: siteSelect.value || "PERMIS-PE47",
        name: "Bongouanou",
        code: "PE47",
        region: "Moronou"
      };

      const substance = GEOLOGY_SCHEMA.substances.find(s => s.code === substanceSelect.value) || {
        code: substanceSelect.value || "SUBST_BX",
        label: "Bauxite",
        symbol: "Al"
      };

      const category = GEOLOGY_SCHEMA.categories.find(c => c.code === categorySelect.value) || {
        code: categorySelect.value || "CAT_GREENFIELD",
        label: "Exploration"
      };

      const statusCode = selectedStatusInput.value || "STAT_IN_PROGRESS";
      const statusObj = GEOLOGY_SCHEMA.statuses.find(st => st.code === statusCode) || {
        code: statusCode,
        label: statusCode === "STAT_ANOMALY_FOUND" ? "INCIDENT" : "EN COURS",
        severity: statusCode === "STAT_ANOMALY_FOUND" ? "CRITICAL" : "INFO"
      };

      const recordId = `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      const newRecord = {
        id: recordId,
        company: "GROUPE LEA",
        site: permit,
        substance: substance,
        category: category,
        progress: {
          stageCode: "STAGE_DRILL_DDH",
          stageLabel: category.label,
          percentCompleted: parseInt(progressSlider.value, 10),
          metricValue: Math.round(parseInt(progressSlider.value, 10) * 8),
          metricUnit: "mètres"
        },
        status: statusObj,
        targetAudience: {
          code: "AUD_PIPELINE_ALY",
          label: "Pipeline Aly"
        },
        keyMessage: {
          typeCode: statusCode === "STAT_ANOMALY_FOUND" ? "MSG_ANOMALY_ALERT" : "MSG_DAILY_PROGRESS",
          executiveSummary: keyMessageInput.value || "Rapport d'activité journalier",
          tags: ["#Terrain", `#${permit.code}`]
        },
        coordinates: { ...currentRecordCoords },
        attachment: currentAttachment ? { ...currentAttachment } : null,
        geologist: {
          id: "GEO-LEA-01",
          name: "Opérateur Terrain"
        },
        metadata: {
          createdAt: new Date().toISOString(),
          clientCompany: "GROUPE LEA",
          syncStatus: window.fieldStorage.isActuallyOnline() ? "SYNCED" : "PENDING_OFFLINE"
        }
      };

      try {
        await window.fieldStorage.saveRecord(newRecord);
        showToast("Rapport enregistré avec succès !", "success");
        
        // Réinitialise le formulaire
        form.reset();
        progressSlider.value = 0;
        progressValDisplay.textContent = "0%";
        document.querySelectorAll('.status-choice-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('.status-choice-btn[data-value="STAT_IN_PROGRESS"]')?.classList.add('selected');
        selectedStatusInput.value = "STAT_IN_PROGRESS";
        
        // Réinitialiser la pièce jointe
        clearCurrentAttachment();

        // Réinitialiser la position satellite sur Bongouanou (PE47)
        updatePositionFromCoords(6.6508, -4.7042, "PERMIS-PE47", true);
        if (leafletMap) {
          leafletMap.flyTo([6.6508, -4.7042], 10);
        }

        // Bascule vers l'historique pour afficher le rapport
        document.querySelector('.nav-tab-item[data-tab="tabHistory"]')?.click();
      } catch (err) {
        showToast("Erreur d'enregistrement : " + err.message, "error");
      }
    });
  }

  // ==========================================================================
  // 8. RENDU DE L'HISTORIQUE DES RAPPORTS
  // ==========================================================================
  async function renderReportsList() {
    if (!reportsListContainer) return;

    const allRecords = await window.fieldStorage.getAllRecords();
    const query = (reportSearchInput?.value || '').toLowerCase().trim();
    const filter = reportFilterSelect?.value || 'ALL';

    const filtered = allRecords.filter(r => {
      if (filter === 'PENDING' && r.metadata?.syncStatus === 'SYNCED') return false;
      if (filter === 'INCIDENT' && r.status?.code !== 'STAT_ANOMALY_FOUND') return false;
      if (query) {
        const text = `${r.id} ${r.site?.name} ${r.substance?.label} ${r.keyMessage?.executiveSummary}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      reportsListContainer.innerHTML = `
        <div style="border: 2px dashed #000; padding: 2rem; text-align: center; font-family: var(--font-mono); font-size: 0.85rem; background: #fff;">
          Aucun rapport ne correspond aux filtres.
        </div>
      `;
      return;
    }

    reportsListContainer.innerHTML = filtered.map(r => {
      const isSynced = r.metadata?.syncStatus === 'SYNCED';
      const statusBadgeHtml = isSynced 
        ? `<div class="status-badge-mining synced"><span>■</span> <span>Synchronisé</span></div>`
        : `<div class="status-badge-mining pending"><span>■</span> <span>En attente</span></div>`;

      const actionBtnHtml = isSynced
        ? `<button class="btn-report-action view-btn" data-id="${r.id}"><span>👁</span> <span>Voir</span></button>`
        : `<button class="btn-report-action yellow retry-btn" data-id="${r.id}"><span>🔄</span> <span>Ressayer</span></button>`;

      const displayTitle = r.keyMessage?.executiveSummary && r.keyMessage.executiveSummary.length > 30
        ? r.keyMessage.executiveSummary.slice(0, 32) + '...'
        : (r.keyMessage?.executiveSummary || `${r.site?.name} - ${r.substance?.label}`);

      const attachmentBadgeHtml = r.attachment
        ? `<div class="attachment-pill">📎 <span>${escapeHtml(r.attachment.name)}</span> (${formatFileSize(r.attachment.size)})</div>`
        : '';

      return `
        <article class="report-card">
          <div class="report-card-header">
            <span>${r.id}</span>
            <span style="letter-spacing: 0.1em; cursor: pointer;">•••</span>
          </div>
          <div class="report-card-body">
            <h3 class="report-title">${escapeHtml(displayTitle)}</h3>
            <div class="report-meta">
              <span>📅</span>
              <span>${formatReportDate(r.metadata?.createdAt)}</span>
              <span>•</span>
              <span>📍 ${r.site?.code || 'PE47'}</span>
            </div>
            ${attachmentBadgeHtml}
            <div class="report-card-footer">
              <div>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: #666; display: block; margin-bottom: 2px;">Statut</span>
                ${statusBadgeHtml}
              </div>
              <div>
                ${actionBtnHtml}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function formatReportDate(iso) {
    if (!iso) return "Récemment";
    try {
      const d = new Date(iso);
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Événements de recherche et filtres dans l'historique
  if (reportSearchInput) reportSearchInput.addEventListener('input', renderReportsList);
  if (reportFilterSelect) reportFilterSelect.addEventListener('change', renderReportsList);

  // Clics dans la liste des rapports (Voir / Ressayer)
  if (reportsListContainer) {
    reportsListContainer.addEventListener('click', async (e) => {
      const viewBtn = e.target.closest('.view-btn');
      if (viewBtn) {
        const id = viewBtn.dataset.id;
        const rec = await window.fieldStorage.getRecordById(id);
        if (rec) openDetailModal(rec);
        return;
      }

      const retryBtn = e.target.closest('.retry-btn');
      if (retryBtn) {
        quickSyncHandler();
      }
    });
  }

  // ==========================================================================
  // 9. MODAL DÉTAIL DU RAPPORT (AVEC APERÇU PIÈCE JOINTE)
  // ==========================================================================
  function openDetailModal(rec) {
    activeModalRecord = rec;
    modalTitle.textContent = rec.id;

    let attachmentModalHtml = '';
    if (rec.attachment) {
      const isImg = rec.attachment.type?.startsWith('image/') || rec.attachment.name?.endsWith('.svg') || rec.attachment.name?.endsWith('.png') || rec.attachment.name?.endsWith('.jpg');
      attachmentModalHtml = `
        <div class="modal-attachment-preview">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>📎 PIÈCE JOINTE TERRAIN :</strong>
            <span style="font-size: 0.72rem; color: #64748b;">${formatFileSize(rec.attachment.size)}</span>
          </div>
          <div style="font-size: 0.75rem; margin-top: 4px; font-weight: 700; color: #1e293b;">
            ${escapeHtml(rec.attachment.name)}
          </div>
          ${isImg && rec.attachment.dataUrl ? `
            <img src="${rec.attachment.dataUrl}" class="modal-attachment-img" alt="Photo de terrain">
          ` : `
            <div style="padding: 0.8rem; text-align: center; background: #e2e8f0; border: 1px dashed #000; margin-top: 6px; font-size: 1.2rem;">
              📄 Document PDF joint
            </div>
          `}
          ${rec.attachment.dataUrl ? `
            <div style="margin-top: 0.5rem; text-align: right;">
              <a href="${rec.attachment.dataUrl}" download="${escapeHtml(rec.attachment.name)}" class="btn-report-action yellow" style="font-size: 0.72rem; text-decoration: none;">
                ⬇ Télécharger le fichier
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 0.82rem; margin-bottom: 0.85rem; line-height: 1.6;">
        <strong>PERMIS :</strong> ${rec.site?.code} — ${rec.site?.name} (${rec.site?.region})<br>
        <strong>SUBSTANCE :</strong> ${rec.substance?.label}<br>
        <strong>AVANCEMENT :</strong> ${rec.progress?.percentCompleted}%<br>
        <strong>STATUT :</strong> ${rec.status?.label}<br>
        <strong>COORDONNÉES :</strong> ${rec.coordinates?.latitude}°, ${rec.coordinates?.longitude}° (${rec.coordinates?.utm || 'Zone 30N'})
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem;">
        <strong>OBSERVATIONS :</strong><br>
        <p style="margin-top: 0.35rem; color: #111;">${escapeHtml(rec.keyMessage?.executiveSummary || '')}</p>
      </div>
      ${attachmentModalHtml}
    `;
    detailModal.classList.add('open');
  }

  function closeDetailModal() {
    detailModal.classList.remove('open');
    activeModalRecord = null;
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeDetailModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', () => {
      if (activeModalRecord) {
        navigator.clipboard.writeText(JSON.stringify(activeModalRecord, null, 2));
        showToast("JSON copié !", "success");
      }
    });
  }

  // ==========================================================================
  // 10. SYNCHRONISATION RÉSEAU VERS LE PIPELINE D'ALY (/api/sync)
  // ==========================================================================
  async function quickSyncHandler() {
    showToast("Synchronisation en cours avec Aly...", "warning");
    try {
      const res = await window.fieldStorage.syncAllPending();
      if (res.totalPending === 0) {
        showToast("Tous les rapports sont synchronisés.", "success");
      } else {
        showToast(`${res.successCount} rapport(s) synchronisé(s) !`, "success");
      }
      renderReportsList();
      updateDashboardKPIs();
    } catch (err) {
      showToast("Échec de la synchro : " + err.message, "error");
    }
  }

  if (quickSyncBtn) quickSyncBtn.addEventListener('click', quickSyncHandler);

  // ==========================================================================
  // 11. DASHBOARD KPIS
  // ==========================================================================
  async function updateDashboardKPIs() {
    const stats = await window.fieldStorage.getStats();
    if (kpiTotalRecords) kpiTotalRecords.textContent = stats.total;
    if (kpiSitesCount) kpiSitesCount.textContent = GEOLOGY_SCHEMA.sites.length;
  }

  // ==========================================================================
  // 12. EXPORTS DE FICHIERS (CSV / GEOJSON QGIS / JSON BATCH)
  // ==========================================================================
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      const all = await window.fieldStorage.getAllRecords();
      const csvStr = window.pipelineExporter.generateCSV(all);
      window.pipelineExporter.downloadFile(csvStr, `CORE_MINING_REPORTS_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
      showToast("Fichier CSV téléchargé !", "success");
    });
  }

  if (exportGeoJsonBtn) {
    exportGeoJsonBtn.addEventListener('click', async () => {
      const all = await window.fieldStorage.getAllRecords();
      const geoStr = window.pipelineExporter.generateGeoJSON(all);
      window.pipelineExporter.downloadFile(geoStr, `CORE_MINING_SIG_${new Date().toISOString().slice(0, 10)}.geojson`, "application/geo+json");
      showToast("Couche QGIS téléchargée !", "success");
    });
  }

  if (exportJsonBatchBtn) {
    exportJsonBatchBtn.addEventListener('click', async () => {
      const all = await window.fieldStorage.getAllRecords();
      const jsonStr = window.pipelineExporter.generateJSONBatch(all);
      window.pipelineExporter.downloadFile(jsonStr, `CORE_MINING_ALY_BATCH_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
      showToast("Lot JSON Aly exporté !", "success");
    });
  }

  if (viewJsonSchemaBtn) {
    viewJsonSchemaBtn.addEventListener('click', () => {
      const schema = window.pipelineExporter.getJSONSchemaDefinition();
      activeModalRecord = schema;
      modalTitle.textContent = "SCHÉMA V7 • PIPELINE ALY";
      modalBody.innerHTML = `<pre style="font-family: var(--font-mono); font-size: 0.72rem; max-height: 350px; overflow-y: auto;">${escapeHtml(JSON.stringify(schema, null, 2))}</pre>`;
      detailModal.classList.add('open');
    });
  }

  // ==========================================================================
  // 13. TOAST FEEDBACK NÉO-BRUTALISTE
  // ==========================================================================
  function showToast(message, type = "info") {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // ==========================================================================
  // 14. INITIALISATION DE L'APPLICATION
  // ==========================================================================
  await window.fieldStorage.seedDemoRecordsIfEmpty();
  await updateDashboardKPIs();
  await renderReportsList();
});
