import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-gifted-charts';
import Svg, { Circle, Rect, Ellipse, Path, G } from 'react-native-svg';
import api from '../../src/services/api';

const { width: SCREEN_W } = Dimensions.get('window');

interface ResumoData {
  totalSessoes: number;
  ultimasSessoes: Array<{
    _id: string;
    treino: { nome: string; tipo: string };
    dataFim: string;
    duracaoSegundos: number;
  }>;
  prs: Array<{
    _id: string;
    exercicio: { nome: string };
    cargaMaxima: number;
    volumeTotal: number;
    ultimaData: string;
  }>;
  treinosPorDia: Array<{ _id: string; count: number }>;
}

interface MusculoItem { musculo: string; series: number }
interface MusculosData { periodo: string; resultado: MusculoItem[] }

// ── Corpo muscular 3D ────────────────────────────────────────────────────────
type MuscleKey =
  | 'peitoral' | 'ombros' | 'biceps' | 'antebraco'
  | 'abdomen' | 'obliquos' | 'quadriceps' | 'panturrilhas'
  | 'trapezio' | 'dorsais' | 'lombar' | 'triceps'
  | 'gluteos' | 'posteriores';

function normalizarMusculos(nome: string): MuscleKey[] {
  const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const mapa: Record<string, MuscleKey[]> = {
    'peitoral': ['peitoral'], 'peito': ['peitoral'],
    'costas': ['dorsais', 'trapezio'], 'dorsais': ['dorsais'],
    'trapezio': ['trapezio'], 'trapezios': ['trapezio'],
    'ombros': ['ombros'], 'deltoides': ['ombros'], 'deltoide': ['ombros'],
    'biceps': ['biceps'],
    'triceps': ['triceps'],
    'abdomen': ['abdomen'], 'abdominal': ['abdomen'], 'abdominais': ['abdomen'], 'core': ['abdomen'],
    'obliquos': ['obliquos'], 'obliquo': ['obliquos'],
    'gluteos': ['gluteos'], 'gluteo': ['gluteos'],
    'quadriceps': ['quadriceps'], 'quadricep': ['quadriceps'], 'coxa': ['quadriceps'], 'coxas': ['quadriceps'],
    'posteriores': ['posteriores'], 'isquiotibiais': ['posteriores'],
    'panturrilhas': ['panturrilhas'], 'panturrilha': ['panturrilhas'], 'gemeos': ['panturrilhas'],
    'lombar': ['lombar'],
    'antebraco': ['antebraco'], 'antebracos': ['antebraco'],
  };
  return mapa[n] ?? [];
}

// Skin tone palette
const SKIN_BODY   = '#c8956c';
const SKIN_DARK   = '#a0704a';
const SKIN_STROKE = '#8a5c38';

