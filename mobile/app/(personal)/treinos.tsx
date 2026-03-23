import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';
import { GRUPOS_MUSCULARES } from '../../src/constants/exerciciosPredefinidos';

interface ExercicioDisponivel {
  _id: string;
  nome: string;
  musculosPrincipais: string[];
  equipamento: string;
}
interface Aluno { _id: string; nome: string; email: string }
type GrupoTipo = 'none' | 'bi-set' | 'tri-set' | 'super-set' | 'drop-set';
interface TreinoExercicio {
  exercicio: ExercicioDisponivel;
  series: number;
  reps: string;
  carga: number;
  descanso: number;
  grupoTipo: GrupoTipo;
  grupoId: string | null;
  grupoOrdem: number;
}
interface Treino {
  _id: string;
  nome: string;
  tipo: string;
  aluno: { _id: string; nome: string; email: string };
  exercicios: Array<{ _id: string; exercicio: { nome: string }; series: number; reps: string; carga: number }>;
  diasSemana: string[];
  ativo: boolean;
}

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DIAS_LABEL: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
const TIPOS = ['A', 'B', 'C', 'D', 'Full Body', 'Cardio'];

function ModalTreino({
  visivel,
  onFechar,
  treinoEdit,
}: {
  visivel: boolean;
  onFechar: () => void;
  treinoEdit?: Treino | null;
}) {
  const modoEdit = !!treinoEdit;
  const [step, setStep] = useState<'info' | 'exercicios'>('info');
  const [nome, setNome] = useState(treinoEdit?.nome ?? '');
  const [tipo, setTipo] = useState(treinoEdit?.tipo ?? 'A');
  const [descricao, setDescricao] = useState('');
  const [alunoSel, setAlunoSel] = useState<Aluno | null>(
    treinoEdit?.aluno ? { _id: treinoEdit.aluno._id, nome: treinoEdit.aluno.nome, email: treinoEdit.aluno.email } : null
  );
  const [diasSel, setDiasSel] = useState<string[]>(treinoEdit?.diasSemana ?? []);
  const [exerciciosSel, setExerciciosSel] = useState<TreinoExercicio[]>(
    treinoEdit?.exercicios.map((e) => ({
      exercicio: e.exercicio as any,
      series: e.series,
      reps: e.reps,
      carga: e.carga,
      descanso: 60,
    })) ?? []
  );
  const [abaEx, setAbaEx] = useState<'biblioteca' | 'predefinidos'>('biblioteca');
  const [grupoSel, setGrupoSel] = useState(GRUPOS_MUSCULARES[0].nome);
  const [importando, setImportando] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Quando modal abre em modo edit, sincroniza campos
  const resetParaEdit = () => {
    if (treinoEdit) {
      setNome(treinoEdit.nome);
      setTipo(treinoEdit.tipo);
      setDiasSel(treinoEdit.diasSemana);
      setAlunoSel({ _id: treinoEdit.aluno._id, nome: treinoEdit.aluno.nome, email: treinoEdit.aluno.email });
      setExerciciosSel(treinoEdit.exercicios.map((e) => ({
        exercicio: e.exercicio as any,
        series: e.series,
        reps: e.reps,
        carga: e.carga,
        descanso: 60,
      })));
    }
    setStep('info');
    setAbaEx('biblioteca');
  };

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ['meus-alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
    enabled: visivel,
  });

  const { data: exercicios = [] } = useQuery<ExercicioDisponivel[]>({
    queryKey: ['exercicios'],
    queryFn: () => api.get('/exercicios').then((r) => r.data),
    enabled: visivel && step === 'exercicios',
  });

  // Agrupa exercícios da biblioteca por grupo muscular
  const exerciciosPorGrupo = useMemo(() => {
    const mapa = new Map<string, ExercicioDisponivel[]>();
    exercicios.forEach((ex) => {
      const grupo = ex.musculosPrincipais?.[0] || 'Sem grupo';
      if (!mapa.has(grupo)) mapa.set(grupo, []);
      mapa.get(grupo)!.push(ex);
    });
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercicios]);

  const criarMutation = useMutation({
    mutationFn: () => api.post('/treinos', {
      nome, descricao, tipo,
      alunoId: alunoSel?._id,
      diasSemana: diasSel,
      exercicios: exerciciosSel.map((e, i) => ({
        exercicio: e.exercicio._id,
        ordem: i,
        series: e.series,
        reps: e.reps,
        carga: e.carga,
        descanso: e.descanso,
        grupoTipo: e.grupoTipo || 'none',
        grupoId: e.grupoId || null,
        grupoOrdem: e.grupoOrdem || 0,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-treinos'] });
      fecharEReset();
      Alert.alert('Treino criado!', 'O aluno já pode ver o treino no app.');
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Erro ao criar treino.'),
  });

  const editarMutation = useMutation({
    mutationFn: () => api.patch(`/treinos/${treinoEdit!._id}`, {
      nome, tipo, diasSemana: diasSel,
      exercicios: exerciciosSel.map((e, i) => ({
        exercicio: e.exercicio._id,
        ordem: i,
        series: e.series,
        reps: e.reps,
        carga: e.carga,
        descanso: e.descanso,
        grupoTipo: e.grupoTipo || 'none',
        grupoId: e.grupoId || null,
        grupoOrdem: e.grupoOrdem || 0,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-treinos'] });
      fecharEReset();
      Alert.alert('Treino atualizado!');
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Erro ao atualizar treino.'),
  });

  function fecharEReset() {
    onFechar();
    setStep('info');
    setNome(''); setTipo('A'); setDescricao('');
    setAlunoSel(null); setDiasSel([]); setExerciciosSel([]);
    setAbaEx('biblioteca');
  }

  function toggleExercicio(ex: ExercicioDisponivel) {
    const idx = exerciciosSel.findIndex((e) => e.exercicio._id === ex._id);
    if (idx >= 0) {
      setExerciciosSel((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setExerciciosSel((prev) => [
        ...prev,
        { exercicio: ex, series: 3, reps: '10', carga: 0, descanso: 60, grupoTipo: 'none', grupoId: null, grupoOrdem: 0 },
      ]);
    }
  }

  function definirGrupo(exId: string, tipo: GrupoTipo) {
    setExerciciosSel((prev) => {
      const idx = prev.findIndex((e) => e.exercicio._id === exId);
      if (idx < 0) return prev;
      const lista = [...prev];
      if (tipo === 'none') {
        // Remove do grupo
        lista[idx] = { ...lista[idx], grupoTipo: 'none', grupoId: null, grupoOrdem: 0 };
      } else {
        // Agrupa este com o próximo exercício
        const grupoId = `grupo_${Date.now()}_${idx}`;
        lista[idx] = { ...lista[idx], grupoTipo: tipo, grupoId, grupoOrdem: 0 };
        if (idx + 1 < lista.length) {
          lista[idx + 1] = { ...lista[idx + 1], grupoTipo: tipo, grupoId, grupoOrdem: 1 };
          if (tipo === 'tri-set' && idx + 2 < lista.length) {
            lista[idx + 2] = { ...lista[idx + 2], grupoTipo: tipo, grupoId, grupoOrdem: 2 };
          }
        }
      }
      return lista;
    });
  }

  function atualizarConfig(exId: string, campo: string, valor: any) {
    setExerciciosSel((prev) =>
      prev.map((e) => e.exercicio._id === exId ? { ...e, [campo]: valor } : e)
    );
  }

  async function importarEAdicionar(predefinido: { nome: string; musculosPrincipais: string[]; equipamento: string; dificuldade: string }) {
    if (importando) return;
    setImportando(predefinido.nome);
    try {
      const { data: ex } = await api.post('/exercicios/importar', predefinido);
      queryClient.invalidateQueries({ queryKey: ['exercicios'] });
      const jaEsta = exerciciosSel.some((e) => e.exercicio._id === ex._id);
      if (!jaEsta) {
        setExerciciosSel((prev) => [...prev, { exercicio: ex, series: 3, reps: '10', carga: 0, descanso: 60 }]);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível importar o exercício.');
    } finally {
      setImportando(null);
    }
  }

  const isPending = criarMutation.isPending || editarMutation.isPending;
  const grupoAtual = GRUPOS_MUSCULARES.find((g) => g.nome === grupoSel);

  return (
    <Modal visible={visivel} transparent animationType="slide" onShow={modoEdit ? resetParaEdit : undefined}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View style={{ flex: 1 }} />
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '95%' }}>
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              {step === 'exercicios' && (
                <TouchableOpacity onPress={() => setStep('info')}>
                  <Ionicons name="arrow-back" size={22} color="#9090a8" />
                </TouchableOpacity>
              )}
              <Text className="text-textPrimary text-xl font-bold">
                {modoEdit ? 'Editar Treino' : (step === 'info' ? 'Novo Treino' : 'Exercícios')}
              </Text>
            </View>
            <TouchableOpacity onPress={fecharEReset}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6" keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>
            <View className="py-4">
              {step === 'info' ? (
                <>
                  <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Nome do treino *</Text>
                  <View className="bg-background border border-border rounded-xl px-4 mb-4">
                    <TextInput
                      className="text-textPrimary py-3.5 text-base"
                      value={nome}
                      onChangeText={setNome}
                      placeholder="Ex: Treino de Peito e Tríceps"
                      placeholderTextColor="#5a5a70"
                    />
                  </View>

                  <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Tipo / Divisão</Text>
                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    {TIPOS.map((t) => (
                      <TouchableOpacity key={t} onPress={() => setTipo(t)} className={`px-4 py-2 rounded-lg border ${tipo === t ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                        <Text className={`font-semibold ${tipo === t ? 'text-white' : 'text-textSecondary'}`}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {!modoEdit && (
                    <>
                      <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Aluno *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {alunos.map((a) => (
                          <TouchableOpacity key={a._id} onPress={() => setAlunoSel(a)} className={`flex-row items-center px-4 py-2.5 rounded-xl border mr-2 ${alunoSel?._id === a._id ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                            <Text className={`font-bold mr-2 ${alunoSel?._id === a._id ? 'text-white' : 'text-textSecondary'}`}>{(a.nome || a.email)[0].toUpperCase()}</Text>
                            <Text className={alunoSel?._id === a._id ? 'text-white' : 'text-textSecondary'}>{a.nome || a.email.split('@')[0]}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {modoEdit && (
                    <View className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 mb-4">
                      <Ionicons name="person-outline" size={16} color="#9090a8" />
                      <Text className="text-textSecondary text-base">{treinoEdit?.aluno.nome || treinoEdit?.aluno.email}</Text>
                    </View>
                  )}

                  <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Dias da semana</Text>
                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    {DIAS.map((d) => (
                      <TouchableOpacity key={d} onPress={() => setDiasSel((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])} className={`w-11 h-11 rounded-xl items-center justify-center border ${diasSel.includes(d) ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                        <Text className={`text-xs font-bold ${diasSel.includes(d) ? 'text-white' : 'text-textSecondary'}`}>{DIAS_LABEL[d]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => setStep('exercicios')}
                    disabled={!nome || (!modoEdit && !alunoSel)}
                    className="bg-primary rounded-xl py-4 items-center"
                  >
                    <Text className="text-white font-bold text-base">Próximo: Exercícios ({exerciciosSel.length}) →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Exercícios selecionados */}
                  {exerciciosSel.length > 0 && (
                    <View className="mb-5">
                      <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Selecionados ({exerciciosSel.length})</Text>
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={exerciciosSel.length > 3}
                        style={{ maxHeight: exerciciosSel.length > 3 ? 420 : undefined }}
                        keyboardShouldPersistTaps="handled"
                      >
                      {exerciciosSel.map((e, eIdx) => {
                        const GRUPO_COR: Record<GrupoTipo, string> = {
                          'none': 'transparent',
                          'bi-set': '#6C63FF',
                          'tri-set': '#f59e0b',
                          'super-set': '#10b981',
                          'drop-set': '#ef4444',
                        };
                        const temGrupo = e.grupoTipo !== 'none';
                        return (
                          <View
                            key={e.exercicio._id}
                            style={temGrupo ? { borderLeftWidth: 3, borderLeftColor: GRUPO_COR[e.grupoTipo], borderRadius: 12 } : {}}
                            className={`bg-primary/5 border border-primary/20 rounded-xl p-3 mb-2`}
                          >
                            <View className="flex-row justify-between items-center mb-2">
                              <View className="flex-1 mr-2">
                                {temGrupo && (
                                  <View style={{ backgroundColor: GRUPO_COR[e.grupoTipo] + '25' }} className="self-start px-2 py-0.5 rounded-md mb-1">
                                    <Text style={{ color: GRUPO_COR[e.grupoTipo] }} className="text-xs font-bold uppercase">
                                      {e.grupoTipo} {e.grupoOrdem + 1}
                                    </Text>
                                  </View>
                                )}
                                <Text className="text-textPrimary font-semibold">{e.exercicio.nome}</Text>
                              </View>
                              <TouchableOpacity onPress={() => toggleExercicio(e.exercicio)}>
                                <Ionicons name="close-circle" size={20} color="#f87171" />
                              </TouchableOpacity>
                            </View>
                            <View className="flex-row gap-2 mb-2">
                              {[
                                { label: 'Séries', campo: 'series', valor: String(e.series), kb: 'numeric' as const },
                                { label: 'Reps', campo: 'reps', valor: e.reps, kb: 'default' as const },
                                { label: 'Kg', campo: 'carga', valor: String(e.carga), kb: 'numeric' as const },
                                { label: 'Desc(s)', campo: 'descanso', valor: String(e.descanso), kb: 'numeric' as const },
                              ].map((c) => (
                                <View key={c.campo} className="flex-1">
                                  <Text className="text-textMuted text-xs mb-1">{c.label}</Text>
                                  <TextInput
                                    className="bg-background border border-border rounded-lg px-2 py-1.5 text-textPrimary text-sm text-center"
                                    value={c.valor}
                                    onChangeText={(v) => atualizarConfig(e.exercicio._id, c.campo, c.kb === 'numeric' ? Number(v) || 0 : v)}
                                    keyboardType={c.kb}
                                  />
                                </View>
                              ))}
                            </View>
                            {/* Agrupar com próximo */}
                            {eIdx < exerciciosSel.length - 1 && (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row gap-1.5">
                                  {(['none', 'bi-set', 'tri-set', 'super-set', 'drop-set'] as GrupoTipo[]).map((tipo) => (
                                    <TouchableOpacity
                                      key={tipo}
                                      onPress={() => definirGrupo(e.exercicio._id, tipo)}
                                      style={e.grupoTipo === tipo && tipo !== 'none'
                                        ? { backgroundColor: GRUPO_COR[tipo] + '30', borderColor: GRUPO_COR[tipo], borderWidth: 1 }
                                        : {}}
                                      className={`px-2 py-1 rounded-lg border border-border ${e.grupoTipo === tipo && tipo !== 'none' ? '' : 'bg-background'}`}
                                    >
                                      <Text style={e.grupoTipo === tipo && tipo !== 'none' ? { color: GRUPO_COR[tipo] } : {}} className={`text-xs font-semibold ${e.grupoTipo === tipo && tipo !== 'none' ? '' : 'text-textMuted'}`}>
                                        {tipo === 'none' ? 'Sem grupo' : tipo}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </ScrollView>
                            )}
                          </View>
                        );
                      })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Abas: Biblioteca | Predefinidos */}
                  <View className="flex-row bg-background border border-border rounded-xl p-1 mb-3">
                    {(['biblioteca', 'predefinidos'] as const).map((a) => (
                      <TouchableOpacity key={a} onPress={() => setAbaEx(a)} className={`flex-1 py-2 rounded-lg items-center ${abaEx === a ? 'bg-primary' : ''}`}>
                        <Text className={`text-xs font-semibold capitalize ${abaEx === a ? 'text-white' : 'text-textSecondary'}`}>
                          {a === 'biblioteca' ? 'Minha Biblioteca' : 'Predefinidos'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {abaEx === 'biblioteca' ? (
                    <>
                      {exerciciosPorGrupo.length === 0 && (
                        <View className="items-center py-8">
                          <Text className="text-textSecondary text-sm text-center">Biblioteca vazia.{'\n'}Use a aba Predefinidos para adicionar exercícios!</Text>
                        </View>
                      )}
                      {exerciciosPorGrupo.map(([grupo, exs]) => (
                        <View key={grupo}>
                          <View className="flex-row items-center gap-2 mb-2 mt-3">
                            <Text className="text-textMuted text-xs font-bold uppercase tracking-widest">{grupo}</Text>
                            <View className="flex-1 h-px bg-border" />
                            <Text className="text-textMuted text-xs">{exs.length}</Text>
                          </View>
                          {exs.map((ex) => {
                            const selecionado = exerciciosSel.some((e) => e.exercicio._id === ex._id);
                            return (
                              <TouchableOpacity key={ex._id} onPress={() => toggleExercicio(ex)} className={`flex-row items-center p-3 rounded-xl border mb-2 ${selecionado ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                                <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${selecionado ? 'bg-primary' : 'bg-surface'}`}>
                                  <Ionicons name={selecionado ? 'checkmark' : 'add'} size={16} color={selecionado ? 'white' : '#9090a8'} />
                                </View>
                                <View className="flex-1">
                                  <Text className={`font-semibold ${selecionado ? 'text-textPrimary' : 'text-textSecondary'}`}>{ex.nome}</Text>
                                  {ex.musculosPrincipais?.length > 0 && <Text className="text-textMuted text-xs">{ex.musculosPrincipais.join(' · ')}</Text>}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </>
                  ) : (
                    <>
                      {/* Filtro grupo muscular */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
                        {GRUPOS_MUSCULARES.map((g) => (
                          <TouchableOpacity key={g.nome} onPress={() => setGrupoSel(g.nome)} className={`px-3 py-1.5 rounded-lg border ${grupoSel === g.nome ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                            <Text className={`text-xs font-semibold ${grupoSel === g.nome ? 'text-white' : 'text-textSecondary'}`}>{g.nome}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {grupoAtual?.exercicios.map((ex) => {
                        const jaImportado = exercicios.some((e) => e.nome.toLowerCase() === ex.nome.toLowerCase());
                        const selecionado = exerciciosSel.some((e) => e.exercicio.nome.toLowerCase() === ex.nome.toLowerCase());
                        return (
                          <View key={ex.nome} className={`flex-row items-center p-3 rounded-xl border mb-2 ${selecionado ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                            <View className="flex-1">
                              <Text className={`font-semibold text-sm ${selecionado ? 'text-textPrimary' : 'text-textSecondary'}`}>{ex.nome}</Text>
                              <Text className="text-textMuted text-xs">{ex.musculosPrincipais.join(' · ')} · {ex.equipamento.replace('_', ' ')}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => importarEAdicionar(ex)}
                              disabled={importando === ex.nome || selecionado}
                              className={`px-3 py-1.5 rounded-lg ml-2 border ${selecionado ? 'border-success/30 bg-success/10' : 'border-primary/30 bg-primary/10'}`}
                            >
                              {importando === ex.nome ? (
                                <ActivityIndicator color="#6C63FF" size="small" />
                              ) : (
                                <Ionicons name={selecionado ? 'checkmark' : 'add'} size={16} color={selecionado ? '#4ade80' : '#6C63FF'} />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </>
                  )}

                  <TouchableOpacity
                    onPress={() => modoEdit ? editarMutation.mutate() : criarMutation.mutate()}
                    disabled={isPending || exerciciosSel.length === 0}
                    className="bg-primary rounded-xl py-4 items-center mt-4 mb-2"
                  >
                    {isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        {modoEdit ? `Salvar Alterações (${exerciciosSel.length} exercícios)` : `Criar Treino (${exerciciosSel.length} exercícios)`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TreinosScreen() {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [treinoEdit, setTreinoEdit] = useState<Treino | null>(null);
  const queryClient = useQueryClient();

  const { data: treinos = [], isLoading } = useQuery<Treino[]>({
    queryKey: ['meus-treinos'],
    queryFn: () => api.get('/treinos').then((r) => r.data),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/treinos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meus-treinos'] }),
  });

  function abrirEdit(treino: Treino) {
    setTreinoEdit(treino);
    setModalAberto(true);
  }

  function abrirNovo() {
    setTreinoEdit(null);
    setModalAberto(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-textPrimary text-2xl font-bold">Treinos</Text>
            <Text className="text-textSecondary text-sm">{treinos.length} treino(s)</Text>
          </View>
          <TouchableOpacity onPress={abrirNovo} className="bg-primary w-12 h-12 rounded-2xl items-center justify-center">
            <Ionicons name="add" size={26} color="white" />
          </TouchableOpacity>
        </View>
        {/* Acesso a Planos */}
        <TouchableOpacity
          onPress={() => router.push('/(personal)/planos')}
          className="flex-row items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-3"
        >
          <Ionicons name="layers-outline" size={18} color="#6C63FF" />
          <View className="flex-1">
            <Text className="text-primary font-semibold text-sm">Planos de Treino</Text>
            <Text className="text-textMuted text-xs">Crie e atribua planos A+B+C completos</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
      ) : treinos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="clipboard-outline" size={56} color="#2e2e40" />
          <Text className="text-textSecondary text-center mt-4">Crie o primeiro treino dos seus alunos!</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {/* Agrupa e ordena treinos por aluno */}
          {(() => {
            const TIPO_ORDEM: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, 'Full Body': 4, Cardio: 5 };
            const grupos: Record<string, { aluno: Treino['aluno']; treinos: Treino[] }> = {};
            for (const t of treinos) {
              const id = t.aluno?._id || 'sem-aluno';
              if (!grupos[id]) grupos[id] = { aluno: t.aluno, treinos: [] };
              grupos[id].treinos.push(t);
            }
            // Ordenar alunos alfabeticamente
            const gruposOrdenados = Object.entries(grupos).sort(([, a], [, b]) => {
              const nomeA = (a.aluno?.nome || a.aluno?.email || 'Sem aluno').toLowerCase();
              const nomeB = (b.aluno?.nome || b.aluno?.email || 'Sem aluno').toLowerCase();
              return nomeA.localeCompare(nomeB);
            });

            const TIPO_COR: Record<string, { bg: string; text: string; border: string }> = {
              A: { bg: 'rgba(108,99,255,0.15)', text: '#6C63FF', border: 'rgba(108,99,255,0.4)' },
              B: { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', border: 'rgba(56,189,248,0.4)' },
              C: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.4)' },
              D: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
              'Full Body': { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', border: 'rgba(167,139,250,0.4)' },
              Cardio: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.4)' },
            };
            const DEFAULT_COR = { bg: 'rgba(144,144,168,0.15)', text: '#9090a8', border: 'rgba(144,144,168,0.4)' };

            const DIAS_ABREV: Record<string, string> = { seg: 'S', ter: 'T', qua: 'Q', qui: 'Q', sex: 'S', sab: 'S', dom: 'D' };
            const DIAS_FULL: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

            return gruposOrdenados.map(([alunoId, grupo]) => {
              const treinosOrdenados = [...grupo.treinos].sort((a, b) => {
                const oa = TIPO_ORDEM[a.tipo] ?? 99;
                const ob = TIPO_ORDEM[b.tipo] ?? 99;
                return oa !== ob ? oa - ob : a.tipo.localeCompare(b.tipo);
              });
              return (
                <View key={alunoId} className="mb-6">
                  {/* Header do aluno */}
                  <View className="flex-row items-center gap-2.5 mb-3">
                    <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-primary text-sm font-bold">
                        {(grupo.aluno?.nome || grupo.aluno?.email || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-textPrimary text-sm font-bold">
                        {grupo.aluno?.nome || grupo.aluno?.email || 'Sem aluno'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#6C63FF', fontSize: 11, fontWeight: '600' }}>{treinosOrdenados.length} treino{treinosOrdenados.length !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>

                  {treinosOrdenados.map((treino) => {
                    const cor = TIPO_COR[treino.tipo] || DEFAULT_COR;
                    return (
                      <TouchableOpacity
                        key={treino._id}
                        className="bg-surface border border-border rounded-2xl mb-2 overflow-hidden"
                        onPress={() => abrirEdit(treino)}
                        activeOpacity={0.85}
                      >
                        {/* Faixa lateral colorida por tipo */}
                        <View className="flex-row">
                          <View style={{ width: 4, backgroundColor: cor.text }} />
                          <View className="flex-1 p-4">
                            {/* Linha superior: tipo badge + ações */}
                            <View className="flex-row items-center justify-between mb-2">
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ backgroundColor: cor.bg, borderWidth: 1, borderColor: cor.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                                  <Text style={{ color: cor.text, fontSize: 12, fontWeight: '700' }}>Treino {treino.tipo}</Text>
                                </View>
                              </View>
                              <View className="flex-row gap-2">
                                <View className="bg-background border border-border rounded-lg p-1.5">
                                  <Ionicons name="create-outline" size={16} color="#6C63FF" />
                                </View>
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    Alert.alert(
                                      'Remover treino?',
                                      `"${treino.nome}" será removido permanentemente.`,
                                      [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Remover', style: 'destructive', onPress: () => deletarMutation.mutate(treino._id) },
                                      ]
                                    );
                                  }}
                                  className="bg-error/10 border border-error/30 rounded-lg p-1.5"
                                >
                                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Nome do treino */}
                            <Text className="text-textPrimary font-bold text-base mb-2">{treino.nome}</Text>

                            {/* Rodapé: exercícios + dias chips */}
                            <View className="flex-row items-center gap-3 flex-wrap">
                              <View className="flex-row items-center gap-1">
                                <Ionicons name="barbell-outline" size={13} color="#9090a8" />
                                <Text className="text-textMuted text-xs">{treino.exercicios.length} exercícios</Text>
                              </View>
                              {treino.diasSemana?.length > 0 && (
                                <View className="flex-row gap-1">
                                  {['seg','ter','qua','qui','sex','sab','dom'].map((d) => {
                                    const ativo = treino.diasSemana.includes(d);
                                    return (
                                      <View key={d} style={{
                                        width: 26, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: ativo ? cor.bg : 'transparent',
                                        borderWidth: 1,
                                        borderColor: ativo ? cor.border : '#2e2e40',
                                      }}>
                                        <Text style={{ fontSize: 9, fontWeight: '700', color: ativo ? cor.text : '#4a4a60' }}>
                                          {DIAS_FULL[d]?.charAt(0)}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            });
          })()}
        </ScrollView>
      )}

      <ModalTreino
        visivel={modalAberto}
        onFechar={() => { setModalAberto(false); setTreinoEdit(null); }}
        treinoEdit={treinoEdit}
      />
    </SafeAreaView>
  );
}
