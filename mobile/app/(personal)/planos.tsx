import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';

interface Exercicio { _id: string; nome: string; musculosPrincipais: string[] }
interface Aluno { _id: string; nome: string; email: string }

interface TreinoTemplate {
  _id?: string; // id do treino existente (para edit mode)
  nome: string;
  tipo: string;
  diasSemana: string[];
  exercicios: Array<{
    exercicio: string;
    exercicioNome: string;
    series: number;
    reps: string;
    carga: number;
    descanso: number;
  }>;
}

interface Plano {
  _id: string;
  nome: string;
  descricao: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  duracaoMeses?: number | null;
  treinos: Array<{ ordem: number; treino: { _id: string; nome: string; tipo: string; exercicios: any[] } }>;
  createdAt: string;
}

const NIVEIS = [
  { key: 'iniciante', label: 'Iniciante', color: '#4ade80' },
  { key: 'intermediario', label: 'Intermediário', color: '#facc15' },
  { key: 'avancado', label: 'Avançado', color: '#f87171' },
];
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DIAS_LABEL: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
const DURACOES = [
  { valor: null, label: 'Sem prazo' },
  { valor: 1, label: '1 mês' },
  { valor: 2, label: '2 meses' },
  { valor: 3, label: '3 meses' },
  { valor: 6, label: '6 meses' },
  { valor: 12, label: '1 ano' },
];

