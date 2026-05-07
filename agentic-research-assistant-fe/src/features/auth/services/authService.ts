import { httpClient } from '@/services/api/httpClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    return httpClient.post(ENDPOINTS.LOGIN, {
      email,
      password,
    });
  },

  async register(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
    return httpClient.post(ENDPOINTS.REGISTER, {
      email,
      password,
      confirmPassword,
    });
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post(ENDPOINTS.LOGOUT);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  async refresh(): Promise<AuthResponse> {
    return httpClient.post(ENDPOINTS.REFRESH);
  },

  saveTokens(accessToken: string, _refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  getAccessToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  },
};