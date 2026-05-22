import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'helpdesk_token';
const USER_KEY = 'helpdesk_user';

export const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  return rawUser ? JSON.parse(rawUser) : null;
}

export async function login(email, password) {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
}

export async function fetchTickets(params = {}) {
  const response = await client.get('/tickets', { params });
  return response.data;
}

export async function fetchTicket(ticketId) {
  const response = await client.get(`/tickets/${ticketId}`);
  return response.data;
}

export async function createTicket(payload) {
  const response = await client.post('/tickets', payload);
  return response.data;
}

export async function updateTicket(ticketId, payload) {
  const response = await client.put(`/tickets/${ticketId}`, payload);
  return response.data;
}

export async function deleteTicket(ticketId) {
  await client.delete(`/tickets/${ticketId}`);
}

export async function searchTickets(params = {}) {
  const response = await client.get('/search', { params });
  return response.data;
}

export async function fetchAnalyticsSummary() {
  const response = await client.get('/analytics/summary');
  return response.data;
}

export async function fetchAnalyticsCategories() {
  const response = await client.get('/analytics/categories');
  return response.data;
}

export async function fetchAnalyticsPriorityDistribution() {
  const response = await client.get('/analytics/priority-distribution');
  return response.data;
}

export async function fetchAnalyticsDepartmentStats() {
  const response = await client.get('/analytics/department-stats');
  return response.data;
}

export async function fetchAnalyticsResolutionTrends() {
  const response = await client.get('/analytics/resolution-trends');
  return response.data;
}

export async function fetchEtlStatus() {
  const response = await client.get('/analytics/etl-status');
  return response.data;
}

export async function runEtl() {
  const response = await client.post('/analytics/run-etl');
  return response.data;
}
