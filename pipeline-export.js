/**
 * GÉO-TERRAIN - MODULE D'EXPORTATION & INTEROPÉRABILITÉ POUR LE RÔLE 1 (ALY)
 * Adapté aux flux de données multi-permis et multi-entités du Groupe LEA
 */

class PipelineExporter {
  constructor() {
    this.alyPipelineVersion = "2.0.0-LEA";
  }

  getJSONSchemaDefinition() {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "LeaGeologyFieldRecord",
      "description": "Fiche de relevé géologique terrain structurée pour le portefeuille multi-permis du Groupe LEA et le pipeline du Rôle 1 (Aly)",
      "type": "object",
      "required": ["id", "groupEntity", "site", "substance", "category", "progress", "status", "targetAudience", "keyMessage", "coordinates", "metadata"],
      "properties": {
        "id": { "type": "string" },
        "groupEntity": {
          "type": "object",
          "required": ["code", "label"],
          "properties": {
            "code": { "type": "string", "enum": ["LEA_EXPLORATION", "LIZETTA_MINES", "AMG_LOGISTICS"] },
            "label": { "type": "string" }
          }
        },
        "site": {
          "type": "object",
          "required": ["id", "name", "code", "region", "surfaceKm2"],
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "code": { "type": "string", "enum": ["PE47", "PR303", "PR302", "PR962", "PR964"] },
            "region": { "type": "string" },
            "country": { "type": "string" },
            "surfaceKm2": { "type": "number" },
            "partner": { "type": "string" }
          }
        },
        "substance": {
          "type": "object",
          "required": ["code", "label", "symbol"],
          "properties": {
            "code": { "type": "string", "enum": ["SUBST_BX", "SUBST_AU", "SUBST_MN", "SUBST_NI", "SUBST_CO", "SUBST_CR", "SUBST_BI", "SUBST_LI", "SUBST_FE"] },
            "label": { "type": "string" },
            "symbol": { "type": "string" },
            "unit": { "type": "string" }
          }
        },
        "category": {
          "type": "object",
          "required": ["code", "label"],
          "properties": {
            "code": { "type": "string" },
            "label": { "type": "string" }
          }
        },
        "progress": {
          "type": "object",
          "required": ["stageCode", "stageLabel", "percentCompleted"],
          "properties": {
            "stageCode": { "type": "string" },
            "stageLabel": { "type": "string" },
            "percentCompleted": { "type": "number", "minimum": 0, "maximum": 100 },
            "metricValue": { "type": "number" },
            "metricUnit": { "type": "string" },
            "samplesCount": { "type": "integer" }
          }
        },
        "status": {
          "type": "object",
          "required": ["code", "label", "severity"],
          "properties": {
            "code": { "type": "string" },
            "label": { "type": "string" },
            "severity": { "type": "string" },
            "flagAly": { "type": "string" }
          }
        },
        "targetAudience": {
          "type": "object",
          "required": ["code", "label"],
          "properties": {
            "code": { "type": "string" },
            "label": { "type": "string" }
          }
        },
        "keyMessage": {
          "type": "object",
          "required": ["typeCode", "executiveSummary"],
          "properties": {
            "typeCode": { "type": "string" },
            "typeLabel": { "type": "string" },
            "priority": { "type": "string" },
            "tags": { "type": "array", "items": { "type": "string" } },
            "executiveSummary": { "type": "string", "minLength": 5 },
            "recommendedAction": { "type": "string" }
          }
        },
        "coordinates": {
          "type": "object",
          "required": ["latitude", "longitude", "datum"],
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" },
            "altitudeM": { "type": "number" },
            "accuracyM": { "type": "number" },
            "datum": { "type": "string" },
            "utm": { "type": "string" }
          }
        },
        "metadata": {
          "type": "object",
          "required": ["createdAt", "syncStatus"],
          "properties": {
            "createdAt": { "type": "string" },
            "clientCompany": { "type": "string" },
            "syncStatus": { "type": "string" }
          }
        }
      }
    };
  }

  generateJSONBatch(records) {
    const payload = {
      exportMetadata: {
        generator: "GéoTerrain-MobileFieldApp-LEA",
        company: "GROUPE LEA (Côte d'Ivoire)",
        targetPipeline: "ROLE_1_ALY",
        exportedAtUTC: new Date().toISOString(),
        recordsCount: records.length,
        pipelineProtocolVersion: this.alyPipelineVersion
      },
      records: records
    };
    return JSON.stringify(payload, null, 2);
  }

  generateGeoJSON(records) {
    const features = records.map(r => {
      const lat = r.coordinates ? r.coordinates.latitude : 0;
      const lng = r.coordinates ? r.coordinates.longitude : 0;
      const alt = r.coordinates ? (r.coordinates.altitudeM || 0) : 0;

      return {
        type: "Feature",
        id: r.id,
        geometry: {
          type: "Point",
          coordinates: [lng, lat, alt]
        },
        properties: {
          recordId: r.id,
          company: "GROUPE LEA",
          groupEntityCode: r.groupEntity?.code,
          groupEntityLabel: r.groupEntity?.label,
          permitCode: r.site?.code,
          permitName: r.site?.name,
          region: r.site?.region,
          surfaceKm2: r.site?.surfaceKm2,
          partner: r.site?.partner,
          substanceCode: r.substance?.code,
          substanceLabel: r.substance?.label,
          substanceSymbol: r.substance?.symbol,
          categoryCode: r.category?.code,
          stageCode: r.progress?.stageCode,
          stageLabel: r.progress?.stageLabel,
          percentCompleted: r.progress?.percentCompleted,
          metricValue: r.progress?.metricValue,
          metricUnit: r.progress?.metricUnit,
          samplesCount: r.progress?.samplesCount || 0,
          statusCode: r.status?.code,
          statusLabel: r.status?.label,
          targetAudienceCode: r.targetAudience?.code,
          targetAudienceLabel: r.targetAudience?.label,
          messageType: r.keyMessage?.typeCode,
          messageTags: (r.keyMessage?.tags || []).join(';'),
          executiveSummary: r.keyMessage?.executiveSummary,
          recommendedAction: r.keyMessage?.recommendedAction,
          geologistName: r.geologist?.name,
          accuracyM: r.coordinates?.accuracyM,
          utmProjection: r.coordinates?.utm || "Zone 30N (Côte d'Ivoire)",
          createdAt: r.metadata?.createdAt,
          syncStatus: r.metadata?.syncStatus
        }
      };
    });

    const geoJson = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      metadata: {
        company: "GROUPE LEA",
        exportedAt: new Date().toISOString(),
        count: features.length,
        target: "ROLE_1_ALY_GIS"
      },
      features: features
    };

    return JSON.stringify(geoJson, null, 2);
  }

  generateCSV(records) {
    const headers = [
      "record_id",
      "company",
      "group_entity",
      "permit_code",
      "permit_name",
      "region",
      "surface_km2",
      "partner",
      "substance_code",
      "substance_label",
      "substance_symbol",
      "category_code",
      "stage_code",
      "stage_label",
      "progress_percent",
      "metric_value",
      "metric_unit",
      "samples_count",
      "status_code",
      "status_label",
      "target_audience",
      "key_message_type",
      "key_message_tags",
      "executive_summary",
      "recommended_action",
      "latitude",
      "longitude",
      "altitude_m",
      "accuracy_m",
      "utm_zone",
      "geologist_name",
      "created_at_utc",
      "sync_status"
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
      return `"${str}"`;
    };

    const rows = records.map(r => [
      escapeCSV(r.id),
      escapeCSV("GROUPE LEA"),
      escapeCSV(r.groupEntity?.label),
      escapeCSV(r.site?.code),
      escapeCSV(r.site?.name),
      escapeCSV(r.site?.region),
      escapeCSV(r.site?.surfaceKm2),
      escapeCSV(r.site?.partner),
      escapeCSV(r.substance?.code),
      escapeCSV(r.substance?.label),
      escapeCSV(r.substance?.symbol),
      escapeCSV(r.category?.code),
      escapeCSV(r.progress?.stageCode),
      escapeCSV(r.progress?.stageLabel),
      escapeCSV(r.progress?.percentCompleted),
      escapeCSV(r.progress?.metricValue),
      escapeCSV(r.progress?.metricUnit),
      escapeCSV(r.progress?.samplesCount || 0),
      escapeCSV(r.status?.code),
      escapeCSV(r.status?.label),
      escapeCSV(r.targetAudience?.label),
      escapeCSV(r.keyMessage?.typeCode),
      escapeCSV((r.keyMessage?.tags || []).join('; ')),
      escapeCSV(r.keyMessage?.executiveSummary),
      escapeCSV(r.keyMessage?.recommendedAction),
      escapeCSV(r.coordinates?.latitude),
      escapeCSV(r.coordinates?.longitude),
      escapeCSV(r.coordinates?.altitudeM),
      escapeCSV(r.coordinates?.accuracyM),
      escapeCSV(r.coordinates?.utm || "Zone 30N"),
      escapeCSV(r.geologist?.name),
      escapeCSV(r.metadata?.createdAt),
      escapeCSV(r.metadata?.syncStatus)
    ].join(","));

    return [headers.join(","), ...rows].join("\r\n");
  }

  downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

window.pipelineExporter = new PipelineExporter();
