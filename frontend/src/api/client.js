import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStations = async () => {
  const res = await api.get('/stations');
  return res.data;
};

export const getReadings = async (stationId = null, hours = 72, anomaliesOnly = false) => {
  const params = { hours };
  if (stationId) params.station_id = stationId;
  if (anomaliesOnly) params.anomalies_only = true;
  const res = await api.get('/readings', { params });
  return res.data;
};

export const getLatestReadings = async (stationId = null) => {
  const params = stationId ? { station_id: stationId } : {};
  const res = await api.get('/readings/latest', { params });
  return res.data;
};

export const getForecast = async (stationId, hours = 48) => {
  const res = await api.get(`/ml/forecast/${stationId}`, { params: { hours } });
  return res.data;
};

export const getAlerts = async (stationId = null, severity = null, acknowledged = null) => {
  const params = {};
  if (stationId) params.station_id = stationId;
  if (severity) params.severity = severity;
  if (acknowledged !== null) params.acknowledged = acknowledged;
  const res = await api.get('/alerts', { params });
  return res.data;
};

export const getAlertsSummary = async () => {
  const res = await api.get('/alerts/summary');
  return res.data;
};

export const acknowledgeAlert = async (alertId, acknowledgedBy = 'Water Quality Engineer') => {
  const res = await api.post(`/alerts/${alertId}/acknowledge`, { acknowledged_by: acknowledgedBy });
  return res.data;
};

export const acknowledgeAllAlerts = async (stationId = null, acknowledgedBy = 'Water Quality Engineer') => {
  const params = stationId ? { station_id: stationId } : {};
  const res = await api.post('/alerts/acknowledge-all', { acknowledged_by: acknowledgedBy }, { params });
  return res.data;
};

export const predictWaterSample = async (sampleData) => {
  const res = await api.post('/ml/predict', sampleData);
  return res.data;
};

export const getModelInfo = async () => {
  const res = await api.get('/ml/model-info');
  return res.data;
};

export const triggerRetrain = async () => {
  const res = await api.post('/ml/retrain');
  return res.data;
};

export const getAnomalies = async (stationId = null) => {
  const params = stationId ? { station_id: stationId } : {};
  const res = await api.get('/anomalies', { params });
  return res.data;
};

export const getAnomalySummary = async () => {
  const res = await api.get('/anomalies/summary');
  return res.data;
};

export const triggerSimulatorTick = async (stationId = null) => {
  const params = stationId ? { station_id: stationId } : {};
  const res = await api.post('/simulator/tick', null, { params });
  return res.data;
};

export const injectAnomalyEvent = async (stationId, anomalyType) => {
  const res = await api.post('/simulator/inject-anomaly', {
    station_id: stationId,
    anomaly_type: anomalyType,
  });
  return res.data;
};

export const uploadCsvAndPredict = async (formData) => {
  const res = await api.post('/ml/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getComplianceReport = async (days = 14) => {
  const res = await api.get('/reports/compliance', { params: { days } });
  return res.data;
};

export const getSampleCsvUrl = () => '/api/ml/sample-csv';
export const getExportReadingsUrl = (stationId = null, days = 14) => {
  const query = new URLSearchParams({ days });
  if (stationId) query.append('station_id', stationId);
  return `/api/reports/export-readings-csv?${query.toString()}`;
};

// Water Report Analysis APIs
export const extractWaterReport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/water-reports/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeWaterReport = async (data) => {
  const res = await api.post('/water-reports/analyze', data);
  return res.data;
};

export const getReportHistory = async (limit = 50) => {
  const res = await api.get('/water-reports/history', { params: { limit } });
  return res.data;
};

export const getReportDetail = async (reportId) => {
  const res = await api.get(`/water-reports/history/${reportId}`);
  return res.data;
};

export const deleteReport = async (reportId) => {
  const res = await api.delete(`/water-reports/history/${reportId}`);
  return res.data;
};

export const getReportPdfUrl = (reportId) => `/api/water-reports/download-pdf/${reportId}`;

export const getSamplePresets = async () => {
  const res = await api.get('/water-reports/sample-presets');
  return res.data;
};

export default api;
