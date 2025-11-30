import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Target {
  _id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  basePayload?: Record<string, any>;
  headers?: Record<string, string>;
  createdAt: string;
}

export interface ScenarioMetrics {
  name: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCodeCounts: Record<string, number>;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  timeoutCount?: number;
  errors?: string[];
}

export interface ChaosTest {
  _id: string;
  targetId: Target | string;
  scenarios: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  metrics?: ScenarioMetrics[];
  aiReportId?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AIReport {
  _id: string;
  testId: string;
  title: string;
  summary: string;
  timeline: string[];
  recommendations: string[];
  createdAt: string;
}

// Targets API
export const targetsApi = {
  getAll: () => api.get<{ targets: Target[] }>('/targets'),
  getById: (id: string) => api.get<{ target: Target }>(`/targets/${id}`),
  create: (data: Omit<Target, '_id' | 'createdAt'>) => api.post<{ target: Target }>('/targets', data),
  delete: (id: string) => api.delete(`/targets/${id}`),
};

// Tests API
export const testsApi = {
  getAll: () => api.get<{ tests: ChaosTest[] }>('/tests'),
  getById: (id: string) => api.get<{ test: ChaosTest }>(`/tests/${id}`),
  create: (data: { targetId: string; scenarios: string[] }) => 
    api.post<{ testId: string; status: string }>('/tests', data),
};

// Reports API
export const reportsApi = {
  getById: (id: string) => api.get<{ report: AIReport }>(`/reports/${id}`),
  getByTestId: (testId: string) => api.get<{ report: AIReport }>(`/reports/test/${testId}`),
};

export default api;