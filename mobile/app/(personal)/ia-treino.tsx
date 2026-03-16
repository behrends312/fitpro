import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../src/services/api';

const OBJETIVOS = ['Perder gordura', 'Ganhar massa', 'Condicionamento', 'Força', 'Definição', 'Reabilitação'];
const NIVEIS = ['iniciante', 'intermediário', 'avançado'];
const EQUIPAMENTOS = ['barra', 'halteres', 'máquina', 'cabo', 'peso corporal', 'elástico', 'kettlebell'];
const DIAS_OPTIONS = [2, 3, 4, 5, 6];

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

export default function IATreinoScreen() {
  const [step, setStep] = useState<'form' | 'resultado'>('form');
  const [alunoId, setAlunoId] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [diasTreino, setDiasTreino] = useState(4);
  const [nivel, setNivel] = useState('intermediário');
  const [equipamentos, setEquipamentos] = useState<string[]>(['barra', 'halteres', 'máquina', 'cabo']);
  const [plano, setPlano] = useState<PlanoGerado | null>(null);
  const [modalAluno, setModalAluno] = useState(false);
  const [alunoNome, setAlunoNome] = useState('');

  const { data: alunos = [] } = useQuery<any[]>({
    queryKey: ['meus-alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
  });

  const gerarMutation = useMutation({
    mutationFn: (salvar: boolean) =>
      api.post('/ia/gerar-treino', {
        alunoId: alunoId || undefined,
        altura: parseFloat(altura),
        peso: parseFloat(peso),
        objetivo,
        diasTreino,
        nivel,
        equipamentos,
        salvar,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setPlano(data);
      setStep('resultado');
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Falha ao gerar treino. Verifique a chave da IA.'),
  });

  const salvarMutation = useMutation({
    mutationFn: () =>
      api.post('/ia/gerar-treino', {
        alunoId: alunoId || undefined,
        altura: parseFloat(altura),
        peso: parseFloat(peso),
        objetivo,
        diasTreino,
        nivel,
        equipamentos,
        salvar: true,
      }).then((r) => r.data),
    onSuccess: () => Alert.alert('Salvo!', 'O plano de treino foi salvo com sucesso para o aluno.', [{ text: 'OK', onPress: () => { setStep('form'); setPlano(null); } }]),
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Falha ao salvar.'),
  });

  function toggleEquipamento(eq: string) {
    setEquipamentos((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  function validar() {
    if (!altura || !peso || !objetivo) {
      Alert.alert('Campos obrigatórios', 'Preencha altura, peso e objetivo.');
      return false;
    }
    return true;
  }

  if (step === 'resultado' && plano) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View className="px-5 pt-4 pb-2 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setStep('form')}>
              <Ionicons name="arrow-back" size={24} color="#9090a8" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-textPrimary text-xl font-bold">{plano.plano.nome}</Text>
              <Text className="text-textSecondary text-xs">{plano.treinos.length} treinos gerados</Text>
            </View>
          </View>

          {/* Info do plano */}
          <View className="mx-5 mb-4 bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <Text className="text-textPrimary text-sm font-semibold mb-1">Sobre o plano</Text>
            <Text className="text-textSecondary text-sm mb-3">{plano.plano.descricao}</Text>
            <View className="border-t border-primary/20 pt-3 mb-2">
              <Text className="text-primary text-xs font-semibold mb-1">PERIODIZAÇÃO</Text>
              <Text className="text-textSecondary text-xs">{plano.plano.periodizacao}</Text>
            </View>
            <View className="border-t border-primary/20 pt-3">
              <Text className="text-primary text-xs font-semibold mb-1">PROGRESSÃO</Text>
              <Text className="text-textSecondary text-xs">{plano.plano.progressao}</Text>
            </View>
          </View>

          {/* Treinos */}
          {plano.treinos.map((treino, tIdx) => (
            <View key={tIdx} className="mx-5 mb-4 bg-surface border border-border rounded-2xl overflow-hidden">
              <View className="bg-primary/5 px-4 py-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-textPrimary font-bold text-base">{treino.nome}</Text>
                  <Text className="text-textMuted text-xs mt-0.5">{treino.diasSemana.join(' · ')}</Text>
                </View>
                <View className="bg-primary/20 px-3 py-1 rounded-lg">
                  <Text className="text-primary text-xs font-bold">Treino {treino.tipo}</Text>
                </View>
              </View>

              {treino.exercicios.map((ex, eIdx) => (
                <View key={eIdx} className={`px-4 py-3 ${eIdx < treino.exercicios.length - 1 ? 'border-b border-border' : ''}`}>
                  <Text className="text-textPrimary font-semibold text-sm">{ex.nome}</Text>
                  {ex.musculosPrincipais?.length > 0 && (
                    <Text className="text-textMuted text-xs mb-2">{ex.musculosPrincipais.join(' · ')}</Text>
                  )}
                  <View className="flex-row gap-3">
                    <View className="bg-background rounded-lg px-3 py-1.5">
                      <Text className="text-textSecondary text-xs">{ex.series} séries</Text>
                    </View>
                    <View className="bg-background rounded-lg px-3 py-1.5">
                      <Text className="text-textSecondary text-xs">{ex.reps} reps</Text>
                    </View>
                    <View className="bg-background rounded-lg px-3 py-1.5">
                      <Text className="text-textSecondary text-xs">{ex.carga}kg</Text>
                    </View>
                    <View className="bg-background rounded-lg px-3 py-1.5">
                      <Text className="text-textSecondary text-xs">{ex.descanso}s</Text>
                    </View>
                  </View>
                  {ex.observacoes ? (
                    <Text className="text-textMuted text-xs mt-2 italic">{ex.observacoes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}

          {/* Botões */}
          <View className="px-5 gap-3">
            {alunoId ? (
              <TouchableOpacity
                onPress={() => salvarMutation.mutate()}
                disabled={salvarMutation.isPending}
                className="bg-primary rounded-xl py-4 items-center"
              >
                {salvarMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="save-outline" size={20} color="white" />
                    <Text className="text-white font-bold text-base">Salvar para o aluno</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View className="bg-surface border border-border rounded-xl py-3 px-4">
                <Text className="text-textSecondary text-sm text-center">Selecione um aluno para salvar o treino</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => { setStep('form'); setPlano(null); }}
              className="border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-textSecondary font-semibold">Gerar novo plano</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Modal seleção de aluno */}
      <Modal visible={modalAluno} transparent animationType="slide" onRequestClose={() => setModalAluno(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-surface rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary text-xl font-bold">Selecionar Aluno</Text>
              <TouchableOpacity onPress={() => setModalAluno(false)}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {alunos.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  onPress={() => {
                    setAlunoId(a._id);
                    setAlunoNome(a.nome || a.email);
                    if (a.peso) setPeso(String(a.peso));
                    if (a.altura) setAltura(String(a.altura));
                    if (a.objetivo) setObjetivo(a.objetivo);
                    setModalAluno(false);
                  }}
                  className="flex-row items-center py-3 border-b border-border"
                >
                  <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-bold">{(a.nome || a.email)[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text className="text-textPrimary font-semibold">{a.nome || 'Sem nome'}</Text>
                    <Text className="text-textMuted text-xs">{a.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="sparkles" size={24} color="#6C63FF" />
            <Text className="text-textPrimary text-2xl font-bold">IA de Treinos</Text>
          </View>
          <Text className="text-textSecondary text-sm">Gere um plano completo com progressão e periodização</Text>
        </View>

        <View className="px-5">
          {/* Aluno */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Aluno (opcional)</Text>
          <TouchableOpacity
            onPress={() => setModalAluno(true)}
            className="bg-surface border border-border rounded-xl px-4 py-3.5 flex-row items-center justify-between mb-5"
          >
            <Text className={alunoNome ? 'text-textPrimary text-base' : 'text-[#5a5a70] text-base'}>
              {alunoNome || 'Selecionar aluno...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9090a8" />
          </TouchableOpacity>

          {/* Altura e Peso */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Altura (cm)</Text>
              <View className="bg-surface border border-border rounded-xl px-4">
                <TextInput className="text-textPrimary py-3.5 text-base" value={altura} onChangeText={setAltura} placeholder="175" placeholderTextColor="#5a5a70" keyboardType="numeric" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Peso (kg)</Text>
              <View className="bg-surface border border-border rounded-xl px-4">
                <TextInput className="text-textPrimary py-3.5 text-base" value={peso} onChangeText={setPeso} placeholder="80" placeholderTextColor="#5a5a70" keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* Objetivo */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Objetivo</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {OBJETIVOS.map((obj) => (
              <TouchableOpacity
                key={obj}
                onPress={() => setObjetivo(obj)}
                className={`px-4 py-2 rounded-xl border ${objetivo === obj ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`text-sm font-semibold ${objetivo === obj ? 'text-white' : 'text-textSecondary'}`}>{obj}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dias de treino */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Dias de treino por semana</Text>
          <View className="flex-row gap-2 mb-5">
            {DIAS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDiasTreino(d)}
                className={`w-12 h-12 rounded-xl items-center justify-center border ${diasTreino === d ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`font-bold text-base ${diasTreino === d ? 'text-white' : 'text-textSecondary'}`}>{d}x</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nível */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Nível</Text>
          <View className="flex-row gap-2 mb-5">
            {NIVEIS.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setNivel(n)}
                className={`flex-1 py-2.5 rounded-xl items-center border ${nivel === n ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`text-sm font-semibold capitalize ${nivel === n ? 'text-white' : 'text-textSecondary'}`}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Equipamentos */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Equipamentos disponíveis</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {EQUIPAMENTOS.map((eq) => (
              <TouchableOpacity
                key={eq}
                onPress={() => toggleEquipamento(eq)}
                className={`px-4 py-2 rounded-xl border ${equipamentos.includes(eq) ? 'bg-primary/10 border-primary/50' : 'bg-surface border-border'}`}
              >
                <Text className={`text-sm ${equipamentos.includes(eq) ? 'text-primary font-semibold' : 'text-textSecondary'}`}>{eq}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão gerar */}
          <TouchableOpacity
            onPress={() => validar() && gerarMutation.mutate(false)}
            disabled={gerarMutation.isPending}
            className="bg-primary rounded-xl py-4 items-center"
          >
            {gerarMutation.isPending ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color="white" />
                <Text className="text-white font-bold text-base">Gerando plano com IA...</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white font-bold text-base">Gerar plano de treino</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
