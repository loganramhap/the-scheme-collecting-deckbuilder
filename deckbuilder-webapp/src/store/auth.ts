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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

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
}));
