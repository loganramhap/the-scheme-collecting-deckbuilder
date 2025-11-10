import { create } from 'zustand';
import type { GiteaUser } from '../types/gitea';
import { giteaService } from '../services/gitea';

interface AuthState {
  user: GiteaUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage
  const savedToken = localStorage.getItem('auth-token');
  const savedUser = localStorage.getItem('auth-user');
  
  let initialState = {
    user: null as GiteaUser | null,
    token: null as string | null,
    isAuthenticated: false,
  };

  if (savedToken && savedUser) {
    try {
      initialState = {
        user: JSON.parse(savedUser),
        token: savedToken,
        isAuthenticated: true,
      };
      giteaService.setToken(savedToken);
    } catch (e) {
      // Invalid saved data, clear it
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    }
  }

  return {
    ...initialState,

    login: async (token: string) => {
      giteaService.setToken(token);
      const user = await giteaService.getCurrentUser();
      set({ user, token, isAuthenticated: true });
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(user));
    },

    logout: () => {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    },
  };
});
