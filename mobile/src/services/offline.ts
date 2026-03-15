import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TREINOS: 'athlio_treinos',
  SESSAO_ATIVA: 'athlio_sessao_ativa',
  FILA_SYNC: 'athlio_fila_sync',
};

export const cacheTreinos = async (treinos: any[]) => {
  try { await AsyncStorage.setItem(KEYS.TREINOS, JSON.stringify(treinos)); } catch {}
};

export const getCachedTreinos = async (): Promise<any[]> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.TREINOS);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
};

export const saveSessaoLocal = async (sessao: any) => {
  try { await AsyncStorage.setItem(KEYS.SESSAO_ATIVA, JSON.stringify(sessao)); } catch {}
};

export const getSessaoLocal = async (): Promise<any | null> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.SESSAO_ATIVA);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
};

export const clearSessaoLocal = async () => {
  try { await AsyncStorage.removeItem(KEYS.SESSAO_ATIVA); } catch {}
};

export const addFilaSync = async (item: any) => {
  try {
    const json = await AsyncStorage.getItem(KEYS.FILA_SYNC);
    const fila = json ? JSON.parse(json) : [];
    fila.push(item);
    await AsyncStorage.setItem(KEYS.FILA_SYNC, JSON.stringify(fila));
  } catch {}
};

export const getFilaSync = async (): Promise<any[]> => {
  try {
    const json = await AsyncStorage.getItem(KEYS.FILA_SYNC);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
};

export const clearFilaSync = async () => {
  try { await AsyncStorage.removeItem(KEYS.FILA_SYNC); } catch {}
};
