import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

// ── helpers ──────────────────────────────────────────────────────────────────

function Opcao({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2.5 rounded-xl border mr-2 mb-2 ${ativo ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
    >
      <Text className={`text-sm font-semibold ${ativo ? 'text-white' : 'text-textSecondary'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function SimNao({ valor, onChange }: { valor: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row gap-3 mt-1">
      <TouchableOpacity
        onPress={() => onChange(true)}
        className={`flex-1 py-3 rounded-xl border items-center ${valor === true ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
      >
        <Text className={`font-semibold ${valor === true ? 'text-white' : 'text-textSecondary'}`}>Sim</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(false)}
        className={`flex-1 py-3 rounded-xl border items-center ${valor === false ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
      >
        <Text className={`font-semibold ${valor === false ? 'text-white' : 'text-textSecondary'}`}>Não</Text>
      </TouchableOpacity>
    </View>
  );
}

function Campo({ label, value, onChange, placeholder, multiline }: any) {
  return (
    <View className="mb-4">
      <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">{label}</Text>
      <View className="bg-surface border border-border rounded-xl px-4">
        <TextInput
          className="text-textPrimary py-3.5 text-base"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#5a5a70"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-textSecondary text-xs font-semibold mb-3 uppercase tracking-widest">{titulo}</Text>
      {children}
    </View>
  );
}

// ── estado inicial ────────────────────────────────────────────────────────────

const estado0 = {
  tempoTreinando: '',
  frequenciaSemanal: null as number | null,
  temLesaoAtual: null as boolean | null,
  lesaoAtual: '',
  temLesaoPassada: null as boolean | null,
  lesaoPassada: '',
  doencasCronicas: '',
  problemasCardiacos: null as boolean | null,
  usaMedicamentos: null as boolean | null,
  medicamentos: '',
  temLimitacaoFisica: null as boolean | null,
  limitacaoFisica: '',
  temDeficiencia: null as boolean | null,
  deficiencia: '',
  nivelAtividade: '',
  profissaoSedentaria: null as boolean | null,
  fumante: null as boolean | null,
  consumoAlcool: '',
  observacoes: '',
};

// ── telas por etapa ───────────────────────────────────────────────────────────

const TEMPO_TREINO = [
  { value: 'nunca', label: 'Nunca treinei' },
  { value: 'menos6', label: 'Menos de 6 meses' },
  { value: '6a12', label: '6 a 12 meses' },
  { value: '1a3anos', label: '1 a 3 anos' },
  { value: 'mais3anos', label: 'Mais de 3 anos' },
];

const NIVEL_ATIVIDADE = [
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'muito_ativo', label: 'Muito ativo' },
];

const FREQUENCIA = [1, 2, 3, 4, 5, 6, 7];

// ── componente principal ──────────────────────────────────────────────────────

export default function AnamneseScreen() {
  const [etapa, setEtapa] = useState(0);
  const [form, setForm] = useState(estado0);
  const { updateUser } = useAuthStore();

  function set(campo: keyof typeof estado0, valor: any) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const mutation = useMutation({
    mutationFn: () => api.patch('/users/me/anamnese', form),
    onSuccess: () => {
      updateUser({ anamneseConcluida: true });
      router.replace('/(aluno)/treino');
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar a anamnese. Tente novamente.'),
  });

  const ETAPAS = ['Histórico', 'Saúde', 'Lesões', 'Estilo de Vida'];
  const totalEtapas = ETAPAS.length;

  function avancar() {
    if (etapa < totalEtapas - 1) setEtapa((e) => e + 1);
    else mutation.mutate();
  }

  function voltar() {
    if (etapa > 0) setEtapa((e) => e - 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Bem-vindo!</Text>
          <Text className="text-textPrimary text-2xl font-bold">Anamnese</Text>
          <Text className="text-textSecondary text-sm mt-1">
            Essas informações ajudam seu personal a criar treinos seguros e eficientes para você.
          </Text>

          {/* Barra de progresso */}
          <View className="flex-row gap-1.5 mt-4">
            {ETAPAS.map((_, i) => (
              <View
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= etapa ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </View>
          <Text className="text-textMuted text-xs mt-2">
            Etapa {etapa + 1} de {totalEtapas}: {ETAPAS[etapa]}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
        >
          {/* ── Etapa 0: Histórico de treino ── */}
          {etapa === 0 && (
            <>
              <Secao titulo="Há quanto tempo você treina?">
                <View className="flex-row flex-wrap">
                  {TEMPO_TREINO.map((t) => (
                    <Opcao
                      key={t.value}
                      label={t.label}
                      ativo={form.tempoTreinando === t.value}
                      onPress={() => set('tempoTreinando', t.value)}
                    />
                  ))}
                </View>
              </Secao>

              <Secao titulo="Frequência semanal de treinos">
                <View className="flex-row flex-wrap">
                  {FREQUENCIA.map((n) => (
                    <Opcao
                      key={n}
                      label={`${n}×`}
                      ativo={form.frequenciaSemanal === n}
                      onPress={() => set('frequenciaSemanal', n)}
                    />
                  ))}
                </View>
              </Secao>

              <Secao titulo="Nível de atividade física atual">
                <View className="flex-row flex-wrap">
                  {NIVEL_ATIVIDADE.map((n) => (
                    <Opcao
                      key={n.value}
                      label={n.label}
                      ativo={form.nivelAtividade === n.value}
                      onPress={() => set('nivelAtividade', n.value)}
                    />
                  ))}
                </View>
              </Secao>

              <Secao titulo="Sua profissão é predominantemente sedentária?">
                <SimNao valor={form.profissaoSedentaria} onChange={(v) => set('profissaoSedentaria', v)} />
              </Secao>
            </>
          )}

          {/* ── Etapa 1: Saúde ── */}
          {etapa === 1 && (
            <>
              <Secao titulo="Possui alguma doença crônica?">
                <Text className="text-textMuted text-xs mb-2">Ex: hipertensão, diabetes, asma… Deixe em branco se não.</Text>
                <Campo
                  label=""
                  value={form.doencasCronicas}
                  onChange={(v: string) => set('doencasCronicas', v)}
                  placeholder="Descreva aqui"
                  multiline
                />
              </Secao>

              <Secao titulo="Tem ou já teve problemas cardíacos?">
                <SimNao valor={form.problemasCardiacos} onChange={(v) => set('problemasCardiacos', v)} />
              </Secao>

              <Secao titulo="Usa algum medicamento regularmente?">
                <SimNao valor={form.usaMedicamentos} onChange={(v) => set('usaMedicamentos', v)} />
                {form.usaMedicamentos && (
                  <View className="mt-3">
                    <Campo
                      label="Quais medicamentos?"
                      value={form.medicamentos}
                      onChange={(v: string) => set('medicamentos', v)}
                      placeholder="Liste os medicamentos"
                      multiline
                    />
                  </View>
                )}
              </Secao>
            </>
          )}

          {/* ── Etapa 2: Lesões e Limitações ── */}
          {etapa === 2 && (
            <>
              <Secao titulo="Possui alguma lesão atual?">
                <SimNao valor={form.temLesaoAtual} onChange={(v) => set('temLesaoAtual', v)} />
                {form.temLesaoAtual && (
                  <View className="mt-3">
                    <Campo
                      label="Descreva a lesão e a região"
                      value={form.lesaoAtual}
                      onChange={(v: string) => set('lesaoAtual', v)}
                      placeholder="Ex: tendinite no ombro direito"
                      multiline
                    />
                  </View>
                )}
              </Secao>

              <Secao titulo="Já teve alguma lesão anterior relevante?">
                <SimNao valor={form.temLesaoPassada} onChange={(v) => set('temLesaoPassada', v)} />
                {form.temLesaoPassada && (
                  <View className="mt-3">
                    <Campo
                      label="Descreva a lesão e a região"
                      value={form.lesaoPassada}
                      onChange={(v: string) => set('lesaoPassada', v)}
                      placeholder="Ex: cirurgia no joelho esquerdo em 2021"
                      multiline
                    />
                  </View>
                )}
              </Secao>

              <Secao titulo="Possui alguma limitação física?">
                <Text className="text-textMuted text-xs mb-2">Ex: dor lombar crônica, mobilidade reduzida, escoliose…</Text>
                <SimNao valor={form.temLimitacaoFisica} onChange={(v) => set('temLimitacaoFisica', v)} />
                {form.temLimitacaoFisica && (
                  <View className="mt-3">
                    <Campo
                      label="Descreva a limitação"
                      value={form.limitacaoFisica}
                      onChange={(v: string) => set('limitacaoFisica', v)}
                      placeholder="Descreva aqui"
                      multiline
                    />
                  </View>
                )}
              </Secao>

              <Secao titulo="Possui alguma deficiência física?">
                <SimNao valor={form.temDeficiencia} onChange={(v) => set('temDeficiencia', v)} />
                {form.temDeficiencia && (
                  <View className="mt-3">
                    <Campo
                      label="Descreva a deficiência"
                      value={form.deficiencia}
                      onChange={(v: string) => set('deficiencia', v)}
                      placeholder="Descreva aqui"
                      multiline
                    />
                  </View>
                )}
              </Secao>
            </>
          )}

          {/* ── Etapa 3: Estilo de vida ── */}
          {etapa === 3 && (
            <>
              <Secao titulo="Fuma?">
                <SimNao valor={form.fumante} onChange={(v) => set('fumante', v)} />
              </Secao>

              <Secao titulo="Consome álcool?">
                <View className="flex-row gap-3">
                  {[
                    { value: 'nunca', label: 'Nunca' },
                    { value: 'social', label: 'Socialmente' },
                    { value: 'frequente', label: 'Frequentemente' },
                  ].map((o) => (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => set('consumoAlcool', o.value)}
                      className={`flex-1 py-3 rounded-xl border items-center ${form.consumoAlcool === o.value ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                    >
                      <Text className={`text-xs font-semibold ${form.consumoAlcool === o.value ? 'text-white' : 'text-textSecondary'}`}>
                        {o.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Secao>

              <Secao titulo="Observações adicionais">
                <Text className="text-textMuted text-xs mb-2">
                  Alguma informação importante que seu personal deve saber?
                </Text>
                <Campo
                  label=""
                  value={form.observacoes}
                  onChange={(v: string) => set('observacoes', v)}
                  placeholder="Opcional — escreva aqui qualquer detalhe relevante"
                  multiline
                />
              </Secao>
            </>
          )}
        </ScrollView>

        {/* Botões de navegação */}
        <View className="px-5 pb-6 pt-3 flex-row gap-3 border-t border-border">
          {etapa > 0 && (
            <TouchableOpacity
              onPress={voltar}
              className="w-12 h-12 bg-surface border border-border rounded-xl items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#9090a8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={avancar}
            disabled={mutation.isPending}
            className="flex-1 bg-primary rounded-xl py-4 items-center justify-center"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                {etapa === totalEtapas - 1 ? 'Concluir' : 'Próximo'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
