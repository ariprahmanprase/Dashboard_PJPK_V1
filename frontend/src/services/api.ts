import axios from 'axios';
import type { FilterOptions, Scorecards, TableRow, DashboardFilters } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

export async function fetchFilters(): Promise<FilterOptions> {
  const { data } = await api.get('/filters');
  return data;
}

export async function fetchScorecards(filters: DashboardFilters): Promise<Scorecards> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
  const { data } = await api.get('/dashboard/scorecards', { params });
  return data;
}

export async function fetchTable(filters: DashboardFilters): Promise<TableRow[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
  const { data } = await api.get('/dashboard/table', { params });
  return data;
}