function GraficoMusculos() {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('semana');

  const { data, isLoading } = useQuery<MusculosData>({
    queryKey: ['musculos', periodo],
    queryFn: () => api.get('/progresso/musculos', { params: { periodo } }).then((r) => r.data),
  });

  const resultado = data?.resultado ?? [];
  const maxSeries = Math.max(...resultado.map((r) => r.series), 1);

  const muscMap = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const item of resultado) {
      for (const key of normalizarMusculos(item.musculo)) {
        m[key] = Math.max(m[key] ?? 0, item.series);
      }
    }
    return m;
  }, [resultado]);

  function muscCor(k: string): string {
    const s = muscMap[k] ?? 0;
    if (s === 0) return SKIN_DARK;
    const p = s / maxSeries;
    if (p >= 0.7) return '#ef4444';
    if (p >= 0.4) return '#facc15';
    return '#4ade80';
  }

  function mp(k: string) {
    const ativo = (muscMap[k] ?? 0) > 0;
    return {
      fill: muscCor(k),
      stroke: ativo ? '#ffffff33' : SKIN_STROKE,
      strokeWidth: 0.6,
      opacity: ativo ? 0.9 : 0.55,
    };
  }

  const periodos: Array<{ key: 'dia' | 'semana' | 'mes'; label: string }> = [
    { key: 'dia', label: 'Hoje' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mês' },
  ];

  const figW = Math.floor((SCREEN_W - 60) / 2);
  const figH = Math.round((figW / 140) * 300);

  const BaseSilhueta = () => (
    <G fill={SKIN_BODY} stroke={SKIN_STROKE} strokeWidth="0.6">
      <Circle cx={70} cy={17} r={16} />
      <Rect x={63} y={32} width={14} height={13} rx={3} />
      <Rect x={22} y={38} width={96} height={78} rx={10} />
      <Rect x={6} y={40} width={18} height={78} rx={8} />
      <Rect x={116} y={40} width={18} height={78} rx={8} />
      <Rect x={8} y={120} width={14} height={60} rx={7} />
      <Rect x={118} y={120} width={14} height={60} rx={7} />
      <Rect x={24} y={114} width={92} height={32} rx={8} />
      <Rect x={24} y={142} width={38} height={78} rx={12} />
      <Rect x={78} y={142} width={38} height={78} rx={12} />
      <Rect x={28} y={222} width={30} height={66} rx={9} />
      <Rect x={82} y={222} width={30} height={66} rx={9} />
      <Rect x={22} y={283} width={42} height={13} rx={6} />
      <Rect x={76} y={283} width={42} height={13} rx={6} />
    </G>
  );

  return (
    <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 20, padding: 20 }}>
      {/* Header + período */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Músculos treinados</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {periodos.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriodo(p.key)}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
                backgroundColor: periodo === p.key ? '#6C63FF' : '#1a1a2e',
                borderColor: periodo === p.key ? '#6C63FF' : '#2e2e40',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: periodo === p.key ? '#fff' : '#9090a8' }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6C63FF" />
        </View>
      ) : (
        <>
          {/* Frente e costas lado a lado */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {/* FRENTE */}
            <Svg width={figW} height={figH} viewBox="0 0 140 300">
              <BaseSilhueta />
              <G>
                <Ellipse cx={12} cy={60} rx={11} ry={18} {...mp('ombros')} />
                <Ellipse cx={128} cy={60} rx={11} ry={18} {...mp('ombros')} />
                <Ellipse cx={44} cy={72} rx={20} ry={17} {...mp('peitoral')} />
                <Ellipse cx={96} cy={72} rx={20} ry={17} {...mp('peitoral')} />
                <Ellipse cx={11} cy={92} rx={8} ry={18} {...mp('biceps')} />
                <Ellipse cx={129} cy={92} rx={8} ry={18} {...mp('biceps')} />
                <Ellipse cx={13} cy={138} rx={6} ry={22} {...mp('antebraco')} />
                <Ellipse cx={127} cy={138} rx={6} ry={22} {...mp('antebraco')} />
                {[0, 1, 2].map((row) => [0, 1].map((col) => {
                  const cx = col === 0 ? 57 : 83;
                  const cy = 85 + row * 12;
                  return <Rect key={`ab${row}${col}`} x={cx - 8} y={cy - 5} width={14} height={10} rx={3} {...mp('abdomen')} />;
                }))}
                <Ellipse cx={36} cy={99} rx={10} ry={22} {...mp('obliquos')} />
                <Ellipse cx={104} cy={99} rx={10} ry={22} {...mp('obliquos')} />
                <Ellipse cx={43} cy={184} rx={17} ry={30} {...mp('quadriceps')} />
                <Ellipse cx={97} cy={184} rx={17} ry={30} {...mp('quadriceps')} />
                <Ellipse cx={43} cy={248} rx={12} ry={22} {...mp('panturrilhas')} />
                <Ellipse cx={97} cy={248} rx={12} ry={22} {...mp('panturrilhas')} />
              </G>
            </Svg>

            {/* COSTAS */}
            <Svg width={figW} height={figH} viewBox="0 0 140 300">
              <BaseSilhueta />
              <G>
                <Ellipse cx={12} cy={58} rx={11} ry={17} {...mp('ombros')} />
                <Ellipse cx={128} cy={58} rx={11} ry={17} {...mp('ombros')} />
                <Path d="M70,33 L26,50 L32,76 L108,76 L114,50 Z" {...mp('trapezio')} />
                <Path d="M32,52 L46,62 L50,112 L30,112 Z" {...mp('dorsais')} />
                <Path d="M108,52 L94,62 L90,112 L110,112 Z" {...mp('dorsais')} />
                <Ellipse cx={11} cy={92} rx={8} ry={18} {...mp('triceps')} />
                <Ellipse cx={129} cy={92} rx={8} ry={18} {...mp('triceps')} />
                <Ellipse cx={13} cy={138} rx={6} ry={22} {...mp('antebraco')} />
                <Ellipse cx={127} cy={138} rx={6} ry={22} {...mp('antebraco')} />
                <Rect x={54} y={106} width={14} height={28} rx={5} {...mp('lombar')} />
                <Rect x={72} y={106} width={14} height={28} rx={5} {...mp('lombar')} />
                <Ellipse cx={43} cy={155} rx={21} ry={19} {...mp('gluteos')} />
                <Ellipse cx={97} cy={155} rx={21} ry={19} {...mp('gluteos')} />
                <Ellipse cx={43} cy={193} rx={16} ry={28} {...mp('posteriores')} />
                <Ellipse cx={97} cy={193} rx={16} ry={28} {...mp('posteriores')} />
                <Ellipse cx={43} cy={248} rx={12} ry={22} {...mp('panturrilhas')} />
                <Ellipse cx={97} cy={248} rx={12} ry={22} {...mp('panturrilhas')} />
              </G>
            </Svg>
          </View>

          {/* Legenda */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2e2e40' }}>
            {[
              { cor: '#4ade80', label: 'Enfraquecido' },
              { cor: '#facc15', label: 'Em recuperação' },
              { cor: '#ef4444', label: 'Fadigado' },
            ].map((l) => (
              <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: l.cor }} />
                <Text style={{ color: '#9090a8', fontSize: 12 }}>{l.label}</Text>
              </View>
            ))}
          </View>

          {/* Tags dos grupos trabalhados */}
          {resultado.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {resultado.slice(0, 10).map((item) => {
                const p = item.series / maxSeries;
                const cor = p >= 0.7 ? '#ef4444' : p >= 0.4 ? '#facc15' : '#4ade80';
                return (
                  <View key={item.musculo} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#2e2e40', backgroundColor: '#1a1a2e' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cor }} />
                    <Text style={{ color: '#c0c0d8', fontSize: 11 }}>{item.musculo}</Text>
                    <Text style={{ color: '#9090a8', fontSize: 10 }}>{item.series}s</Text>
                  </View>
                );
              })}
            </View>
          )}

          {resultado.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: '#9090a8', fontSize: 13 }}>
                Nenhum treino registrado{periodo === 'dia' ? ' hoje' : periodo === 'semana' ? ' esta semana' : ' este mês'}.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

