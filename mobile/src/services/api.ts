import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.6:3001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Cache em memória do token — evita chamar SecureStore a cada request
let cachedToken: string | null = null;

export function setTokenCache(token: string | null) {
  cachedToken = token;
}

// Carrega o token uma vez na inicialização
SecureStore.getItemAsync('token').then((t) => { cachedToken = t; });

// Injeta o token em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = cachedToken ?? await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros globais de autenticação
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export default api;
