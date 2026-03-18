import { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../src/services/api';

interface Mensagem {
  id: string;
  role: 'user' | 'model';
  content: string;
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
  'Monte um treino para iniciante 3x por semana focado em emagrecimento, usando apenas peso corporal e halteres',
  'Crie um plano intermediário de hipertrofia para 4 dias na semana com divisão push/pull/legs',
];

function extractPlan(text: string): PlanoGerado | null {
  const match = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function stripJson(text: string): string {
  return text.replace(/```json\n?[\s\S]*?\n?```/g, '').trim();
}

const TIPO_COR: Record<string, string> = {
  A: '#6C63FF', B: '#38bdf8', C: '#34d399', D: '#fbbf24',
  E: '#f87171', 'Full Body': '#a78bfa', Cardio: '#fb923c',
};

export default function IATreinoScreen() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [planoPendente, setPlanoPendente] = useState<PlanoGerado | null>(null);
  const [alunoId, setAlunoId] = useState('');
  const [alunoNome, setAlunoNome] = useState('');
  const [modalAluno, setModalAluno] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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
      const nova: Mensagem = {
        id: Date.now().toString(),
        role: 'model',
        content: resposta,
      };
      setMensagens((prev) => [...prev, nova]);

      const plano = extractPlan(resposta);
      if (plano) setPlanoPendente(plano);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (err: any) =>
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao comunicar com a IA.'),
  });

  const salvarMutation = useMutation({
    mutationFn: () =>
      api.post('/ia/salvar-plano', { planoJson: planoPendente, alunoId }).then((r) => r.data),
    onSuccess: (data) => {
      Alert.alert('Salvo!', data.message);
      setPlanoPendente(null);
      setAlunoId('');
      setAlunoNome('');
    },
    onError: (err: any) =>
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao salvar.'),
  });

  const enviar = useCallback((texto?: string) => {
    const conteudo = (texto ?? input).trim();
    if (!conteudo) return;

    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: conteudo };
    const novaLista = [...mensagens, nova];
    setMensagens(novaLista);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    chatMutation.mutate(novaLista);
  }, [input, mensagens]);

  const limpar = () => {
    setMensagens([]);
    setPlanoPendente(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
      {/* Modal aluno */}
      <Modal visible={modalAluno} transparent animationType="slide" onRequestClose={() => setModalAluno(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Selecionar Aluno</Text>
              <TouchableOpacity onPress={() => setModalAluno(false)}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {alunos.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  onPress={() => { setAlunoId(a._id); setAlunoNome(a.nome || a.email); setModalAluno(false); }}
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

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}>
        <Ionicons name="sparkles" size={22} color="#6C63FF" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>IA de Treinos</Text>
          <Text style={{ color: '#9090a8', fontSize: 12 }}>Descreva o treino que deseja criar</Text>
        </View>
        {mensagens.length > 0 && (
          <TouchableOpacity onPress={limpar} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={20} color="#9090a8" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Chat area */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {mensagens.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="sparkles" size={34} color="#6C63FF" />
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Olá, personal!</Text>
              <Text style={{ color: '#9090a8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Descreva o treino que você quer criar. Posso montar planos completos com divisão, exercícios e cargas.
              </Text>
              {SUGESTOES.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => enviar(s)}
                  style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%' }}
                >
                  <Text style={{ color: '#c0c0d8', fontSize: 13, lineHeight: 20 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            mensagens.map((msg) => {
              const plano = msg.role === 'model' ? extractPlan(msg.content) : null;
              const texto = msg.role === 'model' ? stripJson(msg.content) : msg.content;
              return (
                <View key={msg.id} style={{ marginBottom: 16, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {/* Bubble de texto */}
                  {texto.length > 0 && (
                    <View style={{
                      maxWidth: '85%',
                      backgroundColor: msg.role === 'user' ? '#6C63FF' : '#1e1e2e',
                      borderRadius: 18,
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                      borderBottomLeftRadius: msg.role === 'model' ? 4 : 18,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: msg.role === 'model' ? 1 : 0,
                      borderColor: '#2e2e40',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{texto}</Text>
                    </View>
                  )}

                  {/* Preview do plano gerado */}
                  {plano && (
                    <View style={{ width: '100%', marginTop: 10, backgroundColor: '#1e1e2e', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', overflow: 'hidden' }}>
                      <View style={{ backgroundColor: 'rgba(108,99,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="clipboard-outline" size={18} color="#6C63FF" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{plano.plano.nome}</Text>
                          <Text style={{ color: '#9090a8', fontSize: 12, marginTop: 2 }}>{plano.treinos.length} treinos gerados</Text>
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

                      {/* Salvar */}
                      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: '#2e2e40', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => setModalAluno(true)}
                          style={{ backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Text style={{ color: alunoNome ? '#fff' : '#5a5a70', fontSize: 14 }}>
                            {alunoNome || 'Selecionar aluno para salvar...'}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#9090a8" />
                        </TouchableOpacity>
                        {alunoId ? (
                          <TouchableOpacity
                            onPress={() => { setPlanoPendente(plano); salvarMutation.mutate(); }}
                            disabled={salvarMutation.isPending}
                            style={{ backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                          >
                            {salvarMutation.isPending ? (
                              <ActivityIndicator color="white" />
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="save-outline" size={18} color="white" />
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Salvar para {alunoNome}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {chatMutation.isPending && (
            <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ backgroundColor: '#1e1e2e', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: '#2e2e40', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text style={{ color: '#9090a8', fontSize: 14 }}>Gerando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2e2e40', flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 20, borderWidth: 1, borderColor: '#2e2e40', paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Descreva o treino que precisa..."
              placeholderTextColor="#5a5a70"
              multiline
              style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}
              onSubmitEditing={() => enviar()}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => enviar()}
            disabled={!input.trim() || chatMutation.isPending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() && !chatMutation.isPending ? '#6C63FF' : '#2e2e40',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() && !chatMutation.isPending ? '#fff' : '#5a5a70'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
