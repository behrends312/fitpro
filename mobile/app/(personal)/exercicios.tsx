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
  musculosPrincipais: string[];
  equipamento: string;
  dificuldade: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  publica: boolean;
  criadoPor: { nome: string } | null;
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

export default function ExerciciosScreen() {
  const [aba, setAba] = useState<'biblioteca' | 'predefinidos'>('biblioteca');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [grupoSel, setGrupoSel] = useState(GRUPOS_MUSCULARES[0].nome);
  const [grupoLib, setGrupoLib] = useState('Todos');
  const [importando, setImportando] = useState<string | null>(null);
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
        <TouchableOpacity onPress={() => setModalAberto(true)} className="bg-primary w-12 h-12 rounded-2xl items-center justify-center">
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
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
          {/* Busca */}
          <View className="mx-5 mb-3 flex-row items-center bg-surface border border-border rounded-xl px-4">
            <Ionicons name="search-outline" size={18} color="#9090a8" />
            <TextInput className="flex-1 text-textPrimary py-3.5 ml-3 text-base" placeholder="Buscar exercício..." placeholderTextColor="#5a5a70" value={busca} onChangeText={setBusca} />
          </View>

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
              renderItem={({ item: ex }) => (
                <TouchableOpacity
                  className="bg-surface border border-border rounded-2xl p-4 mb-3"
                  onLongPress={() =>
                    Alert.alert('Remover exercício?', ex.nome, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => deletarMutation.mutate(ex._id) },
                    ])
                  }
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-textPrimary font-bold text-base">{ex.nome}</Text>
                      {ex.musculosPrincipais?.length > 0 && (
                        <Text className="text-textMuted text-xs mt-0.5">{ex.musculosPrincipais.join(' · ')}</Text>
                      )}
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-xs capitalize" style={{ color: DIFCOR[ex.dificuldade] || '#9090a8' }}>{ex.dificuldade}</Text>
                      <Text className="text-textMuted text-xs capitalize">{ex.equipamento?.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
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
              <View className="bg-surface border border-border rounded-2xl mb-3 overflow-hidden">
                {ex.gifUrl && (
                  <Image source={{ uri: ex.gifUrl }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                )}
                <View className="flex-row items-center p-4">
                  <View className="flex-1">
                    <Text className="text-textPrimary font-bold text-base">{ex.nome}</Text>
                    <Text className="text-textMuted text-xs mt-0.5">
                      {ex.musculosPrincipais.join(' · ')} · {ex.equipamento.replace('_', ' ')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => importarExercicio(ex)}
                    disabled={importando === ex.nome}
                    className="bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-lg ml-3"
                  >
                    {importando === ex.nome ? (
                      <ActivityIndicator color="#6C63FF" size="small" />
                    ) : (
                      <Text className="text-primary text-xs font-semibold">+ Biblioteca</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}

      <ModalNovoExercicio visivel={modalAberto} onFechar={() => setModalAberto(false)} />
    </SafeAreaView>
  );
}
