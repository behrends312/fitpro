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
import { Video, ResizeMode } from 'expo-av';
import api from '../../src/services/api';
import * as Offline from '../../src/services/offline';

interface SerieExec {
  numero: number;
  repsExecutadas: number;
  cargaUsada: number;
  completada: boolean;
}
interface ExercicioExec {
  exercicio: { _id: string; nome: string; musculosPrincipais: string[]; videoUrl?: string };
  series: SerieExec[];
  grupoTipo?: string;
  grupoId?: string | null;
  grupoOrdem?: number;
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
  dataInicio?: string | null;
  duracaoMeses?: number | null;
  exercicios: Array<{
    _id: string;
    exercicio: { _id: string; nome: string; musculosPrincipais: string[] };
    series: number;
    reps: string;
    carga: number;
    descanso: number;
  }>;
}

function calcularExpiracao(treino: Treino): { expirado: boolean; diasRestantes: number | null; dataExp: Date | null } {
  if (!treino.dataInicio || !treino.duracaoMeses) return { expirado: false, diasRestantes: null, dataExp: null };
  const exp = new Date(treino.dataInicio);
  exp.setMonth(exp.getMonth() + treino.duracaoMeses);
  const agora = new Date();
  const diff = Math.ceil((exp.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  return { expirado: diff <= 0, diasRestantes: diff, dataExp: exp };
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function CalendarioSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const [modalCalendario, setModalCalendario] = useState(false);
  const [diaDetalheSessoes, setDiaDetalheSessoes] = useState<any[] | null>(null);
  const [mesSel, setMesSel] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - diaSemana + i);
    return d;
  });

  const { data: historicoData } = useQuery({
    queryKey: ['sessoes-semana'],
    queryFn: () => api.get('/sessoes/historico', { params: { limit: 60 } }).then((r) => r.data),
    retry: 0,
  });

  // Mapa: "YYYY-M-D" -> sessoes[]
  const diasParaSessoes = new Map<string, any[]>();
  if (historicoData?.sessoes) {
    for (const s of historicoData.sessoes) {
      if (s.dataFim) {
        const d = new Date(s.dataFim);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!diasParaSessoes.has(k)) diasParaSessoes.set(k, []);
        diasParaSessoes.get(k)!.push(s);
      }
    }
  }

  // Calendário mensal
  const diasNoMes = new Date(mesSel.getFullYear(), mesSel.getMonth() + 1, 0).getDate();
  const primeiroDiaSemana = new Date(mesSel.getFullYear(), mesSel.getMonth(), 1).getDay();
  const celulas = Array.from({ length: primeiroDiaSemana + diasNoMes }, (_, i) =>
    i < primeiroDiaSemana ? null : new Date(mesSel.getFullYear(), mesSel.getMonth(), i - primeiroDiaSemana + 1)
  );
  // Completa até múltiplo de 7
  while (celulas.length % 7 !== 0) celulas.push(null);

  return (
    <>
      <View className="mx-5 mb-5 bg-surface border border-border rounded-2xl p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest">Semana atual</Text>
          <TouchableOpacity onPress={() => setModalCalendario(true)} className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={14} color="#6C63FF" />
            <Text className="text-primary text-xs font-semibold">Ver calendário</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between">
          {diasSemana.map((d, i) => {
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const ehHoje = i === diaSemana;
            const sessoesDia = diasParaSessoes.get(key) || [];
            const temTreino = sessoesDia.length > 0;
            const ehFuturo = d > hoje && !ehHoje;

            return (
              <TouchableOpacity
                key={i}
                className="items-center flex-1"
                onPress={() => {
                  if (temTreino) setDiaDetalheSessoes(sessoesDia);
                }}
                disabled={!temTreino}
              >
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
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Modal detalhe de sessões do dia */}
      <Modal visible={!!diaDetalheSessoes} transparent animationType="fade" onRequestClose={() => setDiaDetalheSessoes(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View className="bg-surface rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary text-lg font-bold">Treinos do dia</Text>
              <TouchableOpacity onPress={() => setDiaDetalheSessoes(null)}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>
            {diaDetalheSessoes?.map((s: any, i: number) => (
              <View key={i} className="bg-background border border-border rounded-xl p-3 mb-2">
                <View className="bg-primary/20 px-2 py-0.5 rounded-md self-start mb-1">
                  <Text className="text-primary text-xs font-bold">Treino {s.treino?.tipo}</Text>
                </View>
                <Text className="text-textPrimary font-semibold">{s.treino?.nome}</Text>
                <Text className="text-textMuted text-xs mt-1">
                  {new Date(s.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {s.duracaoSegundos ? ` · ${Math.floor(s.duracaoSegundos / 60)}min` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal calendário mensal */}
      <Modal visible={modalCalendario} transparent animationType="slide" onRequestClose={() => setModalCalendario(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View className="bg-surface rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-textPrimary text-lg font-bold">Histórico de treinos</Text>
              <TouchableOpacity onPress={() => setModalCalendario(false)}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>

            {/* Navegação de mês */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setMesSel((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
                className="w-9 h-9 bg-surfaceLight rounded-xl items-center justify-center"
              >
                <Ionicons name="chevron-back" size={18} color="#9090a8" />
              </TouchableOpacity>
              <Text className="text-textPrimary font-bold">
                {mesSel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => setMesSel((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
                disabled={mesSel.getMonth() === hoje.getMonth() && mesSel.getFullYear() === hoje.getFullYear()}
                className="w-9 h-9 bg-surfaceLight rounded-xl items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={18} color="#9090a8" />
              </TouchableOpacity>
            </View>

            {/* Header dias */}
            <View className="flex-row mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <Text key={i} className="flex-1 text-center text-textMuted text-xs font-semibold">{d}</Text>
              ))}
            </View>

            {/* Grade do calendário */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: celulas.length / 7 }, (_, semana) => (
                <View key={semana} className="flex-row mb-2">
                  {celulas.slice(semana * 7, semana * 7 + 7).map((dia, i) => {
                    if (!dia) return <View key={i} className="flex-1" />;
                    const k = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
                    const sessoes = diasParaSessoes.get(k) || [];
                    const temTreino = sessoes.length > 0;
                    const ehHojeLocal = dia.toDateString() === hoje.toDateString();

                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => { if (temTreino) { setDiaDetalheSessoes(sessoes); setModalCalendario(false); } }}
                        disabled={!temTreino}
                        className="flex-1 items-center"
                      >
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                          temTreino ? 'bg-success' : ehHojeLocal ? 'border-2 border-primary' : ''
                        }`}>
                          <Text className={`text-xs font-semibold ${
                            temTreino ? 'text-white' : ehHojeLocal ? 'text-primary' : 'text-textMuted'
                          }`}>
                            {dia.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              <View className="flex-row items-center gap-3 mt-4 pt-4 border-t border-border">
                <View className="w-4 h-4 rounded-full bg-success" />
                <Text className="text-textMuted text-xs">Dia com treino (toque para ver)</Text>
              </View>
              <View className="h-4" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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

interface GamificacaoResultado {
  xpGanho: number;
  xpTotal: number;
  nivel: number;
  xpProximoNivel: number | null;
  streak: number;
  badgesNovos: Array<{ id: string; nome: string; descricao: string; icone: string }>;
}

export default function TreinoScreen() {
  const queryClient = useQueryClient();
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
  const [exercicios, setExercicios] = useState<ExercicioExec[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [timerDescanso, setTimerDescanso] = useState<{ eIdx: number; segundos: number } | null>(null);
  const [elapsedSeg, setElapsedSeg] = useState(0);
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [videoAtivo, setVideoAtivo] = useState<string | null>(null);
  const [gamiResultado, setGamiResultado] = useState<GamificacaoResultado | null>(null);
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

  // Última sessão concluída para determinar próximo treino na sequência
  const { data: ultimaSessaoData } = useQuery({
    queryKey: ['ultima-sessao'],
    queryFn: () => api.get('/sessoes/historico', { params: { limit: 1 } }).then((r) => r.data),
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
    onSuccess: (response: any) => {
      setSessaoAtiva(null);
      setExercicios([]);
      queryClient.invalidateQueries({ queryKey: ['treinos-aluno', 'sessao-ativa', 'sessoes-semana', 'meu-perfil', 'ultima-sessao'] });

      if (response?.data?.gamificacao) {
        setGamiResultado(response.data.gamificacao);
      } else {
        // Offline ou sem dados de gamificação
        const msg = isOnlineRef.current
          ? 'Ótimo trabalho! Seu progresso foi salvo.'
          : 'Treino salvo offline. Será sincronizado quando você estiver online.';
        Alert.alert('🎉 Treino concluído!', msg);
      }
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
  // Sequência A→B→C→A: ordena treinos por tipo e determina o próximo com base no último concluído
  const tiposOrdenados = [...new Set(treinos.map((t) => t.tipo))].sort();
  const ultimoTipo = ultimaSessaoData?.sessoes?.[0]?.treino?.tipo ?? null;
  const proximoTipo = (() => {
    if (!ultimoTipo || !tiposOrdenados.includes(ultimoTipo)) return tiposOrdenados[0] ?? null;
    const idx = tiposOrdenados.indexOf(ultimoTipo);
    return tiposOrdenados[(idx + 1) % tiposOrdenados.length];
  })();
  const treinosOrdenados = [...treinos].sort((a, b) => a.tipo.localeCompare(b.tipo));
  const listaExibida = mostrarTodos ? treinosOrdenados : treinosOrdenados.filter((t) => t.tipo === proximoTipo);
  const temOutros = !mostrarTodos && treinos.length > listaExibida.length;

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
              <>
                {listaExibida.map((treino) => {
                  const ehProximo = treino.tipo === proximoTipo;
                  const { expirado, diasRestantes, dataExp } = calcularExpiracao(treino);
                  const expirando = !expirado && diasRestantes !== null && diasRestantes <= 7;

                  return (
                    <TouchableOpacity
                      key={treino._id}
                      onPress={() => {
                        if (expirado) {
                          Alert.alert('Plano expirado', 'Este plano de treino expirou. Fale com seu personal para renová-lo.');
                          return;
                        }
                        Alert.alert(
                          `Iniciar ${treino.nome}?`,
                          `${treino.exercicios.length} exercícios`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Iniciar', onPress: () => iniciarMutation.mutate(treino._id) },
                          ]
                        );
                      }}
                      style={{ opacity: expirado ? 0.6 : 1 }}
                      className="bg-surface border border-border rounded-2xl mb-4 overflow-hidden"
                    >
                      {expirado && (
                        <View style={{ backgroundColor: 'rgba(248,113,113,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(248,113,113,0.3)', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                          <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600' }}>
                            Plano expirado em {dataExp?.toLocaleDateString('pt-BR')} — fale com seu personal
                          </Text>
                        </View>
                      )}
                      {expirando && (
                        <View style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="time-outline" size={14} color="#fbbf24" />
                          <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600' }}>
                            Expira em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}

                      <View className="p-5">
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-1 pr-3">
                            <View className="flex-row items-center gap-2 mb-1">
                              <View className="bg-primary/20 px-2 py-0.5 rounded-md">
                                <Text className="text-primary text-xs font-bold">Treino {treino.tipo}</Text>
                              </View>
                              {ehProximo && !expirado && (
                                <View className="bg-success/20 px-2 py-0.5 rounded-md">
                                  <Text className="text-success text-xs font-semibold">Próximo</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-textPrimary text-xl font-bold">{treino.nome}</Text>
                          </View>
                          <View style={{ backgroundColor: expirado ? 'rgba(248,113,113,0.1)' : 'rgba(108,99,255,0.1)', padding: 12, borderRadius: 12 }}>
                            <Ionicons name={expirado ? 'lock-closed-outline' : 'play'} size={22} color={expirado ? '#f87171' : '#6C63FF'} />
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
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {temOutros && (
                  <TouchableOpacity
                    onPress={() => setMostrarTodos(true)}
                    className="border border-border rounded-2xl py-4 items-center mb-4 flex-row justify-center gap-2"
                  >
                    <Ionicons name="list-outline" size={16} color="#9090a8" />
                    <Text className="text-textSecondary text-sm">Ver todos os treinos ({treinos.length})</Text>
                  </TouchableOpacity>
                )}
                {mostrarTodos && (
                  <TouchableOpacity
                    onPress={() => setMostrarTodos(false)}
                    className="border border-border rounded-2xl py-4 items-center mb-4 flex-row justify-center gap-2"
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#9090a8" />
                    <Text className="text-textSecondary text-sm">Mostrar próximo treino</Text>
                  </TouchableOpacity>
                )}
              </>
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

      {/* Modal de XP / Gamificação */}
      <Modal visible={!!gamiResultado} transparent animationType="slide" onRequestClose={() => setGamiResultado(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View className="bg-surface rounded-t-3xl p-6 pb-10">
            <View className="items-center mb-5">
              <Text style={{ fontSize: 56 }}>🎉</Text>
              <Text className="text-textPrimary text-2xl font-bold mt-2">Treino concluído!</Text>
              <Text className="text-textSecondary text-sm mt-1">Ótimo trabalho! Continue assim.</Text>
            </View>

            {/* XP ganho */}
            <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-3 items-center">
              <Text className="text-primary text-4xl font-bold">+{gamiResultado?.xpGanho} XP</Text>
              <Text className="text-textSecondary text-sm mt-1">
                Total: {gamiResultado?.xpTotal} XP · Nível {gamiResultado?.nivel}
              </Text>
              {gamiResultado?.xpProximoNivel && (
                <Text className="text-textMuted text-xs mt-1">
                  {gamiResultado.xpProximoNivel - (gamiResultado.xpTotal ?? 0)} XP para o próximo nível
                </Text>
              )}
            </View>

            {/* Streak */}
            {(gamiResultado?.streak ?? 0) > 0 && (
              <View className="bg-surface border border-border rounded-2xl p-3 mb-3 flex-row items-center gap-3">
                <Text style={{ fontSize: 28 }}>🔥</Text>
                <View>
                  <Text className="text-textPrimary font-bold">{gamiResultado?.streak} dias seguidos</Text>
                  <Text className="text-textMuted text-xs">Continue a sequência amanhã!</Text>
                </View>
              </View>
            )}

            {/* Badges novos */}
            {(gamiResultado?.badgesNovos?.length ?? 0) > 0 && (
              <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-3">
                <Text className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Nova conquista!</Text>
                {gamiResultado!.badgesNovos.map((b) => (
                  <View key={b.id} className="flex-row items-center gap-3">
                    <Text style={{ fontSize: 28 }}>{b.icone}</Text>
                    <View>
                      <Text className="text-textPrimary font-bold">{b.nome}</Text>
                      <Text className="text-textMuted text-xs">{b.descricao}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={() => setGamiResultado(null)}
              className="bg-primary rounded-2xl py-4 items-center mt-2"
            >
              <Text className="text-white font-bold text-base">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de vídeo do exercício */}
      <Modal visible={!!videoAtivo} transparent animationType="fade" onRequestClose={() => setVideoAtivo(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setVideoAtivo(null)} style={{ position: 'absolute', top: 56, right: 20, zIndex: 10 }}>
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>
          {videoAtivo && (
            <Video
              source={{ uri: videoAtivo }}
              style={{ width: '100%', height: 280 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>

      <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
        {exercicios.map((ex, eIdx) => {
          const feitos = ex.series.filter((s) => s.completada).length;
          const total = ex.series.length;
          const completo = feitos === total;
          const colapsado = colapsados.has(eIdx);

          const GRUPO_CORES: Record<string, string> = {
            'bi-set': '#6C63FF',
            'tri-set': '#f59e0b',
            'super-set': '#10b981',
            'drop-set': '#ef4444',
            'giant-set': '#8b5cf6',
          };
          const grupoTipo = ex.grupoTipo && ex.grupoTipo !== 'none' ? ex.grupoTipo : null;
          const grupoCor = grupoTipo ? GRUPO_CORES[grupoTipo] || '#6C63FF' : null;

          return (
            <View
              key={eIdx}
              style={grupoCor ? { borderLeftWidth: 3, borderLeftColor: grupoCor } : {}}
              className={`mb-3 rounded-2xl border overflow-hidden ${completo ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}
            >
              <TouchableOpacity
                onPress={() => toggleColapso(eIdx)}
                className="flex-row justify-between items-center p-4"
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  {grupoTipo && (
                    <View style={{ backgroundColor: grupoCor + '20' }} className="self-start px-2 py-0.5 rounded-md mb-1">
                      <Text style={{ color: grupoCor ?? undefined }} className="text-xs font-bold uppercase">
                        {grupoTipo} · Ex {(ex.grupoOrdem ?? 0) + 1}
                      </Text>
                    </View>
                  )}
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
                  {ex.exercicio.videoUrl && (
                    <TouchableOpacity
                      onPress={() => setVideoAtivo(ex.exercicio.videoUrl!)}
                      className="flex-row items-center gap-2 mb-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5"
                    >
                      <Ionicons name="play-circle-outline" size={20} color="#6C63FF" />
                      <Text className="text-primary text-sm font-semibold">Ver vídeo do exercício</Text>
                    </TouchableOpacity>
                  )}
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
