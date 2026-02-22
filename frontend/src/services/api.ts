import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Models
export const modelsApi = {
  list: () => api.get('/models'),
  get: (id: string) => api.get(`/models/${id}`),
  create: (data: any) => api.post('/models', data),
  update: (id: string, data: any) => api.put(`/models/${id}`, data),
  delete: (id: string) => api.delete(`/models/${id}`),
  test: (id: string) => api.post(`/models/${id}/test`),
};

// TestSets
export const testsetsApi = {
  list: () => api.get('/testsets'),
  get: (id: string) => api.get(`/testsets/${id}`),
  create: (data: any) => api.post('/testsets', data),
  update: (id: string, data: any) => api.put(`/testsets/${id}`, data),
  delete: (id: string) => api.delete(`/testsets/${id}`),
  addCase: (id: string, data: any) => api.post(`/testsets/${id}/cases`, data),
  updateCase: (id: string, caseId: string, data: any) =>
    api.put(`/testsets/${id}/cases/${caseId}`, data),
  deleteCase: (id: string, caseId: string) =>
    api.delete(`/testsets/${id}/cases/${caseId}`),
  importCases: (id: string, cases: any[]) =>
    api.post(`/testsets/${id}/import`, cases),
};

// Eval
export const evalApi = {
  createCompare: (data: any) => api.post('/eval/compare', data),
  createBatch: (data: any) => api.post('/eval/batch', data),
  listSessions: (type?: string) =>
    api.get('/eval/sessions', { params: type ? { type } : undefined }),
  getSession: (id: string) => api.get(`/eval/sessions/${id}`),
  exportSession: (id: string) => api.get(`/eval/sessions/${id}/export`),
};

// Stats
export const statsApi = {
  overview: () => api.get('/stats/overview'),
  models: () => api.get('/stats/models'),
  trend: (days?: number) => api.get('/stats/trend', { params: days ? { days } : undefined }),
};

export default api;
