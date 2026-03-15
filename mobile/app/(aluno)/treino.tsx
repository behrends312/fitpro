import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import api from '../../src/services/api';
import * as Offline from '../../src/services/offline';

interface SerieExec {
  numero: number;
  repsExecutadas: number;
  cargaUsada: number;
  completada: boolean;
}
interface ExercicioExec {
  exercicio: { _id: string; nome: string; musculosPrincipais: string[] };
  series: SerieExec[];
}
interface Sessao {
  _id: string;
  treino: { _id: string; nome: string; tipo: string };
  exerciciosExecutados: ExercicioExec[];
  status: string;
  dataInicio: string;
}
interface Treino {
  _id: string;
  nome: string;
  tipo: string;
  diasSemana: string[];
  exercicios: Array<{
    _id: string;
    exercicio: { _id: string; nome: string; musculosPrincipais: string[] };
    series: number;
    reps: string;
    carga: number;
    descanso: number;
  }>;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function CalendarioSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - diaSemana + i);
    return d;
  });

  const { data: historicoData } = useQuery({
    queryKey: ['sessoes-semana'],
    queryFn: () => api.get('/sessoes/historico', { params: { limit: 20 } }).then((r) => r.data),
    retry: 0,
  });

  const diasComTreino = new Set<string>();
  if (historicoData?.sessoes) {
    for (const s of historicoData.sessoes) {
      if (s.dataFim) {
        const d = new Date(s.dataFim);
        diasComTreino.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }
  }

  return (
    <View className="mx-5 mb-5 bg-surface border border-border rounded-2xl p-4">
      <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-3">Semana atual</Text>
      <View className="flex-row justify-between">
        {diasSemana.map((d, i) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const ehHoje = i === diaSemana;
          const temTreino = diasComTreino.has(key);
          const ehFuturo = d > hoje && !ehHoje;

          return (
            <View key={i} className="items-center flex-1">
              <Text className={`text-xs mb-2 ${ehHoje ? 'text-primary font-bold' : 'text-textMuted'}`}>
                {DIAS_SEMANA[i]}
              </Text>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  temTreino ? 'bg-success' : ehHoje ? 'border-2 border-primary' : 'bg-background'
                }`}
              >
                {temTreino ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text className={`text-xs font-semibold ${ehHoje ? 'text-primary' : ehFuturo ? 'text-textMuted opacity-40' : 'text-textMuted'}`}>
                    {d.getDate()}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TimerDescanso({ segundos, onFim }: { segundos: number; onFim: () => void }) {
  const [restante, setRestante] = useState(segundos);

  useEffect(() => {
    if (restante <= 0) { onFim(); return; }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  const pct = restante / segundos;
  const cor = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#f87171';

  return (
    <View className="items-center py-4">
      <Text className="text-textSecondary text-sm mb-2">Descanso</Text>
      <Text style={{ color: cor, fontSize: 48, fontWeight: 'bold' }}>
        {String(Math.floor(restante / 60)).padStart(2, '0')}:{String(restante % 60).padStart(2, '0')}
      </Text>
      <TouchableOpacity onPress={onFim} className="mt-3 bg-surface rounded-lg px-6 py-2">
        <Text className="text-textSecondary text-sm">Pular descanso</Text>
      </TouchableOpacity>
    </View>
  );
}

function LinhaSerie({
  serie, index, exercicioIdx, onToggle, onEdit,
}: {
  serie: SerieExec;
  index: number;
  exercicioIdx: number;
  onToggle: (eIdx: number, sIdx: number) => void;
  onEdit: (eIdx: number, sIdx: number, campo: 'reps' | 'carga', valor: number) => void;
}) {
  return (
    <View className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${serie.completada ? 'bg-success/10 border border-success/30' : 'bg-background border border-border'}`}>
      <Text className="text-textMuted w-6 text-center text-sm">{index + 1}</Text>
      <View className="flex-1 mx-3">
        <Text className="text-textMuted text-xs mb-1">Carga (kg)</Text>
        <TextInput
          className="text-textPrimary text-base font-bold"
          value={String(serie.cargaUsada)}
          onChangeText={(v) => onEdit(exercicioIdx, index, 'carga', parseFloat(v) || 0)}
          keyboardType="numeric"
          editable={!serie.completada}
        />
      </View>
      <View className="flex-1 mx-3">
        <Text className="text-textMuted text-xs mb-1">Reps</Text>
        <TextInput
          className="text-textPrimary text-base font-bold"
          value={String(serie.repsExecutadas)}
          onChangeText={(v) => onEdit(exercicioIdx, index, 'reps', parseInt(v, 10) || 0)}
          keyboardType="numeric"
          editable={!serie.completada}
        />
      </View>
      <TouchableOpacity
        onPress={() => onToggle(exercicioIdx, index)}
        className={`w-10 h-10 rounded-full items-center justify-center ${serie.completada ? 'bg-success' : 'bg-surface border border-border'}`}
      >
        <Ionicons name="checkmark" size={20} color={serie.completada ? 'white' : '#5a5a70'} />
      </TouchableOpacity>
    </View>
  );
}

export default function TreinoScreen() {
  const queryClient = useQueryClient();
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
  const [exercicios, setExercicios] = useState<ExercicioExec[]>([]);
  const [timerDescanso, setTimerDescanso] = useState<{ eIdx: number; segundos: number } | null>(null);
  const [elapsedSeg, setElapsedSeg] = useState(0);
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const isOnlineRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessaoAtivaRef = useRef<Sessao | null>(null);

  // Mantém ref sincronizada
  useEffect(() => { sessaoAtivaRef.current = sessaoAtiva; }, [sessaoAtiva]);

  // Monitor de conectividade
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      isOnlineRef.current = online;
      if (online) sincronizarFila();
    });
    NetInfo.fetch().then((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      isOnlineRef.current = online;
    });
    return () => unsubscribe();
  }, []);

  // Restaura sessão local ao abrir
  useEffect(() => {
    Offline.getSessaoLocal().then((local) => {
      if (local && !sessaoAtivaRef.current) {
        setSessaoAtiva(local);
        setExercicios(local.exerciciosExecutados);
        const primeiroIncompleto = local.exerciciosExecutados.findIndex(
          (ex: ExercicioExec) => ex.series.some((s) => !s.completada)
        );
        const inicial = new Set<number>();
        local.exerciciosExecutados.forEach((_: any, i: number) => {
          if (i !== primeiroIncompleto) inicial.add(i);
        });
        setColapsados(inicial);
      }
    });
  }, []);

  // Sincroniza treinos pendentes quando volta online
  const sincronizarFila = useCallback(async () => {
    const fila = await Offline.getFilaSync();
    if (!fila.length) return;
    let sincronizou = false;
    for (const item of fila) {
      try {
        const sessao = await api.post('/sessoes', { treinoId: item.treinoId }).then((r) => r.data);
        await api.post(`/sessoes/${sessao._id}/concluir`, { exerciciosExecutados: item.exerciciosExecutados });
        sincronizou = true;
      } catch {}
    }
    await Offline.clearFilaSync();
    if (sincronizou) {
      queryClient.invalidateQueries({ queryKey: ['sessoes-semana'] });
    }
  }, []);

  // Carrega treinos com fallback para cache
  const { data: treinos = [], isLoading } = useQuery<Treino[]>({
    queryKey: ['treinos-aluno'],
    queryFn: async () => {
      try {
        const data = await api.get('/treinos').then((r) => r.data);
        Offline.cacheTreinos(data);
        return data;
      } catch {
        const cached = await Offline.getCachedTreinos();
        return cached;
      }
    },
    retry: 0,
  });

  // Sessão ativa via API
  const { data: sessaoAtivaDados } = useQuery({
    queryKey: ['sessao-ativa'],
    queryFn: () => api.get('/sessoes/ativa').then((r) => r.data),
    retry: 0,
  });

  useEffect(() => {
    if (sessaoAtivaDados) {
      setSessaoAtiva(sessaoAtivaDados);
      setExercicios(sessaoAtivaDados.exerciciosExecutados);
      Offline.clearSessaoLocal();
      const primeiroIncompleto = sessaoAtivaDados.exerciciosExecutados.findIndex(
        (ex: any) => ex.series.some((s: any) => !s.completada)
      );
      const inicial = new Set<number>();
      sessaoAtivaDados.exerciciosExecutados.forEach((_: any, i: number) => {
        if (i !== primeiroIncompleto) inicial.add(i);
      });
      setColapsados(inicial);
    }
  }, [sessaoAtivaDados]);

  useEffect(() => {
    if (sessaoAtiva) {
      timerRef.current = setInterval(() => setElapsedSeg((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeg(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessaoAtiva]);

  const formatTempo = (seg: number) =>
    `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;

  const iniciarMutation = useMutation({
    mutationFn: async (treinoId: string) => {
      if (!isOnlineRef.current) {
        const treino = treinos.find((t) => t._id === treinoId)!;
        const sessaoLocal: Sessao = {
          _id: `offline_${Date.now()}`,
          treino: { _id: treino._id, nome: treino.nome, tipo: treino.tipo },
          exerciciosExecutados: treino.exercicios.map((ex) => ({
            exercicio: ex.exercicio,
            series: Array.from({ length: ex.series }, (_, i) => ({
              numero: i + 1,
              repsExecutadas: parseInt(ex.reps) || 0,
              cargaUsada: ex.carga || 0,
              completada: false,
            })),
          })),
          status: 'em_andamento',
          dataInicio: new Date().toISOString(),
        };
        await Offline.saveSessaoLocal(sessaoLocal);
        return sessaoLocal;
      }
      return api.post('/sessoes', { treinoId }).then((r) => r.data);
    },
    onSuccess: (data: Sessao) => {
      setSessaoAtiva(data);
      setExercicios(data.exerciciosExecutados);
      const inicial = new Set<number>();
      data.exerciciosExecutados.forEach((_, i) => { if (i > 0) inicial.add(i); });
      setColapsados(inicial);
      queryClient.invalidateQueries({ queryKey: ['sessao-ativa'] });
    },
  });

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const sessao = sessaoAtivaRef.current;
      if (!sessao) return;
      if (!isOnlineRef.current || sessao._id.startsWith('offline_')) {
        await Offline.saveSessaoLocal({ ...sessao, exerciciosExecutados: exercicios });
        return;
      }
      return api.patch(`/sessoes/${sessao._id}`, { exerciciosExecutados: exercicios });
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async () => {
      const sessao = sessaoAtivaRef.current;
      if (!sessao) return;
      const isOfflineSession = sessao._id.startsWith('offline_');

      if (isOnlineRef.current && !isOfflineSession) {
        return api.post(`/sessoes/${sessao._id}/concluir`, { exerciciosExecutados: exercicios });
      }

      // Offline ou sessão local: salva na fila de sync
      await Offline.addFilaSync({
        treinoId: sessao.treino._id,
        exerciciosExecutados: exercicios,
        dataInicio: sessao.dataInicio,
        dataFim: new Date().toISOString(),
      });
      await Offline.clearSessaoLocal();

      // Se voltou online, tenta sincronizar imediatamente
      if (isOnlineRef.current) sincronizarFila();
    },
    onSuccess: () => {
      setSessaoAtiva(null);
      setExercicios([]);
      queryClient.invalidateQueries({ queryKey: ['treinos-aluno', 'sessao-ativa', 'sessoes-semana'] });
      const msg = isOnlineRef.current
        ? 'Ótimo trabalho! Seu progresso foi salvo.'
        : 'Treino salvo offline. Será sincronizado quando você estiver online.';
      Alert.alert('🎉 Treino concluído!', msg);
    },
  });

  const toggleSerie = useCallback((eIdx: number, sIdx: number) => {
    setExercicios((prev) => {
      const next = prev.map((ex, i) =>
        i !== eIdx ? ex : {
          ...ex,
          series: ex.series.map((s, j) =>
            j !== sIdx ? s : { ...s, completada: !s.completada }
          ),
        }
      );
      const foi = !prev[eIdx].series[sIdx].completada;
      if (foi) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const todasCompletas = next[eIdx].series.every((s) => s.completada);
        if (todasCompletas && eIdx < next.length - 1) {
          setColapsados((c) => {
            const novo = new Set(c);
            novo.add(eIdx);
            novo.delete(eIdx + 1);
            return novo;
          });
        }
        setTimerDescanso({ eIdx, segundos: 60 });
      }
      return next;
    });
    setTimeout(() => salvarMutation.mutate(), 500);
  }, []);

  const editarSerie = useCallback((eIdx: number, sIdx: number, campo: 'reps' | 'carga', valor: number) => {
    setExercicios((prev) =>
      prev.map((ex, i) =>
        i !== eIdx ? ex : {
          ...ex,
          series: ex.series.map((s, j) =>
            j !== sIdx ? s : { ...s, [campo === 'reps' ? 'repsExecutadas' : 'cargaUsada']: valor }
          ),
        }
      )
    );
  }, []);

  function toggleColapso(idx: number) {
    setColapsados((prev) => {
      const novo = new Set(prev);
      if (novo.has(idx)) novo.delete(idx);
      else novo.add(idx);
      return novo;
    });
  }

  const totalSeries = exercicios.reduce((acc, ex) => acc + ex.series.length, 0);
  const seriesFeitas = exercicios.reduce((acc, ex) => acc + ex.series.filter((s) => s.completada).length, 0);

  // Banner de offline
  const BannerOffline = () => (
    !isOnline ? (
      <View className="bg-yellow-500/20 border-b border-yellow-500/30 px-5 py-2 flex-row items-center gap-2">
        <Ionicons name="cloud-offline-outline" size={14} color="#eab308" />
        <Text className="text-yellow-500 text-xs">Sem internet — treino salvo localmente</Text>
      </View>
    ) : null
  );

  // =============== TELA: Sem sessão ativa ===============
  if (!sessaoAtiva) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <BannerOffline />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-4 pb-2">
            <Text className="text-textPrimary text-2xl font-bold mb-1">Hoje é dia de treinar 💪</Text>
            <Text className="text-textSecondary text-sm mb-4">Escolha um treino para começar</Text>
          </View>

          <CalendarioSemana />

          <View className="px-5">
            {isLoading ? (
              <ActivityIndicator color="#6C63FF" />
            ) : treinos.length === 0 ? (
              <View className="items-center py-16">
                <Ionicons name="barbell-outline" size={64} color="#2e2e40" />
                <Text className="text-textSecondary text-center mt-4 text-base">
                  {isOnline
                    ? 'Nenhum treino cadastrado ainda.\nAguarde seu personal criar seus treinos.'
                    : 'Sem internet e nenhum treino em cache.\nAbra o app online ao menos uma vez.'}
                </Text>
              </View>
            ) : (
              treinos.map((treino) => {
                const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
                const diasMap: Record<string, string> = { seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sab: 'sáb', dom: 'dom' };
                const ehHoje = treino.diasSemana.some((d) => diasMap[d] === hoje);

                return (
                  <TouchableOpacity
                    key={treino._id}
                    onPress={() => {
                      Alert.alert(
                        `Iniciar ${treino.nome}?`,
                        `${treino.exercicios.length} exercícios`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Iniciar', onPress: () => iniciarMutation.mutate(treino._id) },
                        ]
                      );
                    }}
                    className="bg-surface border border-border rounded-2xl p-5 mb-4"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <View className="flex-row items-center gap-2 mb-1">
                          <View className="bg-primary/20 px-2 py-0.5 rounded-md">
                            <Text className="text-primary text-xs font-bold">Treino {treino.tipo}</Text>
                          </View>
                          {ehHoje && (
                            <View className="bg-success/20 px-2 py-0.5 rounded-md">
                              <Text className="text-success text-xs font-semibold">Hoje</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-textPrimary text-xl font-bold">{treino.nome}</Text>
                      </View>
                      <View className="bg-primary/10 p-3 rounded-xl">
                        <Ionicons name="play" size={22} color="#6C63FF" />
                      </View>
                    </View>

                    <View className="mb-3">
                      {treino.exercicios.slice(0, 3).map((ex, i) => (
                        <Text key={i} className="text-textMuted text-xs mb-0.5">· {ex.exercicio.nome}</Text>
                      ))}
                      {treino.exercicios.length > 3 && (
                        <Text className="text-textMuted text-xs">+{treino.exercicios.length - 3} mais...</Text>
                      )}
                    </View>

                    <View className="flex-row gap-4">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="list-outline" size={14} color="#9090a8" />
                        <Text className="text-textSecondary text-sm">{treino.exercicios.length} exercícios</Text>
                      </View>
                      {treino.diasSemana.length > 0 && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar-outline" size={14} color="#9090a8" />
                          <Text className="text-textSecondary text-sm">{treino.diasSemana.join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =============== TELA: Treino em andamento ===============
  return (
    <SafeAreaView className="flex-1 bg-background">
      <BannerOffline />

      <View className="px-5 pt-2 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-textSecondary text-xs uppercase tracking-widest">Em andamento</Text>
            <Text className="text-textPrimary text-xl font-bold">{sessaoAtiva.treino.nome}</Text>
          </View>
          <View className="items-end">
            <Text className="text-primary text-2xl font-bold">{formatTempo(elapsedSeg)}</Text>
            <Text className="text-textMuted text-xs">{seriesFeitas}/{totalSeries} séries</Text>
          </View>
        </View>

        <View className="h-1.5 bg-surface rounded-full mt-3">
          <View className="h-1.5 bg-primary rounded-full" style={{ width: `${totalSeries > 0 ? (seriesFeitas / totalSeries) * 100 : 0}%` }} />
        </View>
      </View>

      <Modal visible={timerDescanso !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="bg-surface border border-border rounded-3xl w-full p-8">
            <TimerDescanso segundos={timerDescanso?.segundos ?? 60} onFim={() => setTimerDescanso(null)} />
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
        {exercicios.map((ex, eIdx) => {
          const feitos = ex.series.filter((s) => s.completada).length;
          const total = ex.series.length;
          const completo = feitos === total;
          const colapsado = colapsados.has(eIdx);

          return (
            <View key={eIdx} className={`mb-3 rounded-2xl border overflow-hidden ${completo ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}>
              <TouchableOpacity
                onPress={() => toggleColapso(eIdx)}
                className="flex-row justify-between items-center p-4"
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text className="text-textPrimary font-bold text-base">{ex.exercicio.nome}</Text>
                  {ex.exercicio.musculosPrincipais?.length > 0 && (
                    <Text className="text-textMuted text-xs mt-0.5">{ex.exercicio.musculosPrincipais.join(' · ')}</Text>
                  )}
                </View>
                <View className="flex-row items-center gap-2">
                  <View className={`px-2 py-0.5 rounded-md ${completo ? 'bg-success/20' : 'bg-surface border border-border'}`}>
                    <Text className={`text-xs font-semibold ${completo ? 'text-success' : 'text-textSecondary'}`}>{feitos}/{total}</Text>
                  </View>
                  <Ionicons name={colapsado ? 'chevron-down' : 'chevron-up'} size={18} color="#9090a8" />
                </View>
              </TouchableOpacity>

              {!colapsado && (
                <View className="px-4 pb-4">
                  <View className="flex-row items-center px-4 mb-2">
                    <Text className="text-textMuted text-xs w-6">#</Text>
                    <Text className="flex-1 text-textMuted text-xs mx-3">Carga (kg)</Text>
                    <Text className="flex-1 text-textMuted text-xs mx-3">Reps</Text>
                    <View className="w-10" />
                  </View>
                  {ex.series.map((serie, sIdx) => (
                    <LinhaSerie
                      key={sIdx}
                      serie={serie}
                      index={sIdx}
                      exercicioIdx={eIdx}
                      onToggle={toggleSerie}
                      onEdit={editarSerie}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Concluir treino?',
              `${seriesFeitas} de ${totalSeries} séries completadas.`,
              [
                { text: 'Continuar', style: 'cancel' },
                { text: 'Concluir', onPress: () => concluirMutation.mutate() },
              ]
            );
          }}
          disabled={concluirMutation.isPending}
          className="bg-primary rounded-2xl py-5 items-center mb-8 mt-4"
        >
          {concluirMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold text-base mt-1">Finalizar Treino</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
