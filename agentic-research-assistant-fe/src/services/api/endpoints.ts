/**
 * API Endpoints - Centralized endpoint constants
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const ENDPOINTS = {
  // Search
  SEARCH: '/api/search',
  SEARCH_HISTORY: '/api/search/history',

  // Research
  RESEARCH: '/api/research',
  RESEARCH_BY_ID: (id: string) => `/api/research/${id}`,

  // Auth (global BE prefix /api)
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',
};

export { API_BASE_URL };
