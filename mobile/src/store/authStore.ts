import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { setTokenCache } from '../services/api';

export type UserRole = 'aluno' | 'personal' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nome: string;
  foto: string | null;
  anamneseConcluida?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, nome?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setTokenCache(data.token);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  register: async (email, password, role, nome = '') => {
    const { data } = await api.post('/auth/register', { email, password, role, nome });
    setTokenCache(data.token);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: async () => {
    setTokenCache(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        setTokenCache(token);
        set({ user: JSON.parse(userStr), token, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data) => {
    set((state) => {
      const updated = { ...state.user, ...data } as User;
      SecureStore.setItemAsync('user', JSON.stringify(updated));
      return { user: updated };
    });
  },
}));
