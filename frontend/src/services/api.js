const API_BASE = '/api';

export const fetchDashboardData = async () => {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
};

export const fetchTenders = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.risk_level && params.risk_level !== 'All') searchParams.append('risk_level', params.risk_level);
  if (params.category && params.category !== 'All') searchParams.append('category', params.category);
  if (params.location && params.location !== 'All') searchParams.append('location', params.location);
  if (params.search) searchParams.append('search', params.search);
  
  const res = await fetch(`${API_BASE}/tenders?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tenders');
  return res.json();
};

export const fetchTenderDetail = async (tenderId) => {
  const res = await fetch(`${API_BASE}/tenders/${tenderId}`);
  if (!res.ok) throw new Error(`Failed to fetch tender ${tenderId}`);
  return res.json();
};

export const fetchBidders = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.risk_level && params.risk_level !== 'All') searchParams.append('risk_level', params.risk_level);
  if (params.category && params.category !== 'All') searchParams.append('category', params.category);
  if (params.search) searchParams.append('search', params.search);

  const res = await fetch(`${API_BASE}/bidders?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch bidders');
  return res.json();
};

export const fetchBidderDetail = async (bidderId) => {
  const res = await fetch(`${API_BASE}/bidders/${bidderId}`);
  if (!res.ok) throw new Error(`Failed to fetch bidder ${bidderId}`);
  return res.json();
};

export const fetchNetworkData = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.min_shared) searchParams.append('min_shared', params.min_shared);
  if (params.only_suspicious) searchParams.append('only_suspicious', 'true');
  if (params.category && params.category !== 'All') searchParams.append('category', params.category);

  const res = await fetch(`${API_BASE}/network?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch network graph');
  return res.json();
};

export const fetchAlerts = async (status = 'All') => {
  const url = status && status !== 'All' ? `${API_BASE}/alerts?status=${status}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
};

export const updateAlertStatus = async (alertId, newStatus) => {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) throw new Error('Failed to update alert status');
  return res.json();
};

export const runDetectionPipeline = async () => {
  const res = await fetch(`${API_BASE}/detect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger detection pipeline');
  return res.json();
};

export const fetchDetectionStatus = async () => {
  const res = await fetch(`${API_BASE}/detect/status`);
  if (!res.ok) throw new Error('Failed to fetch detection status');
  return res.json();
};

export const fetchDemoScenarios = async () => {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch demo scenarios');
  return res.json();
};

export const runLiveDemoDetection = async () => {
  const res = await fetch(`${API_BASE}/demo/run-full-detection`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to execute demo detection');
  return res.json();
};

export const resetSampleDataset = async () => {
  const res = await fetch(`${API_BASE}/dataset/reset-sample`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset dataset');
  return res.json();
};

export const uploadDatasetCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/dataset/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload dataset CSV');
  }
  return res.json();
};

export const fetchReportsList = async () => {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports list');
  return res.json();
};

export const downloadReportPdfUrl = (tenderId) => {
  return `${API_BASE}/reports/${tenderId}/pdf`;
};
