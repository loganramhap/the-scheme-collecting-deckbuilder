import axios from 'axios';
import type { RiotUser } from '../types/riot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API client for Riot Sign-On authentication endpoints
 */
const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: Send cookies with requests
  timeout: 30000,
});

/**
 * Response from the /auth/riot/init endpoint
 */
interface InitAuthResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * Response from the /auth/riot/callback endpoint
 */
interface CallbackResponse {
  success: boolean;
  user: RiotUser & { giteaUsername: string };
}

/**
 * Response from the /auth/me endpoint
 */
interface MeResponse {
  user: RiotUser & { giteaUsername: string };
}

/**
 * Response from logout and refresh endpoints
 */
interface SuccessResponse {
  success: boolean;
}

/**
 * Initialize the OAuth flow and get the authorization URL
 */
export async function initAuth(): Promise<InitAuthResponse> {
  const response = await authApi.get<InitAuthResponse>('/api/auth/riot/init');
  return response.data;
}

/**
 * Handle OAuth callback with authorization code and state
 */
export async function handleCallback(code: string, state: string): Promise<CallbackResponse> {
  const response = await authApi.get<CallbackResponse>('/api/auth/riot/callback', {
    params: { code, state }
  });
  return response.data;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<MeResponse> {
  const response = await authApi.get<MeResponse>('/api/auth/me');
  return response.data;
}

/**
 * Refresh the access token
 */
export async function refreshToken(): Promise<SuccessResponse> {
  const response = await authApi.post<SuccessResponse>('/api/auth/refresh');
  return response.data;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<SuccessResponse> {
  const response = await authApi.post<SuccessResponse>('/api/auth/logout');
  return response.data;
}

export default authApi;
