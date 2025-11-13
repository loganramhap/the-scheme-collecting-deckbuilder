import { create } from 'zustand';
import type { RiotUser } from '../types/riot';
import type { GiteaUser } from '../types/gitea';
import { clearAllCaches } from '../utils/cacheManager';
import * as authApi from '../services/authApi';
import { giteaService } from '../services/gitea';

interface AuthState {
  user: RiotUser | null;
  isAuthenticated: boolean;
  giteaUsername: string | null;
  login: () => void;
  loginWithGitea: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initial state - no localStorage, auth is managed via httpOnly cookies
  const initialState = {
    user: null as RiotUser | null,
    isAuthenticated: false,
    giteaUsername: null as string | null,
  };

  return {
    ...initialState,

    /**
     * Initiates the Riot Sign-On OAuth flow
     * Redirects the user to Riot's authorization page
     */
    login: async () => {
      try {
        const { authorizationUrl } = await authApi.initAuth();
        // Redirect to Riot's authorization page
        window.location.href = authorizationUrl;
      } catch (error) {
        console.error('Failed to initiate OAuth flow:', error);
        throw error;
      }
    },

    /**
     * Legacy Gitea authentication (temporary during migration)
     * Logs in with username/password via Gitea token
     */
    loginWithGitea: async (token: string) => {
      giteaService.setToken(token);
      const giteaUser: GiteaUser = await giteaService.getCurrentUser();
      
      // Store in localStorage for legacy auth
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(giteaUser));
      
      set({
        user: null, // No Riot user for legacy auth
        isAuthenticated: true,
        giteaUsername: giteaUser.login,
      });
    },

    /**
     * Logs out the user by calling the backend logout endpoint
     * Clears session and cookies on the backend
     */
    logout: async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout failed:', error);
        // Continue with local cleanup even if backend call fails
      } finally {
        // Clear local state
        set({ user: null, isAuthenticated: false, giteaUsername: null });
        
        // Clear all caches on logout
        clearAllCaches();
      }
    },

    /**
     * Refreshes the authentication state from the backend
     * Fetches current user info if session is valid
     */
    refreshAuth: async () => {
      try {
        const { user } = await authApi.getCurrentUser();
        set({
          user: {
            puuid: user.puuid,
            gameName: user.gameName,
            tagLine: user.tagLine,
            summonerIcon: user.summonerIcon,
          },
          giteaUsername: user.giteaUsername,
          isAuthenticated: true,
        });
      } catch (error) {
        // Session is invalid or expired
        set({ user: null, isAuthenticated: false, giteaUsername: null });
        throw error;
      }
    },
  };
});