interface EvolucaoItem {
  _id: string;
  data: string;
  cargaMaxima: number;
  repsMaximas: number;
  volumeTotal: number;
  totalSeries: number;
}

interface SessaoDetalhe {
  _id: string;
  treino: { nome: string; tipo: string };
  dataInicio: string;
  dataFim: string;
  duracaoSegundos: number;
  notasAluno: string;
  exerciciosExecutados: Array<{
    exercicio: { nome: string; musculosPrincipais: string[] };
    series: Array<{
      numero: number;
      cargaUsada: number;
      repsExecutadas: number;
      completada: boolean;
    }>;
  }>;
}

function BarraSemana({ dados }: { dados: Array<{ _id: string; count: number }> }) {
  const maxCount = Math.max(...dados.map((d) => d.count), 1);
  const barW = Math.floor((SCREEN_W - 80) / 7);
  const diasLabel = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const hoje = new Date();
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <View className="flex-row items-end justify-between h-20">
      {ultimos7.map((dia) => {
        const registro = dados.find((d) => d._id === dia);
        const count = registro?.count ?? 0;
        const pct = count / maxCount;
        const diaSemana = new Date(dia + 'T00:00:00').getDay();

        return (
          <View key={dia} className="items-center" style={{ width: barW }}>
            <View className="flex-1 w-full items-center justify-end">
              <View
                className={`rounded-t-sm ${count > 0 ? 'bg-primary' : 'bg-surfaceLight'}`}
                style={{ width: barW - 6, height: Math.max(4, 56 * pct) }}
              />
            </View>
            <Text className="text-textMuted text-xs mt-1">{diasLabel[diaSemana]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ModalEvolucao({
  exercicioId,
  exercicioNome,
  onClose,
}: {
  exercicioId: string;
  exercicioNome: string;
  onClose: () => void;
}) {
  const [metrica, setMetrica] = useState<'carga' | 'volume' | 'reps'>('carga');

  const { data: evolucao = [], isLoading } = useQuery<EvolucaoItem[]>({
    queryKey: ['evolucao', exercicioId],
    queryFn: () => api.get(`/progresso/exercicio/${exercicioId}`).then((r) => r.data),
    enabled: !!exercicioId,
  });

  const pontos = evolucao.map((item) => ({
    value:
      metrica === 'carga'
        ? item.cargaMaxima
        : metrica === 'volume'
        ? Math.round(item.volumeTotal)
        : item.repsMaximas,
    label: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    dataPointText:
      metrica === 'carga'
        ? `${item.cargaMaxima}kg`
        : metrica === 'volume'
        ? `${Math.round(item.volumeTotal)}`
        : `${item.repsMaximas}`,
  }));

  const metricas: Array<{ key: 'carga' | 'volume' | 'reps'; label: string }> = [
    { key: 'carga', label: 'Carga (kg)' },
    { key: 'reps', label: 'Reps' },
    { key: 'volume', label: 'Volume' },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
            <View>
              <Text className="text-textMuted text-xs uppercase tracking-widest mb-1">Evolução</Text>
              <Text className="text-textPrimary text-lg font-bold" numberOfLines={1}>
                {exercicioNome}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Seletor de métrica */}
            <View className="flex-row mx-5 mt-5 gap-2">
              {metricas.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMetrica(m.key)}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    metrica === m.key
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      metrica === m.key ? 'text-white' : 'text-textSecondary'
                    }`}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {isLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator color="#6C63FF" />
              </View>
            ) : pontos.length < 2 ? (
              <View className="py-16 items-center px-5">
                <Ionicons name="stats-chart-outline" size={48} color="#2e2e40" />
                <Text className="text-textSecondary text-center mt-3">
                  Faça pelo menos 2 treinos com este exercício para ver a evolução.
                </Text>
              </View>
            ) : (
              <View className="mt-5 px-3">
                <LineChart
                  data={pontos}
                  width={SCREEN_W - 60}
                  height={200}
                  color="#6C63FF"
                  thickness={2}
                  dataPointsColor="#6C63FF"
                  dataPointsRadius={5}
                  curved
                  hideRules={false}
                  rulesColor="#2e2e40"
                  rulesType="solid"
                  yAxisColor="#2e2e40"
                  xAxisColor="#2e2e40"
                  yAxisTextStyle={{ color: '#9090a8', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#9090a8', fontSize: 9 }}
                  showTextOnFocus
                  focusedDataPointColor="#a89dff"
                  focusedDataPointRadius={7}
                  startFillColor="#6C63FF"
                  endFillColor="#0f0f14"
                  startOpacity={0.2}
                  endOpacity={0}
                  areaChart
                />
              </View>
            )}

            {/* Tabela de registros */}
            {evolucao.length > 0 && (
              <View className="mx-5 mt-5 mb-8">
                <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-3">
                  Histórico
                </Text>
                {[...evolucao].reverse().map((item) => (
                  <View
                    key={item._id}
                    className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3 mb-2"
                  >
                    <Text className="text-textMuted text-xs w-20">
                      {new Date(item.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                    <View className="flex-1 flex-row justify-around">
                      <View className="items-center">
                        <Text className="text-textPrimary font-bold">{item.cargaMaxima}kg</Text>
                        <Text className="text-textMuted text-xs">carga</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-textPrimary font-bold">{item.repsMaximas}</Text>
                        <Text className="text-textMuted text-xs">reps</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-textPrimary font-bold">{item.totalSeries}</Text>
                        <Text className="text-textMuted text-xs">séries</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalSessao({
  sessaoId,
  onClose,
}: {
  sessaoId: string;
  onClose: () => void;
}) {
  const { data: sessao, isLoading } = useQuery<SessaoDetalhe>({
    queryKey: ['sessao-detalhe', sessaoId],
    queryFn: () => api.get(`/sessoes/${sessaoId}`).then((r) => r.data),
    enabled: !!sessaoId,
  });

  const formatDuracao = (seg: number) => {
    const min = Math.floor(seg / 60);
    return `${min}min`;
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '90%' }}>
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
            <View>
              {sessao && (
                <View className="bg-primary/20 px-2 py-0.5 rounded-md self-start mb-1">
                  <Text className="text-primary text-xs font-bold">Treino {sessao.treino.tipo}</Text>
                </View>
              )}
              <Text className="text-textPrimary text-lg font-bold">
                {sessao?.treino.nome ?? 'Carregando...'}
              </Text>
              {sessao && (
                <Text className="text-textMuted text-xs mt-0.5">
                  {new Date(sessao.dataFim).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                  {' · '}
                  {formatDuracao(sessao.duracaoSegundos)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="px-5 pt-4">
            {isLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator color="#6C63FF" />
              </View>
            ) : (
              sessao?.exerciciosExecutados.map((ex, i) => {
                const seriesCompletas = ex.series.filter((s) => s.completada);
                if (seriesCompletas.length === 0) return null;
                return (
                  <View key={i} className="bg-background border border-border rounded-2xl p-4 mb-3">
                    <Text className="text-textPrimary font-bold mb-1">{ex.exercicio.nome}</Text>
                    {ex.exercicio.musculosPrincipais?.length > 0 && (
                      <Text className="text-textMuted text-xs mb-3">
                        {ex.exercicio.musculosPrincipais.join(' · ')}
                      </Text>
                    )}
                    <View className="flex-row px-2 mb-2">
                      <Text className="text-textMuted text-xs w-8">#</Text>
                      <Text className="flex-1 text-textMuted text-xs text-center">Carga (kg)</Text>
                      <Text className="flex-1 text-textMuted text-xs text-center">Reps</Text>
                    </View>
                    {seriesCompletas.map((s, j) => (
                      <View
                        key={j}
                        className="flex-row items-center bg-success/5 border border-success/20 rounded-xl px-2 py-2 mb-1"
                      >
                        <Text className="text-textMuted text-xs w-8">{s.numero}</Text>
                        <Text className="flex-1 text-textPrimary font-bold text-center">
                          {s.cargaUsada || '—'}
                        </Text>
                        <Text className="flex-1 text-textPrimary font-bold text-center">
                          {s.repsExecutadas || '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
            <View className="h-8" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ProgressoScreen() {
  const [evolucaoSelecionada, setEvolucaoSelecionada] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<string | null>(null);
  const [mostrarTodasSessoes, setMostrarTodasSessoes] = useState(false);

  const { data, isLoading } = useQuery<ResumoData>({
    queryKey: ['progresso-resumo'],
    queryFn: () => api.get('/progresso/resumo').then((r) => r.data),
  });

  const formatDuracao = (seg: number) => `${Math.floor(seg / 60)}min`;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6C63FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Modal gráfico de evolução */}
      {evolucaoSelecionada && (
        <ModalEvolucao
          exercicioId={evolucaoSelecionada.id}
          exercicioNome={evolucaoSelecionada.nome}
          onClose={() => setEvolucaoSelecionada(null)}
        />
      )}

      {/* Modal detalhe de sessão */}
      {sessaoSelecionada && (
        <ModalSessao
          sessaoId={sessaoSelecionada}
          onClose={() => setSessaoSelecionada(null)}
        />
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-textPrimary text-2xl font-bold">Meu Progresso</Text>
          <Text className="text-textSecondary text-sm">Acompanhe sua evolução</Text>
        </View>

        {/* Stats rápidos */}
        <View className="flex-row px-5 gap-3 mt-4">
          <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
            <Ionicons name="flash-outline" size={22} color="#6C63FF" />
            <Text className="text-textPrimary text-3xl font-bold mt-2">{data?.totalSessoes ?? 0}</Text>
            <Text className="text-textSecondary text-xs mt-1">Treinos totais</Text>
          </View>
          <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
            <Ionicons name="trophy-outline" size={22} color="#facc15" />
            <Text className="text-textPrimary text-3xl font-bold mt-2">{data?.prs.length ?? 0}</Text>
            <Text className="text-textSecondary text-xs mt-1">Exercícios rastreados</Text>
          </View>
        </View>

        {/* Frequência últimos 7 dias */}
        <View className="mx-5 mt-5 bg-surface border border-border rounded-2xl p-5">
          <Text className="text-textPrimary font-bold text-base mb-4">
            Frequência — últimos 7 dias
          </Text>
          {data?.treinosPorDia && data.treinosPorDia.length > 0 ? (
            <BarraSemana dados={data.treinosPorDia} />
          ) : (
            <View className="h-20 items-center justify-center">
              <Text className="text-textMuted text-sm">Nenhum treino esta semana</Text>
            </View>
          )}
        </View>

        {/* Gráfico de músculos */}
        <GraficoMusculos />

        {/* PRs — toque para ver gráfico de evolução */}
        {data?.prs && data.prs.length > 0 && (
          <View className="mt-5">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-textPrimary font-bold text-base">Recordes pessoais 🏆</Text>
              <Text className="text-textMuted text-xs">Toque para ver evolução</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {data.prs.map((pr) => (
                <TouchableOpacity
                  key={pr._id}
                  onPress={() =>
                    setEvolucaoSelecionada({ id: pr._id, nome: pr.exercicio.nome })
                  }
                  className="bg-surface border border-border rounded-2xl p-4 mr-3"
                  style={{ width: 160 }}
                >
                  <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
                    <Ionicons name="trophy-outline" size={20} color="#6C63FF" />
                  </View>
                  <Text className="text-textSecondary text-xs mb-1" numberOfLines={2}>
                    {pr.exercicio.nome}
                  </Text>
                  <Text className="text-textPrimary text-2xl font-bold">
                    {pr.cargaMaxima > 0 ? `${pr.cargaMaxima}kg` : '—'}
                  </Text>
                  <Text className="text-textMuted text-xs mt-1">
                    {new Date(pr.ultimaData).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-2">
                    <Ionicons name="stats-chart-outline" size={12} color="#6C63FF" />
                    <Text className="text-primary text-xs">Ver evolução</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Histórico recente — toque para ver detalhe */}
        <View className="px-5 mt-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-textPrimary font-bold text-base">Histórico recente</Text>
            <Text className="text-textMuted text-xs">Toque para detalhar</Text>
          </View>
          {data?.ultimasSessoes && data.ultimasSessoes.length > 0 ? (
            <>
              {(mostrarTodasSessoes ? data.ultimasSessoes : data.ultimasSessoes.slice(0, 3)).map((sessao) => (
                <TouchableOpacity
                  key={sessao._id}
                  onPress={() => setSessaoSelecionada(sessao._id)}
                  className="bg-surface border border-border rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <View className="bg-primary/20 px-2 py-0.5 rounded-md self-start mb-1">
                        <Text className="text-primary text-xs font-bold">
                          Treino {sessao.treino.tipo}
                        </Text>
                      </View>
                      <Text className="text-textPrimary font-semibold">{sessao.treino.nome}</Text>
                      <Text className="text-textMuted text-xs mt-0.5">
                        {new Date(sessao.dataFim).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#9090a8" />
                        <Text className="text-textSecondary text-sm">
                          {formatDuracao(sessao.duracaoSegundos)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#5a5a70" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {data.ultimasSessoes.length > 3 && (
                <TouchableOpacity
                  onPress={() => setMostrarTodasSessoes((v) => !v)}
                  className="flex-row items-center justify-center gap-1.5 py-3 border border-border rounded-2xl"
                >
                  <Text className="text-textSecondary text-sm">
                    {mostrarTodasSessoes
                      ? 'Ver menos'
                      : `Ver todos (${data.ultimasSessoes.length})`}
                  </Text>
                  <Ionicons
                    name={mostrarTodasSessoes ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#9090a8"
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="py-10 items-center">
              <Ionicons name="calendar-outline" size={40} color="#2e2e40" />
              <Text className="text-textSecondary text-center mt-3">
                Nenhum treino concluído ainda.{'\n'}Comece agora na aba Treino!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
