import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';

const STORAGE_KEY = 'ia_conversas_personal';

interface Mensagem {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface Conversa {
  id: string;
  titulo: string;
  mensagens: Mensagem[];
  ultimaAtualizacao: string;
}

interface ExercicioGerado {
  nome: string;
  musculosPrincipais: string[];
  series: number;
  reps: string;
  carga: number;
  descanso: number;
  observacoes: string;
}
interface TreinoGerado {
  nome: string;
  tipo: string;
  diasSemana: string[];
  exercicios: ExercicioGerado[];
}
interface PlanoGerado {
  plano: { nome: string; descricao: string; periodizacao: string; progressao: string };
  treinos: TreinoGerado[];
}

const SUGESTOES = [
  'Crie um treino avançado dividido em A, B, C, D onde A é peito e tríceps, B é costas e bíceps, C é pernas e D é ombros e abdômen',
  'Monte um treino para iniciante 3x por semana focado em emagrecimento com halteres',
  'Crie um plano intermediário de hipertrofia 4 dias na semana, divisão push/pull/legs',
];

const TIPO_COR: Record<string, string> = {
  A: '#6C63FF', B: '#38bdf8', C: '#34d399', D: '#fbbf24',
  E: '#f87171', 'Full Body': '#a78bfa', Cardio: '#fb923c',
};

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function extractPlan(text: string): PlanoGerado | null {
  const match = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function stripJson(text: string): string {
  return text.replace(/```json\n?[\s\S]*?\n?```/g, '').trim();
}

// ── MODAL ALUNO (outside component to avoid remount) ─────────────────────────
interface ModalAlunoProps {
  visible: boolean;
  alunos: any[];
  onSelect: (id: string, nome: string) => void;
  onClose: () => void;
}

function ModalAlunoSelector({ visible, alunos, onSelect, onClose }: ModalAlunoProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Selecionar Aluno</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#9090a8" /></TouchableOpacity>
          </View>
          <ScrollView>
            {alunos.map((a) => (
              <TouchableOpacity
                key={a._id}
                onPress={() => onSelect(a._id, a.nome || a.email)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#6C63FF', fontWeight: '700' }}>{(a.nome || a.email)[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{a.nome || 'Sem nome'}</Text>
                  <Text style={{ color: '#9090a8', fontSize: 12 }}>{a.email}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function IATreinoScreen() {
  const [tela, setTela] = useState<'lista' | 'chat'>('lista');
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null);
  const [input, setInput] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [alunoNome, setAlunoNome] = useState('');
  const alunoIdRef = useRef('');
  const [modalAluno, setModalAluno] = useState(false);
  const [planoSalvo, setPlanoSalvo] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setConversas(JSON.parse(raw));
    });
  }, []);

  async function salvarConversas(lista: Conversa[]) {
    setConversas(lista);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function abrirConversa(conversa: Conversa) {
    setConversaAtual(conversa);
    setPlanoSalvo(false);
    setTela('chat');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }

  function novaConversa() {
    const nova: Conversa = { id: gerarId(), titulo: 'Nova conversa', mensagens: [], ultimaAtualizacao: new Date().toISOString() };
    setConversaAtual(nova);
    setPlanoSalvo(false);
    setTela('chat');
  }

  function voltar() {
    setTela('lista');
    setConversaAtual(null);
    setInput('');
    setAlunoId('');
    alunoIdRef.current = '';
    setAlunoNome('');
    setPlanoSalvo(false);
  }

  async function excluirConversa(id: string) {
    Alert.alert('Excluir conversa', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await salvarConversas(conversas.filter((c) => c.id !== id));
      }},
    ]);
  }