// ---- Modal Atribuir ----
function ModalAtribuir({
  plano,
  onClose,
}: {
  plano: Plano;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ['alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
  });

  const atribuirMutation = useMutation({
    mutationFn: (alunoId: string) =>
      api.post(`/planos/${plano._id}/atribuir`, { alunoId }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['treinos-personal'] });
      Alert.alert('Sucesso', data.message);
      onClose();
    },
    onError: () => Alert.alert('Erro', 'Não foi possível atribuir o plano.'),
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '70%' }}>
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
            <View>
              <Text className="text-textMuted text-xs uppercase tracking-widest mb-1">Atribuir plano</Text>
              <Text className="text-textPrimary text-lg font-bold">{plano.nome}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>
          <Text className="text-textSecondary text-sm px-6 py-3">
            Selecione o aluno para receber os treinos deste plano:
          </Text>
          <FlatList
            data={alunos}
            keyExtractor={(a) => a._id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            ListEmptyComponent={
              <Text className="text-textMuted text-center py-8">Nenhum aluno cadastrado.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    `Atribuir a ${item.nome}?`,
                    `Os treinos do plano "${plano.nome}" serão adicionados ao aluno.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Atribuir', onPress: () => atribuirMutation.mutate(item._id) },
                    ]
                  );
                }}
                disabled={atribuirMutation.isPending}
                className="flex-row items-center bg-background border border-border rounded-2xl px-4 py-4 mb-3"
              >
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Text className="text-primary font-bold text-base">
                    {(item.nome || item.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold">{item.nome || '—'}</Text>
                  <Text className="text-textMuted text-xs">{item.email}</Text>
                </View>
                <Ionicons name="person-add-outline" size={20} color="#6C63FF" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ---- Modal Criar/Editar Plano ----
function ModalPlano({
  planoEdit,
  onClose,
}: {
  planoEdit?: Plano | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!planoEdit;

  // ── Info states ─────────────────────────────────────────────────────────────
  const [nome, setNome] = useState(planoEdit?.nome || '');
  const [descricao, setDescricao] = useState(planoEdit?.descricao || '');
  const [nivel, setNivel] = useState<'iniciante' | 'intermediario' | 'avancado'>(
    planoEdit?.nivel || 'iniciante'
  );
  const [duracaoMeses, setDuracaoMeses] = useState<number | null>(
    planoEdit?.duracaoMeses ?? null
  );

  // ── Step ────────────────────────────────────────────────────────────────────
  const [stepAtual, setStepAtual] = useState<'info' | 'treinos'>('info');

  // ── Treinos ─────────────────────────────────────────────────────────────────
  const [treinos, setTreinos] = useState<TreinoTemplate[]>(
    isEdit && planoEdit?.treinos.length
      ? planoEdit.treinos.map(({ treino }) => ({
          _id: treino._id,
          nome: treino.nome,
          tipo: treino.tipo,
          diasSemana: [],
          exercicios: (treino.exercicios as any[]).map((ex) => ({
            exercicio: ex.exercicio?._id || ex.exercicio,
            exercicioNome: ex.exercicio?.nome || '',
            series: ex.series ?? 3,
            reps: ex.reps ?? '10',
            carga: ex.carga ?? 0,
            descanso: ex.descanso ?? 60,
          })),
        }))
      : [{ nome: 'Treino A', tipo: 'A', diasSemana: [], exercicios: [] }]
  );
  const [treinoAtivo, setTreinoAtivo] = useState(0);

  // ── Modal exercícios ─────────────────────────────────────────────────────────
  const [mostrarExercicios, setMostrarExercicios] = useState(false);
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [filtroMusculo, setFiltroMusculo] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: exerciciosDisponiveis = [] } = useQuery<Exercicio[]>({
    queryKey: ['exercicios-todos'],
    queryFn: () => api.get('/exercicios').then((r) => r.data),
  });

  const todosMusc = useMemo(() => {
    const set = new Set<string>();
    exerciciosDisponiveis.forEach((e) => e.musculosPrincipais?.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [exerciciosDisponiveis]);

  const exerciciosFiltrados = exerciciosDisponiveis.filter((e) => {
    const matchBusca = e.nome.toLowerCase().includes(buscaExercicio.toLowerCase());
    const matchMusc = !filtroMusculo || e.musculosPrincipais?.includes(filtroMusculo);
    return matchBusca && matchMusc;
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  // Criar plano (novo)
  const criarMutation = useMutation({
    mutationFn: () =>
      api.post('/planos', {
        nome,
        descricao,
        nivel,
        duracaoMeses,
        treinos: treinos.map((t) => ({
          ...t,
          exercicios: t.exercicios.map((ex) => ({
            exercicio: ex.exercicio,
            series: ex.series,
            reps: ex.reps,
            carga: ex.carga,
            descanso: ex.descanso,
          })),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] });
      onClose();
    },
    onError: () => Alert.alert('Erro', 'Não foi possível criar o plano.'),
  });

  // Salvar informações do plano (edit — só info)
  const salvarInfoMutation = useMutation({
    mutationFn: () =>
      api.patch(`/planos/${planoEdit!._id}`, { nome, descricao, nivel, duracaoMeses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] });
      Alert.alert('Salvo!', 'Informações do plano atualizadas.');
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar as informações.'),
  });

  // Salvar exercícios dos treinos (edit — só treinos)
  const salvarExerciciosMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        treinos
          .filter((t) => t._id)
          .map((t) =>
            api.patch(`/treinos/${t._id}`, {
              exercicios: t.exercicios.map((ex) => ({
                exercicio: ex.exercicio,
                series: ex.series,
                reps: ex.reps,
                carga: ex.carga,
                descanso: ex.descanso,
              })),
            })
          )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] });
      onClose();
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar os exercícios.'),
  });

  // ── Helpers — treinos ────────────────────────────────────────────────────────
  function adicionarTreino() {
    const tipos = ['A', 'B', 'C', 'D', 'E', 'F'];
    const prox = tipos[treinos.length] || String(treinos.length + 1);
    setTreinos((prev) => [
      ...prev,
      { nome: `Treino ${prox}`, tipo: prox, diasSemana: [], exercicios: [] },
    ]);
    setTreinoAtivo(treinos.length);
  }

  function removerTreino(idx: number) {
    if (treinos.length === 1) return Alert.alert('Aviso', 'O plano precisa de ao menos 1 treino.');
    setTreinos((prev) => prev.filter((_, i) => i !== idx));
    setTreinoAtivo(Math.max(0, treinoAtivo - 1));
  }

  function toggleDia(dia: string) {
    setTreinos((prev) =>
      prev.map((t, i) =>
        i !== treinoAtivo
          ? t
          : {
              ...t,
              diasSemana: t.diasSemana.includes(dia)
                ? t.diasSemana.filter((d) => d !== dia)
                : [...t.diasSemana, dia],
            }
      )
    );
  }

  function removerExercicio(exIdx: number) {
    setTreinos((prev) =>
      prev.map((t, i) =>
        i !== treinoAtivo
          ? t
          : { ...t, exercicios: t.exercicios.filter((_, j) => j !== exIdx) }
      )
    );
  }

  function editarExercicio(exIdx: number, campo: string, valor: any) {
    setTreinos((prev) =>
      prev.map((t, i) =>
        i !== treinoAtivo
          ? t
          : {
              ...t,
              exercicios: t.exercicios.map((ex, j) =>
                j !== exIdx ? ex : { ...ex, [campo]: valor }
              ),
            }
      )
    );
  }

  // ── Helpers — seleção de exercícios ─────────────────────────────────────────
  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function adicionarSelecionados() {
    const exsParaAdicionar = exerciciosDisponiveis.filter((e) => selecionados.has(e._id));
    setTreinos((prev) =>
      prev.map((t, i) =>
        i !== treinoAtivo
          ? t
          : {
              ...t,
              exercicios: [
                ...t.exercicios,
                ...exsParaAdicionar.map((ex) => ({
                  exercicio: ex._id,
                  exercicioNome: ex.nome,
                  series: 3,
                  reps: '10',
                  carga: 0,
                  descanso: 60,
                })),
              ],
            }
      )
    );
    setSelecionados(new Set());
    setMostrarExercicios(false);
    setBuscaExercicio('');
    setFiltroMusculo('');
  }

  function fecharModalExercicios() {
    setMostrarExercicios(false);
    setBuscaExercicio('');
    setFiltroMusculo('');
    setSelecionados(new Set());
  }

  const treinoAtualObj = treinos[treinoAtivo];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View className="bg-surface rounded-t-3xl" style={{ height: '92%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                {stepAtual === 'treinos' && (
                  <TouchableOpacity onPress={() => setStepAtual('info')}>
                    <Ionicons name="arrow-back" size={22} color="#9090a8" />
                  </TouchableOpacity>
                )}
                <Text className="text-textPrimary text-lg font-bold">
                  {isEdit ? 'Editar plano' : 'Novo plano'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#9090a8" />
              </TouchableOpacity>
            </View>

            {/* Indicador de steps */}
            <View className="flex-row px-6 pt-4 gap-2">
              {['info', 'treinos'].map((s) => (
                <View
                  key={s}
                  className="flex-1 h-1 rounded-full bg-primary"
                  style={{ opacity: stepAtual === s ? 1 : 0.25 }}
                />
              ))}
            </View>

            <ScrollView className="flex-1 px-6 pt-5" keyboardShouldPersistTaps="handled">
              {/* ── STEP INFO ── */}
              {stepAtual === 'info' && (
                <View>
                  <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-2">
                    Nome do plano *
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-textPrimary text-base mb-4"
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Ex: Hipertrofia Iniciante 3x"
                    placeholderTextColor="#5a5a70"
                  />

                  <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-2">
                    Descrição
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-textPrimary text-base mb-4"
                    value={descricao}
                    onChangeText={setDescricao}
                    placeholder="Opcional"
                    placeholderTextColor="#5a5a70"
                    multiline
                    numberOfLines={2}
                  />

                  <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-2">
                    Nível
                  </Text>
                  <View className="flex-row gap-2 mb-5">
                    {NIVEIS.map((n) => (
                      <TouchableOpacity
                        key={n.key}
                        onPress={() => setNivel(n.key as any)}
                        className={`flex-1 py-3 rounded-xl items-center border ${
                          nivel === n.key ? 'bg-primary border-primary' : 'bg-background border-border'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${nivel === n.key ? 'text-white' : 'text-textSecondary'}`}
                        >
                          {n.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-2">
                    Duração do plano
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-1" contentContainerStyle={{ paddingHorizontal: 4 }}>
                    {DURACOES.map((d) => (
                      <TouchableOpacity
                        key={String(d.valor)}
                        onPress={() => setDuracaoMeses(d.valor)}
                        className={`mr-2 px-4 py-2.5 rounded-xl border ${
                          duracaoMeses === d.valor ? 'bg-primary border-primary' : 'bg-background border-border'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${duracaoMeses === d.valor ? 'text-white' : 'text-textSecondary'}`}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {isEdit ? (
                    <View className="gap-3 mb-8">
                      <TouchableOpacity
                        onPress={() => salvarInfoMutation.mutate()}
                        disabled={!nome.trim() || salvarInfoMutation.isPending}
                        className="bg-surface border border-border rounded-2xl py-4 items-center"
                      >
                        {salvarInfoMutation.isPending ? (
                          <ActivityIndicator color="#6C63FF" />
                        ) : (
                          <Text className="text-textPrimary font-bold text-base">Salvar informações</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setStepAtual('treinos')}
                        className="bg-primary rounded-2xl py-4 items-center"
                      >
                        <Text className="text-white font-bold text-base">Editar exercícios →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome do plano.');
                        setStepAtual('treinos');
                      }}
                      className="bg-primary rounded-2xl py-4 items-center mb-8"
                    >
                      <Text className="text-white font-bold text-base">Próximo — Treinos</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ── STEP TREINOS ── */}
              {stepAtual === 'treinos' && (
                <View>
                  {/* Abas dos treinos */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4 -mx-1"
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                  >
                    {treinos.map((t, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setTreinoAtivo(i)}
                        className={`mr-2 px-4 py-2 rounded-xl border ${
                          treinoAtivo === i
                            ? 'bg-primary border-primary'
                            : 'bg-background border-border'
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            treinoAtivo === i ? 'text-white' : 'text-textSecondary'
                          }`}
                        >
                          {t.tipo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {!isEdit && (
                      <TouchableOpacity
                        onPress={adicionarTreino}
                        className="px-4 py-2 rounded-xl border border-dashed border-border bg-background"
                      >
                        <Text className="text-textMuted text-sm">+ Treino</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  {/* Nome do treino */}
                  {!isEdit && (
                    <View className="flex-row items-center gap-2 mb-4">
                      <TextInput
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-textPrimary text-base"
                        value={treinoAtualObj.nome}
                        onChangeText={(v) =>
                          setTreinos((prev) =>
                            prev.map((t, i) => (i === treinoAtivo ? { ...t, nome: v } : t))
                          )
                        }
                        placeholder="Nome do treino"
                        placeholderTextColor="#5a5a70"
                      />
                      {treinos.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removerTreino(treinoAtivo)}
                          className="w-12 h-12 bg-error/10 border border-error/30 rounded-xl items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={18} color="#f87171" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Nome do treino (somente leitura no edit) */}
                  {isEdit && (
                    <View className="bg-background border border-border rounded-xl px-4 py-3 mb-4">
                      <Text className="text-textPrimary font-semibold">{treinoAtualObj.nome}</Text>
                    </View>
                  )}

                  {/* Dias da semana (apenas em modo criar) */}
                  {!isEdit && (
                    <>
                      <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest mb-2">
                        Dias da semana
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {DIAS.map((dia) => (
                          <TouchableOpacity
                            key={dia}
                            onPress={() => toggleDia(dia)}
                            className={`px-3 py-1.5 rounded-lg border ${
                              treinoAtualObj.diasSemana.includes(dia)
                                ? 'bg-primary border-primary'
                                : 'bg-background border-border'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                treinoAtualObj.diasSemana.includes(dia) ? 'text-white' : 'text-textSecondary'
                              }`}
                            >
                              {DIAS_LABEL[dia]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Exercícios */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-textSecondary text-xs font-semibold uppercase tracking-widest">
                      Exercícios ({treinoAtualObj.exercicios.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => setMostrarExercicios(true)}
                      className="flex-row items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5"
                    >
                      <Ionicons name="add" size={16} color="#6C63FF" />
                      <Text className="text-primary text-xs font-semibold">Adicionar</Text>
                    </TouchableOpacity>
                  </View>

                  {treinoAtualObj.exercicios.map((ex, exIdx) => (
                    <View
                      key={exIdx}
                      className="bg-background border border-border rounded-xl p-4 mb-3"
                    >
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-textPrimary font-semibold flex-1" numberOfLines={1}>
                          {ex.exercicioNome}
                        </Text>
                        <TouchableOpacity onPress={() => removerExercicio(exIdx)}>
                          <Ionicons name="close" size={18} color="#9090a8" />
                        </TouchableOpacity>
                      </View>
                      <View className="flex-row gap-2">
                        {[
                          { label: 'Séries', campo: 'series', valor: String(ex.series), tipo: 'numeric' },
                          { label: 'Reps', campo: 'reps', valor: ex.reps, tipo: 'default' },
                          { label: 'Carga (kg)', campo: 'carga', valor: String(ex.carga), tipo: 'numeric' },
                        ].map((c) => (
                          <View key={c.campo} className="flex-1">
                            <Text className="text-textMuted text-xs mb-1">{c.label}</Text>
                            <TextInput
                              className="bg-surface border border-border rounded-lg px-2 py-2 text-textPrimary text-sm text-center"
                              value={c.valor}
                              onChangeText={(v) =>
                                editarExercicio(
                                  exIdx,
                                  c.campo,
                                  c.tipo === 'numeric' ? parseFloat(v) || 0 : v
                                )
                              }
                              keyboardType={c.tipo as any}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  {treinoAtualObj.exercicios.length === 0 && (
                    <View className="items-center py-8 border border-dashed border-border rounded-2xl mb-4">
                      <Ionicons name="barbell-outline" size={32} color="#2e2e40" />
                      <Text className="text-textMuted text-sm mt-2">
                        Adicione exercícios ao treino
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => isEdit ? salvarExerciciosMutation.mutate() : criarMutation.mutate()}
                    disabled={isEdit ? salvarExerciciosMutation.isPending : criarMutation.isPending}
                    className="bg-primary rounded-2xl py-4 items-center mt-4 mb-8"
                  >
                    {(isEdit ? salvarExerciciosMutation.isPending : criarMutation.isPending) ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        {isEdit ? 'Salvar exercícios' : 'Criar plano'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Modal busca/seleção de exercícios ── */}
      <Modal visible={mostrarExercicios} transparent animationType="slide" onRequestClose={fecharModalExercicios}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View className="bg-surface rounded-t-3xl" style={{ maxHeight: '85%' }}>
              {/* Header */}
              <View className="flex-row justify-between items-center px-6 pt-6 pb-3 border-b border-border">
                <Text className="text-textPrimary font-bold text-lg">Adicionar exercícios</Text>
                <TouchableOpacity onPress={fecharModalExercicios}>
                  <Ionicons name="close" size={24} color="#9090a8" />
                </TouchableOpacity>
              </View>

              {/* Busca */}
              <View className="px-5 pt-3 pb-2">
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-textPrimary"
                  value={buscaExercicio}
                  onChangeText={setBuscaExercicio}
                  placeholder="Buscar exercício..."
                  placeholderTextColor="#5a5a70"
                  autoFocus
                />
              </View>

              {/* Filtro por grupo muscular */}
              {todosMusc.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 6 }}
                >
                  <TouchableOpacity
                    onPress={() => setFiltroMusculo('')}
                    className={`px-3 py-1.5 rounded-lg border ${
                      !filtroMusculo ? 'bg-primary border-primary' : 'bg-background border-border'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!filtroMusculo ? 'text-white' : 'text-textSecondary'}`}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {todosMusc.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setFiltroMusculo(filtroMusculo === m ? '' : m)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        filtroMusculo === m ? 'bg-primary border-primary' : 'bg-background border-border'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${filtroMusculo === m ? 'text-white' : 'text-textSecondary'}`}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Lista */}
              <FlatList
                data={exerciciosFiltrados}
                keyExtractor={(e) => e._id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: selecionados.size > 0 ? 90 : 32 }}
                renderItem={({ item }) => {
                  const sel = selecionados.has(item._id);
                  return (
                    <TouchableOpacity
                      onPress={() => toggleSelecionado(item._id)}
                      className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${
                        sel ? 'bg-primary/10 border-primary/40' : 'bg-background border-border'
                      }`}
                    >
                      <View className="flex-1">
                        <Text className={`font-semibold ${sel ? 'text-primary' : 'text-textPrimary'}`}>
                          {item.nome}
                        </Text>
                        {item.musculosPrincipais?.length > 0 && (
                          <Text className="text-textMuted text-xs mt-0.5">
                            {item.musculosPrincipais.join(' · ')}
                          </Text>
                        )}
                      </View>
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
                          sel ? 'bg-primary border-primary' : 'border-border'
                        }`}
                      >
                        {sel && <Ionicons name="checkmark" size={14} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Botão flutuante de confirmar seleção */}
              {selecionados.size > 0 && (
                <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-surface border-t border-border">
                  <TouchableOpacity
                    onPress={adicionarSelecionados}
                    className="bg-primary rounded-2xl py-4 items-center"
                  >
                    <Text className="text-white font-bold text-base">
                      Adicionar {selecionados.size} exercício{selecionados.size !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
}

// ---- Tela principal ----
export default function PlanosScreen() {
  const queryClient = useQueryClient();
  const [modalCriar, setModalCriar] = useState(false);
  const [planoEdit, setPlanoEdit] = useState<Plano | null>(null);
  const [planoAtribuir, setPlanoAtribuir] = useState<Plano | null>(null);

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos'],
    queryFn: () => api.get('/planos').then((r) => r.data),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/planos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planos'] }),
    onError: () => Alert.alert('Erro', 'Não foi possível excluir o plano.'),
  });

  const duplicarMutation = useMutation({
    mutationFn: (id: string) => api.post(`/planos/${id}/duplicar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planos'] }),
    onError: () => Alert.alert('Erro', 'Não foi possível duplicar o plano.'),
  });

  function confirmarExcluir(plano: Plano) {
    Alert.alert(
      `Excluir "${plano.nome}"?`,
      'Os treinos-template deste plano serão removidos. Treinos já atribuídos a alunos não serão afetados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluirMutation.mutate(plano._id) },
      ]
    );
  }

  const nivelCor: Record<string, string> = {
    iniciante: '#4ade80',
    intermediario: '#facc15',
    avancado: '#f87171',
  };
  const nivelLabel: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {modalCriar && (
        <ModalPlano onClose={() => setModalCriar(false)} />
      )}
      {planoEdit && (
        <ModalPlano planoEdit={planoEdit} onClose={() => setPlanoEdit(null)} />
      )}
      {planoAtribuir && (
        <ModalAtribuir plano={planoAtribuir} onClose={() => setPlanoAtribuir(null)} />
      )}

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-4 pb-4">
        <View>
          <Text className="text-textPrimary text-2xl font-bold">Planos de Treino</Text>
          <Text className="text-textSecondary text-sm">{planos.length} plano(s) criado(s)</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalCriar(true)}
          className="w-12 h-12 bg-primary rounded-2xl items-center justify-center"
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6C63FF" />
        </View>
      ) : planos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="layers-outline" size={64} color="#2e2e40" />
          <Text className="text-textSecondary text-center text-base mt-4">
            Nenhum plano criado ainda.{'\n'}Crie um plano com treinos A, B, C e atribua a um aluno de uma vez.
          </Text>
          <TouchableOpacity
            onPress={() => setModalCriar(true)}
            className="mt-6 bg-primary rounded-2xl px-6 py-3"
          >
            <Text className="text-white font-bold">Criar primeiro plano</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {planos.map((plano) => (
            <View key={plano._id} className="bg-surface border border-border rounded-2xl p-5 mb-4">
              {/* Cabeçalho do card */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      style={{ backgroundColor: nivelCor[plano.nivel] + '20', borderColor: nivelCor[plano.nivel] + '40', borderWidth: 1 }}
                      className="px-2 py-0.5 rounded-md"
                    >
                      <Text style={{ color: nivelCor[plano.nivel] }} className="text-xs font-bold">
                        {nivelLabel[plano.nivel]}
                      </Text>
                    </View>
                    <Text className="text-textMuted text-xs">
                      {plano.treinos.length} treino(s)
                    </Text>
                    {plano.duracaoMeses && (
                      <View className="flex-row items-center gap-1 bg-background border border-border rounded-md px-2 py-0.5">
                        <Ionicons name="time-outline" size={10} color="#9090a8" />
                        <Text className="text-textMuted text-xs">
                          {plano.duracaoMeses === 12 ? '1 ano' : `${plano.duracaoMeses}m`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-textPrimary text-lg font-bold">{plano.nome}</Text>
                  {plano.descricao ? (
                    <Text className="text-textMuted text-xs mt-1">{plano.descricao}</Text>
                  ) : null}
                </View>
              </View>

              {/* Badges dos treinos */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {plano.treinos.map(({ treino }) => (
                  <View key={treino._id} className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                    <Text className="text-primary text-xs font-bold">{treino.tipo}</Text>
                    <Text className="text-textMuted text-xs">{treino.exercicios.length} ex.</Text>
                  </View>
                ))}
              </View>

              {/* Ações */}
              <View className="flex-row gap-2 border-t border-border pt-3">
                <TouchableOpacity
                  onPress={() => setPlanoAtribuir(plano)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary rounded-xl py-2.5"
                >
                  <Ionicons name="person-add-outline" size={16} color="white" />
                  <Text className="text-white text-xs font-bold">Atribuir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPlanoEdit(plano)}
                  className="w-10 h-10 bg-surfaceLight border border-border rounded-xl items-center justify-center"
                >
                  <Ionicons name="pencil-outline" size={16} color="#9090a8" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => duplicarMutation.mutate(plano._id)}
                  disabled={duplicarMutation.isPending}
                  className="w-10 h-10 bg-surfaceLight border border-border rounded-xl items-center justify-center"
                >
                  <Ionicons name="copy-outline" size={16} color="#9090a8" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmarExcluir(plano)}
                  className="w-10 h-10 bg-error/10 border border-error/30 rounded-xl items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
