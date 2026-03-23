import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image,
  Alert, ActivityIndicator, FlatList, SectionList, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/services/api';
import { GRUPOS_MUSCULARES } from '../../src/constants/exerciciosPredefinidos';

interface Exercicio {
  _id: string;
  nome: string;
  descricao: string;
  instrucoes: string;
  musculosPrincipais: string[];
  musculosSecundarios?: string[];
  equipamento: string;
  dificuldade: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  publica: boolean;
  criadoPor: { nome: string } | null;
}

interface ExercicioDetalhe {
  _id?: string;
  nome: string;
  descricao?: string;
  instrucoes?: string;
  musculosPrincipais: string[];
  musculosSecundarios?: string[];
  equipamento: string;
  dificuldade: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  gifUrl?: string;
  publica?: boolean;
  isPredefinido?: boolean;
}

const MUSCULOS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'];
const EQUIPAMENTOS = ['barra', 'halteres', 'maquina', 'cabo', 'peso_corporal', 'elastico', 'kettlebell', 'outro'];
const DIFICULDADES = ['iniciante', 'intermediario', 'avancado'];

function ModalNovoExercicio({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [musculosSel, setMusculosSel] = useState<string[]>([]);
  const [musculoCustom, setMusculoCustom] = useState('');
  const [equipamento, setEquipamento] = useState('outro');
  const [equipamentoCustom, setEquipamentoCustom] = useState('');
  const [dificuldade, setDificuldade] = useState('intermediario');
  const [publica, setPublica] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const criarMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData() as any;
      formData.append('nome', nome);
      formData.append('descricao', descricao);
      formData.append('instrucoes', instrucoes);
      formData.append('musculosPrincipais', JSON.stringify(musculosSel));
      formData.append('musculosSecundarios', '[]');
      formData.append('equipamento', equipamento);
      formData.append('dificuldade', dificuldade);
      formData.append('publica', String(publica));
      if (videoUri) formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'exercicio.mp4' });
      if (gifUri) formData.append('thumbnail', { uri: gifUri, type: 'image/gif', name: 'exercicio.gif' });
      return api.post('/exercicios', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercicios'] });
      onFechar();
      setNome(''); setDescricao(''); setInstrucoes('');
      setMusculosSel([]); setVideoUri(null); setGifUri(null);
      Alert.alert('Exercício criado!', 'Já disponível na sua biblioteca.');
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Erro ao criar exercício.'),
  });

  async function selecionarGif() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 1 });
    if (!result.canceled) { setGifUri(result.assets[0].uri); setVideoUri(null); }
  }

  async function selecionarVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] as any, quality: 0.8 });
    if (!result.canceled) { setVideoUri(result.assets[0].uri); setGifUri(null); }
  }

  function toggleMusculo(m: string) {
    setMusculosSel((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  return (
    <Modal visible={visivel} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View style={{ flex: 1 }} />
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '92%' }}>
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
            <Text className="text-textPrimary text-xl font-bold">Novo Exercício</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6" keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>
            <View className="py-4">
              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Nome *</Text>
              <View className="bg-background border border-border rounded-xl px-4 mb-4">
                <TextInput className="text-textPrimary py-3.5 text-base" value={nome} onChangeText={setNome} placeholder="Ex: Supino Reto" placeholderTextColor="#5a5a70" />
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Descrição</Text>
              <View className="bg-background border border-border rounded-xl px-4 mb-4">
                <TextInput className="text-textPrimary py-3.5 text-base" value={descricao} onChangeText={setDescricao} placeholder="Descreva o exercício..." placeholderTextColor="#5a5a70" multiline numberOfLines={3} />
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Instruções</Text>
              <View className="bg-background border border-border rounded-xl px-4 mb-4">
                <TextInput className="text-textPrimary py-3.5 text-base" value={instrucoes} onChangeText={setInstrucoes} placeholder="1. Deite no banco..." placeholderTextColor="#5a5a70" multiline numberOfLines={4} />
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Músculos principais</Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {[...MUSCULOS, ...musculosSel.filter(m => !MUSCULOS.includes(m))].map((m) => (
                  <TouchableOpacity key={m} onPress={() => toggleMusculo(m)} className={`px-3 py-1.5 rounded-lg border ${musculosSel.includes(m) ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                    <Text className={`text-sm ${musculosSel.includes(m) ? 'text-white font-semibold' : 'text-textSecondary'}`}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-1 bg-background border border-border rounded-xl px-4">
                  <TextInput className="text-textPrimary py-2.5 text-sm" value={musculoCustom} onChangeText={setMusculoCustom} placeholder="Adicionar músculo..." placeholderTextColor="#5a5a70" />
                </View>
                <TouchableOpacity onPress={() => { const m = musculoCustom.trim(); if (m && !musculosSel.includes(m)) toggleMusculo(m); setMusculoCustom(''); }} className="bg-primary w-10 h-10 rounded-xl items-center justify-center">
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Equipamento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                {[...EQUIPAMENTOS, ...(equipamentoCustom && !EQUIPAMENTOS.includes(equipamentoCustom) ? [equipamentoCustom] : [])].map((e) => (
                  <TouchableOpacity key={e} onPress={() => setEquipamento(e)} className={`px-4 py-2 rounded-lg border mr-2 ${equipamento === e ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                    <Text className={`text-sm ${equipamento === e ? 'text-white font-semibold' : 'text-textSecondary'}`}>{e.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-1 bg-background border border-border rounded-xl px-4">
                  <TextInput className="text-textPrimary py-2.5 text-sm" value={equipamentoCustom} onChangeText={setEquipamentoCustom} placeholder="Outro equipamento..." placeholderTextColor="#5a5a70" />
                </View>
                <TouchableOpacity onPress={() => { const e = equipamentoCustom.trim(); if (e) setEquipamento(e); }} className="bg-primary w-10 h-10 rounded-xl items-center justify-center">
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Dificuldade</Text>
              <View className="flex-row gap-2 mb-4">
                {DIFICULDADES.map((d) => (
                  <TouchableOpacity key={d} onPress={() => setDificuldade(d)} className={`flex-1 py-2 rounded-lg border items-center ${dificuldade === d ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                    <Text className={`text-sm capitalize ${dificuldade === d ? 'text-white font-semibold' : 'text-textSecondary'}`}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Demonstração (GIF ou Vídeo)</Text>
              <View className="flex-row gap-3 mb-2">
                <TouchableOpacity onPress={selecionarGif} className={`flex-1 border rounded-xl p-3 items-center ${gifUri ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}>
                  <Ionicons name="image-outline" size={22} color={gifUri ? '#6C63FF' : '#9090a8'} />
                  <Text className={`text-xs mt-1 font-semibold ${gifUri ? 'text-primary' : 'text-textSecondary'}`}>{gifUri ? 'GIF ✓' : 'GIF'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={selecionarVideo} className={`flex-1 border rounded-xl p-3 items-center ${videoUri ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}>
                  <Ionicons name="videocam-outline" size={22} color={videoUri ? '#6C63FF' : '#9090a8'} />
                  <Text className={`text-xs mt-1 font-semibold ${videoUri ? 'text-primary' : 'text-textSecondary'}`}>{videoUri ? 'Vídeo ✓' : 'Vídeo'}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between py-3 border-t border-border mt-2 mb-4">
                <View>
                  <Text className="text-textPrimary font-semibold">Tornar público</Text>
                  <Text className="text-textMuted text-xs">Outros personais podem usar</Text>
                </View>
                <Switch value={publica} onValueChange={setPublica} trackColor={{ false: '#2e2e40', true: '#6C63FF' }} thumbColor="white" />
              </View>

              <TouchableOpacity onPress={() => criarMutation.mutate()} disabled={criarMutation.isPending || !nome} className="bg-primary rounded-xl py-4 items-center">
                {criarMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Criar Exercício</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const DIFCOR: Record<string, string> = { iniciante: '#4ade80', intermediario: '#facc15', avancado: '#f87171' };
const DIFLAB: Record<string, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
const EQUIPLAB: Record<string, string> = {
  barra: 'Barra', halteres: 'Halteres', maquina: 'Máquina', cabo: 'Cabo',
  peso_corporal: 'Peso Corporal', elastico: 'Elástico', kettlebell: 'Kettlebell', outro: 'Outro',
};

function ModalDetalheExercicio({
  exercicio, onFechar, onEditar, onRemover, onImportar, importando,
}: {
  exercicio: ExercicioDetalhe | null;
  onFechar: () => void;
  onEditar?: () => void;
  onRemover?: () => void;
  onImportar?: () => void;
  importando?: boolean;
}) {
  if (!exercicio) return null;
  const midia = exercicio.videoUrl || exercicio.thumbnailUrl || exercicio.gifUrl;
  const temDescricao = !!exercicio.descricao?.trim();
  const temInstrucoes = !!exercicio.instrucoes?.trim();
  const instrucaoLinhas = exercicio.instrucoes?.trim().split('\n').filter(Boolean) ?? [];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1a1a2e', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', flex: 1 }}>
          {/* Mídia */}
          {midia ? (
            <View style={{ height: 200, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: '#13131f' }}>
              <Image source={{ uri: midia }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <TouchableOpacity onPress={onFechar} style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 }}>
              <View style={{ width: 32 }} />
              <View style={{ width: 40, height: 4, backgroundColor: '#2e2e40', borderRadius: 2, flex: 1, marginHorizontal: 16 }} />
              <TouchableOpacity onPress={onFechar}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {/* Nome e badges */}
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>{exercicio.nome}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <View style={{ backgroundColor: 'rgba(108,99,255,0.15)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#6C63FF', fontSize: 12, fontWeight: '700' }}>{EQUIPLAB[exercicio.equipamento] ?? exercicio.equipamento}</Text>
              </View>
              <View style={{ backgroundColor: `${DIFCOR[exercicio.dificuldade]}20`, borderWidth: 1, borderColor: `${DIFCOR[exercicio.dificuldade]}50`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: DIFCOR[exercicio.dificuldade] ?? '#9090a8', fontSize: 12, fontWeight: '700' }}>{DIFLAB[exercicio.dificuldade] ?? exercicio.dificuldade}</Text>
              </View>
            </View>

            {/* Músculos principais */}
            <Text style={{ color: '#9090a8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Músculos principais</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {exercicio.musculosPrincipais.map((m) => (
                <View key={m} style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#c0c0d8', fontSize: 13 }}>{m}</Text>
                </View>
              ))}
            </View>

            {/* Músculos secundários */}
            {(exercicio.musculosSecundarios?.length ?? 0) > 0 && (
              <>
                <Text style={{ color: '#9090a8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Músculos secundários</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {exercicio.musculosSecundarios!.map((m) => (
                    <View key={m} style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#9090a8', fontSize: 13 }}>{m}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Descrição */}
            {temDescricao && (
              <>
                <Text style={{ color: '#9090a8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Descrição</Text>
                <Text style={{ color: '#c0c0d8', fontSize: 14, lineHeight: 22, marginBottom: 16 }}>{exercicio.descricao}</Text>
              </>
            )}

            {/* Instruções */}
            {temInstrucoes && (
              <>
                <Text style={{ color: '#9090a8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Instruções</Text>
                <View style={{ backgroundColor: '#13131f', borderRadius: 14, padding: 16, marginBottom: 16, gap: 10 }}>
                  {instrucaoLinhas.map((linha, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <Text style={{ color: '#6C63FF', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                      </View>
                      <Text style={{ color: '#c0c0d8', fontSize: 14, lineHeight: 22, flex: 1 }}>{linha.replace(/^\d+\.\s*/, '')}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {!temDescricao && !temInstrucoes && (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Text style={{ color: '#5a5a70', fontSize: 13, textAlign: 'center' }}>Nenhuma descrição ou instruções cadastradas.</Text>
              </View>
            )}

            {/* Ações */}
            <View style={{ gap: 10, marginTop: 8 }}>
              {exercicio.isPredefinido && onImportar && (
                <TouchableOpacity onPress={onImportar} disabled={importando} style={{ backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
                  {importando ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>+ Adicionar à Biblioteca</Text>}
                </TouchableOpacity>
              )}
              {!exercicio.isPredefinido && onEditar && (
                <TouchableOpacity onPress={onEditar} style={{ backgroundColor: 'rgba(108,99,255,0.15)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', borderRadius: 16, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="pencil-outline" size={18} color="#6C63FF" />
                  <Text style={{ color: '#6C63FF', fontWeight: '700', fontSize: 15 }}>Editar exercício</Text>
                </TouchableOpacity>
              )}
              {!exercicio.isPredefinido && onRemover && (
                <TouchableOpacity onPress={onRemover} style={{ backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 16, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
                  <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>Remover exercício</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ExerciciosScreen() {
  const [aba, setAba] = useState<'biblioteca' | 'predefinidos'>('biblioteca');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [grupoSel, setGrupoSel] = useState(GRUPOS_MUSCULARES[0].nome);
  const [grupoLib, setGrupoLib] = useState('Todos');
  const [importando, setImportando] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ExercicioDetalhe | null>(null);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [removendoLote, setRemovendoLote] = useState(false);
  const queryClient = useQueryClient();

  const { data: exercicios = [], isLoading } = useQuery<Exercicio[]>({
    queryKey: ['exercicios', busca],
    queryFn: () => {
      const params: Record<string, string> = { scope: 'minha' };
      if (busca) params.busca = busca;
      return api.get('/exercicios', { params }).then((r) => r.data);
    },
    enabled: aba === 'biblioteca',
  });

  // Derive unique muscle groups from library
  const muscGrupos = useMemo(() => {
    const grupos = new Set<string>();
    exercicios.forEach((ex) => ex.musculosPrincipais?.forEach((m) => grupos.add(m)));
    return ['Todos', ...Array.from(grupos).sort()];
  }, [exercicios]);

  // Group exercises into sections
  const secoes = useMemo(() => {
    const filtrados = grupoLib === 'Todos'
      ? exercicios
      : exercicios.filter((ex) => ex.musculosPrincipais?.includes(grupoLib));

    if (grupoLib !== 'Todos') {
      return [{ title: grupoLib, data: filtrados }];
    }

    // Group by first muscle or "Sem grupo"
    const mapa = new Map<string, Exercicio[]>();
    filtrados.forEach((ex) => {
      const grupo = ex.musculosPrincipais?.[0] || 'Sem grupo';
      if (!mapa.has(grupo)) mapa.set(grupo, []);
      mapa.get(grupo)!.push(ex);
    });
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [exercicios, grupoLib]);

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exercicios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercicios'] }),
  });

  // Exercícios visíveis no filtro atual (para "selecionar tudo do grupo")
  const exerciciosFiltrados = useMemo(() =>
    grupoLib === 'Todos' ? exercicios : exercicios.filter((ex) => ex.musculosPrincipais?.includes(grupoLib)),
    [exercicios, grupoLib]
  );

  function toggleSelecao(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selecionarTodosFiltro() {
    setSelecionados(new Set(exerciciosFiltrados.map((e) => e._id)));
  }

  function limparSelecao() {
    setSelecionados(new Set());
    setModoSelecao(false);
  }

  async function removerSelecionados() {
    if (selecionados.size === 0) return;
    Alert.alert(
      'Remover exercícios',
      `Remover ${selecionados.size} exercício(s) selecionado(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: async () => {
            setRemovendoLote(true);
            try {
              await Promise.all([...selecionados].map((id) => api.delete(`/exercicios/${id}`)));
              queryClient.invalidateQueries({ queryKey: ['exercicios'] });
              limparSelecao();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover todos os exercícios.');
            } finally {
              setRemovendoLote(false);
            }
          },
        },
      ]
    );
  }

  async function importarExercicio(ex: { nome: string; musculosPrincipais: string[]; equipamento: string; dificuldade: string; gifUrl?: string }) {
    setImportando(ex.nome);
    try {
      await api.post('/exercicios/importar', ex);
      queryClient.invalidateQueries({ queryKey: ['exercicios'] });
      Alert.alert('Adicionado!', `"${ex.nome}" foi adicionado à sua biblioteca.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o exercício.');
    } finally {
      setImportando(null);
    }
  }

  const grupoAtual = GRUPOS_MUSCULARES.find((g) => g.nome === grupoSel);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
        <View>
          <Text className="text-textPrimary text-2xl font-bold">Exercícios</Text>
          <Text className="text-textSecondary text-sm">{aba === 'biblioteca' ? `${exercicios.length} na sua biblioteca` : 'Banco de exercícios'}</Text>
        </View>
        <View className="flex-row gap-2 items-center">
          {aba === 'biblioteca' && !modoSelecao && exercicios.length > 0 && (
            <TouchableOpacity
              onPress={() => setModoSelecao(true)}
              style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: '#9090a8', fontSize: 13, fontWeight: '600' }}>Selecionar</Text>
            </TouchableOpacity>
          )}
          {!modoSelecao && (
            <TouchableOpacity onPress={() => setModalAberto(true)} className="bg-primary w-12 h-12 rounded-2xl items-center justify-center">
              <Ionicons name="add" size={26} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Abas */}
      <View className="flex-row mx-5 mb-3 bg-surface border border-border rounded-xl p-1">
        {(['biblioteca', 'predefinidos'] as const).map((a) => (
          <TouchableOpacity key={a} onPress={() => setAba(a)} className={`flex-1 py-2 rounded-lg items-center ${aba === a ? 'bg-primary' : ''}`}>
            <Text className={`text-sm font-semibold capitalize ${aba === a ? 'text-white' : 'text-textSecondary'}`}>
              {a === 'biblioteca' ? 'Minha Biblioteca' : 'Predefinidos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {aba === 'biblioteca' ? (
        <>
          {/* Barra de seleção */}
          {modoSelecao ? (
            <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: '#1e1e2e', borderRadius: 16, borderWidth: 1, borderColor: '#2e2e40', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={limparSelecao} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#9090a8" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontWeight: '700', flex: 1 }}>
                {selecionados.size > 0 ? `${selecionados.size} selecionado(s)` : 'Nenhum selecionado'}
              </Text>
              <TouchableOpacity
                onPress={selecionarTodosFiltro}
                style={{ backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {grupoLib === 'Todos' ? 'Todos' : `Todo ${grupoLib}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={removerSelecionados}
                disabled={selecionados.size === 0 || removendoLote}
                style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                {removendoLote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Remover</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Busca */
            <View className="mx-5 mb-3 flex-row items-center bg-surface border border-border rounded-xl px-4">
              <Ionicons name="search-outline" size={18} color="#9090a8" />
              <TextInput className="flex-1 text-textPrimary py-3.5 ml-3 text-base" placeholder="Buscar exercício..." placeholderTextColor="#5a5a70" value={busca} onChangeText={setBusca} />
            </View>
          )}

          {/* Filtro por grupo muscular */}
          {!isLoading && muscGrupos.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
              {muscGrupos.map((g) => {
                const ativo = grupoLib === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGrupoLib(g)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: ativo ? '#6C63FF' : '#1a1a2e',
                      borderColor: ativo ? '#6C63FF' : '#2e2e40',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: ativo ? '#ffffff' : '#9090a8' }}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {isLoading ? (
            <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
          ) : (
            <SectionList
              sections={secoes}
              keyExtractor={(e) => e._id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Ionicons name="barbell-outline" size={56} color="#2e2e40" />
                  <Text className="text-textSecondary text-center mt-4">Nenhum exercício ainda.{'\n'}Crie ou importe dos predefinidos!</Text>
                </View>
              }
              renderSectionHeader={({ section }) =>
                grupoLib === 'Todos' ? (
                  <View className="flex-row items-center gap-2 mb-2 mt-4">
                    <Text className="text-textSecondary text-xs font-bold uppercase tracking-widest">{section.title}</Text>
                    <View className="flex-1 h-px bg-border" />
                    <Text className="text-textMuted text-xs">{section.data.length}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item: ex }) => {
                const selecionado = selecionados.has(ex._id);
                return (
                  <TouchableOpacity
                    activeOpacity={1}
                    style={{
                      backgroundColor: selecionado ? '#2d1414' : '#1e1e2e',
                      borderWidth: 1,
                      borderColor: selecionado ? '#7f1d1d' : '#2e2e40',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                    onPress={() => modoSelecao ? toggleSelecao(ex._id) : setDetalhe({ ...ex, isPredefinido: false })}
                  >
                    {modoSelecao && (
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: selecionado ? '#dc2626' : 'transparent',
                        borderWidth: 2, borderColor: selecionado ? '#dc2626' : '#3e3e50',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selecionado && <Ionicons name="checkmark" size={13} color="white" />}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 }}>{ex.nome}</Text>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Text style={{ fontSize: 11, color: DIFCOR[ex.dificuldade] || '#9090a8', fontWeight: '600' }}>{DIFLAB[ex.dificuldade] ?? ex.dificuldade}</Text>
                          <Text style={{ fontSize: 11, color: '#5a5a70' }}>{EQUIPLAB[ex.equipamento] ?? ex.equipamento?.replace('_', ' ')}</Text>
                        </View>
                      </View>
                      {ex.musculosPrincipais?.length > 0 && (
                        <Text style={{ color: '#9090a8', fontSize: 12, marginTop: 2 }}>{ex.musculosPrincipais.join(' · ')}</Text>
                      )}
                      {(ex.descricao || ex.instrucoes) && (
                        <Text style={{ color: '#5a5a70', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{ex.descricao || ex.instrucoes}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      ) : (
        <>
          {/* Filtro por grupo muscular */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
            {GRUPOS_MUSCULARES.map((g) => {
              const ativo = grupoSel === g.nome;
              return (
                <TouchableOpacity
                  key={g.nome}
                  onPress={() => setGrupoSel(g.nome)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    backgroundColor: ativo ? '#6C63FF' : '#1a1a2e',
                    borderColor: ativo ? '#6C63FF' : '#2e2e40',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: ativo ? '#ffffff' : '#9090a8' }}>{g.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Lista de exercícios predefinidos */}
          <FlatList
            data={grupoAtual?.exercicios ?? []}
            keyExtractor={(e) => e.nome}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            renderItem={({ item: ex }) => (
              <TouchableOpacity
                className="bg-surface border border-border rounded-2xl mb-3 overflow-hidden"
                onPress={() => setDetalhe({ ...ex, isPredefinido: true })}
              >
                {ex.gifUrl && (
                  <Image source={{ uri: ex.gifUrl }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                )}
                <View className="flex-row items-center p-4">
                  <View className="flex-1">
                    <Text className="text-textPrimary font-bold text-base">{ex.nome}</Text>
                    <Text className="text-textMuted text-xs mt-0.5">
                      {ex.musculosPrincipais.join(' · ')} · {EQUIPLAB[ex.equipamento] ?? ex.equipamento.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(108,99,255,0.1)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 12 }}>
                    <Text style={{ color: '#6C63FF', fontSize: 11, fontWeight: '700' }}>Ver detalhes</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      <ModalNovoExercicio visivel={modalAberto} onFechar={() => setModalAberto(false)} />

      {detalhe && (
        <ModalDetalheExercicio
          exercicio={detalhe}
          onFechar={() => setDetalhe(null)}
          onImportar={detalhe.isPredefinido ? () => {
            importarExercicio(detalhe as any);
            setDetalhe(null);
          } : undefined}
          importando={importando === detalhe.nome}
          onRemover={!detalhe.isPredefinido && detalhe._id ? () => {
            Alert.alert('Remover exercício?', detalhe.nome, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: () => { deletarMutation.mutate(detalhe._id!); setDetalhe(null); } },
            ]);
          } : undefined}
        />
      )}
    </SafeAreaView>
  );
}