  const { data: alunos = [] } = useQuery<any[]>({
    queryKey: ['meus-alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
  });

  const chatMutation = useMutation({
    mutationFn: (msgs: Mensagem[]) =>
      api.post('/ia/chat', {
        mensagens: msgs.map((m) => ({ role: m.role, content: m.content })),
        contexto: 'personal',
      }).then((r) => r.data.resposta as string),
    onSuccess: (resposta) => {
      const nova: Mensagem = { id: gerarId(), role: 'model', content: resposta };
      const novasMensagens = [...(conversaAtual?.mensagens ?? []), nova];
      const atualizada: Conversa = { ...conversaAtual!, mensagens: novasMensagens, ultimaAtualizacao: new Date().toISOString() };
      setConversaAtual(atualizada);
      const existe = conversas.find((c) => c.id === atualizada.id);
      const novaLista = existe ? conversas.map((c) => (c.id === atualizada.id ? atualizada : c)) : [atualizada, ...conversas];
      salvarConversas(novaLista); // fire-and-forget — AsyncStorage failure não dispara onError
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Auto-save isolado: void garante que erros não propagam para o TanStack Query
      const plano = extractPlan(resposta);
      const currentAlunoId = alunoIdRef.current;
      if (plano && currentAlunoId) {
        void api.post('/ia/salvar-plano', { planoJson: plano, alunoId: currentAlunoId })
          .then((r) => {
            setPlanoSalvo(true);
            queryClient.invalidateQueries({ queryKey: ['meus-treinos'] });
            Alert.alert('Treino salvo! 🎉', r.data.message);
          })
          .catch((err: any) => {
            Alert.alert('Erro ao salvar treino', err?.response?.data?.message || err?.message || 'Falha ao salvar. Use o botão abaixo.');
          });
      }
    },
    onError: (err: any) =>
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao comunicar com a IA.'),
  });

  const salvarMutation = useMutation({
    mutationFn: (plano: PlanoGerado) =>
      api.post('/ia/salvar-plano', { planoJson: plano, alunoId }).then((r) => r.data),
    onSuccess: (data) => { setPlanoSalvo(true); queryClient.invalidateQueries({ queryKey: ['meus-treinos'] }); Alert.alert('Salvo!', data.message); },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Falha ao salvar.'),
  });

  const enviar = useCallback(async (texto?: string) => {
    const conteudo = (texto ?? input).trim();
    if (!conteudo || !conversaAtual) return;

    const novaMsg: Mensagem = { id: gerarId(), role: 'user', content: conteudo };
    const novasMensagens = [...conversaAtual.mensagens, novaMsg];
    const titulo = conversaAtual.mensagens.length === 0 ? conteudo.slice(0, 50) : conversaAtual.titulo;

    const atualizada: Conversa = { ...conversaAtual, titulo, mensagens: novasMensagens, ultimaAtualizacao: new Date().toISOString() };
    setConversaAtual(atualizada);
    setInput('');

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    chatMutation.mutate(novasMensagens);
  }, [input, conversaAtual, conversas]);

  // ── TELA: LISTA ──────────────────────────────────────────────────────────
  if (tela === 'lista') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
        <ModalAlunoSelector
          visible={modalAluno}
          alunos={alunos}
          onSelect={(id, nome) => { setAlunoId(id); alunoIdRef.current = id; setAlunoNome(nome); setModalAluno(false); }}
          onClose={() => setModalAluno(false)}
        />
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}>
          <Ionicons name="sparkles" size={22} color="#6C63FF" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 10, flex: 1 }}>IA de Treinos</Text>
          <TouchableOpacity
            onPress={novaConversa}
            style={{ backgroundColor: '#6C63FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Nova</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {conversas.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="sparkles" size={34} color="#6C63FF" />
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>IA de Treinos</Text>
              <Text style={{ color: '#9090a8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Descreva o treino que quer criar e a IA gera o plano completo.
              </Text>
              {SUGESTOES.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { novaConversa(); setTimeout(() => enviar(s), 100); }}
                  style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%' }}
                >
                  <Text style={{ color: '#c0c0d8', fontSize: 13, lineHeight: 20 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            conversas.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => abrirConversa(c)}
                style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#6C63FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{c.titulo}</Text>
                  <Text style={{ color: '#9090a8', fontSize: 12, marginTop: 2 }}>
                    {c.mensagens.length} mensagens · {new Date(c.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => excluirConversa(c.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={18} color="#5a5a70" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── TELA: CHAT ───────────────────────────────────────────────────────────
  const mensagens = conversaAtual?.mensagens ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
      <ModalAlunoSelector
        visible={modalAluno}
        alunos={alunos}
        onSelect={(id, nome) => { setAlunoId(id); alunoIdRef.current = id; setAlunoNome(nome); setModalAluno(false); }}
        onClose={() => setModalAluno(false)}
      />

      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={voltar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#9090a8" />
          </TouchableOpacity>
          <Ionicons name="sparkles" size={20} color="#6C63FF" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {conversaAtual?.titulo || 'Nova conversa'}
          </Text>
        </View>
        {/* Aluno selector in chat header */}
        <TouchableOpacity
          onPress={() => setModalAluno(true)}
          style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e1e2e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: alunoId ? '#6C63FF44' : '#2e2e40' }}
        >
          <Ionicons name="person-outline" size={14} color={alunoId ? '#6C63FF' : '#5a5a70'} />
          <Text style={{ color: alunoId ? '#c0c0d8' : '#5a5a70', fontSize: 13, flex: 1 }}>
            {alunoNome || 'Selecionar aluno para salvar treinos automaticamente'}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#5a5a70" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
          {mensagens.length === 0 && (
            <View style={{ paddingTop: 20, gap: 8 }}>
              <Text style={{ color: '#9090a8', fontSize: 13, marginBottom: 4 }}>Sugestões:</Text>
              {SUGESTOES.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => enviar(s)}
                  style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: '#c0c0d8', fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mensagens.map((msg) => {
            const plano = msg.role === 'model' ? extractPlan(msg.content) : null;
            const texto = msg.role === 'model' ? stripJson(msg.content) : msg.content;
            return (
              <View key={msg.id} style={{ marginBottom: 16, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {texto.length > 0 && (
                  <View style={{
                    maxWidth: '85%',
                    backgroundColor: msg.role === 'user' ? '#6C63FF' : '#1e1e2e',
                    borderRadius: 18,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: msg.role === 'model' ? 4 : 18,
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderWidth: msg.role === 'model' ? 1 : 0, borderColor: '#2e2e40',
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{texto}</Text>
                  </View>
                )}

                {plano && (
                  <View style={{ width: '100%', marginTop: 10, backgroundColor: '#1e1e2e', borderRadius: 18, borderWidth: 1, borderColor: planoSalvo ? 'rgba(52,211,153,0.4)' : 'rgba(108,99,255,0.3)', overflow: 'hidden' }}>
                    <View style={{ backgroundColor: planoSalvo ? 'rgba(52,211,153,0.1)' : 'rgba(108,99,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={planoSalvo ? 'checkmark-circle' : 'clipboard-outline'} size={18} color={planoSalvo ? '#34d399' : '#6C63FF'} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{plano.plano.nome}</Text>
                        <Text style={{ color: '#9090a8', fontSize: 12, marginTop: 2 }}>
                          {planoSalvo ? `Salvo para ${alunoNome} ✓` : `${plano.treinos.length} treinos gerados`}
                        </Text>
                      </View>
                    </View>
                    {plano.treinos.map((t, i) => {
                      const cor = TIPO_COR[t.tipo] || '#6C63FF';
                      return (
                        <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2e2e40', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${cor}22`, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: cor, fontWeight: '700', fontSize: 14 }}>{t.tipo}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#e0e0f0', fontWeight: '600', fontSize: 13 }}>{t.nome}</Text>
                            <Text style={{ color: '#9090a8', fontSize: 12 }}>{t.exercicios.length} exercícios · {t.diasSemana.join(', ')}</Text>
                          </View>
                        </View>
                      );
                    })}
                    {!planoSalvo && (
                      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: '#2e2e40', gap: 10 }}>
                        {!alunoId && (
                          <TouchableOpacity onPress={() => setModalAluno(true)}
                            style={{ backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#5a5a70', fontSize: 14 }}>Selecionar aluno para salvar...</Text>
                            <Ionicons name="chevron-down" size={16} color="#9090a8" />
                          </TouchableOpacity>
                        )}
                        {alunoId && (
                          <TouchableOpacity onPress={() => salvarMutation.mutate(plano)} disabled={salvarMutation.isPending}
                            style={{ backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                            {salvarMutation.isPending ? <ActivityIndicator color="white" /> : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="save-outline" size={18} color="white" />
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Salvar para {alunoNome}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {chatMutation.isPending && (
            <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ backgroundColor: '#1e1e2e', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: '#2e2e40', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text style={{ color: '#9090a8', fontSize: 14 }}>Gerando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2e2e40', flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 20, borderWidth: 1, borderColor: '#2e2e40', paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120 }}>
            <TextInput value={input} onChangeText={setInput} placeholder="Descreva o treino que precisa..." placeholderTextColor="#5a5a70" multiline
              style={{ color: '#fff', fontSize: 14, lineHeight: 20 }} onSubmitEditing={() => enviar()} blurOnSubmit={false} />
          </View>
          <TouchableOpacity onPress={() => enviar()} disabled={!input.trim() || chatMutation.isPending}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: input.trim() && !chatMutation.isPending ? '#6C63FF' : '#2e2e40', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={18} color={input.trim() && !chatMutation.isPending ? '#fff' : '#5a5a70'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
