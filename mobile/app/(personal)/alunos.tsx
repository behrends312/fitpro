import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../src/services/api';

interface Aluno {
  _id: string;
  nome: string;
  email: string;
  telefone: string;
  objetivo: string;
  peso: number | null;
  altura: number | null;
  foto: string | null;
  createdAt: string;
}

function enviarWhatsApp(nome: string, email: string, senha: string, telefone: string) {
  const msg = `Olá ${nome}! 👋\n\nSeu acesso ao *Athlio* está pronto:\n\n📧 E-mail: ${email}\n🔑 Senha: ${senha}\n\nBaixe o app e comece a treinar!`;
  const phone = telefone.replace(/\D/g, '');
  const url = phone
    ? `whatsapp://send?phone=55${phone}&text=${encodeURIComponent(msg)}`
    : `whatsapp://send?text=${encodeURIComponent(msg)}`;
  Linking.openURL(url);
}

function CampoTexto({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: any) {
  return (
    <View className="mb-4">
      <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">{label}</Text>
      <View className="bg-background border border-border rounded-xl px-4">
        <TextInput
          className="text-textPrimary py-3.5 text-base"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#5a5a70"
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
        />
      </View>
    </View>
  );
}

function ModalNovoAluno({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const queryClient = useQueryClient();

  function limpar() {
    setNome(''); setEmail(''); setTelefone(''); setSenha(''); setObjetivo('');
  }

  const criarMutation = useMutation({
    mutationFn: () => api.post('/users/alunos', { nome, email, telefone, senha: senha || '123456', objetivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-alunos'] });
      const senhaFinal = senha || '123456';
      const nomeCapturado = nome;
      const emailCapturado = email;
      const telefoneCapturado = telefone;
      onFechar();
      limpar();
      Alert.alert(
        'Aluno adicionado!',
        'Deseja enviar os dados de acesso via WhatsApp?',
        [
          { text: 'Agora não', style: 'cancel' },
          {
            text: 'Enviar WhatsApp',
            onPress: () => enviarWhatsApp(nomeCapturado, emailCapturado, senhaFinal, telefoneCapturado),
          },
        ]
      );
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível adicionar o aluno.'),
  });

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 bg-black/70 justify-end">
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View className="bg-surface rounded-t-3xl px-6 pt-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-textPrimary text-xl font-bold">Novo Aluno</Text>
                <TouchableOpacity onPress={onFechar}>
                  <Ionicons name="close" size={24} color="#9090a8" />
                </TouchableOpacity>
              </View>

              <CampoTexto label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do aluno" autoCapitalize="words" />
              <CampoTexto label="E-mail" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
              <CampoTexto label="WhatsApp (opcional)" value={telefone} onChangeText={setTelefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" autoCapitalize="none" />
              <CampoTexto label="Senha inicial (opcional)" value={senha} onChangeText={setSenha} placeholder="Padrão: 123456" />
              <CampoTexto label="Objetivo (opcional)" value={objetivo} onChangeText={setObjetivo} placeholder="Ex: Ganhar massa" />

              <TouchableOpacity
                onPress={() => criarMutation.mutate()}
                disabled={criarMutation.isPending || !nome || !email}
                className="bg-primary rounded-xl py-4 items-center mt-2"
              >
                {criarMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">Adicionar Aluno</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalEditarAluno({ aluno, onFechar }: { aluno: Aluno | null; onFechar: () => void }) {
  const [nome, setNome] = useState(aluno?.nome || '');
  const [telefone, setTelefone] = useState(aluno?.telefone || '');
  const [objetivo, setObjetivo] = useState(aluno?.objetivo || '');
  const [peso, setPeso] = useState(aluno?.peso ? String(aluno.peso) : '');
  const [altura, setAltura] = useState(aluno?.altura ? String(aluno.altura) : '');
  const queryClient = useQueryClient();

  const editarMutation = useMutation({
    mutationFn: () => api.patch(`/users/alunos/${aluno!._id}`, {
      nome, telefone, objetivo,
      peso: peso ? parseFloat(peso) : null,
      altura: altura ? parseFloat(altura) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-alunos'] });
      onFechar();
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível editar o aluno.'),
  });

  if (!aluno) return null;

  return (
    <Modal visible={!!aluno} transparent animationType="slide" onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 bg-black/70 justify-end">
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View className="bg-surface rounded-t-3xl px-6 pt-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-textPrimary text-xl font-bold">Editar Aluno</Text>
                <TouchableOpacity onPress={onFechar}>
                  <Ionicons name="close" size={24} color="#9090a8" />
                </TouchableOpacity>
              </View>

              <CampoTexto label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do aluno" autoCapitalize="words" />
              <CampoTexto label="WhatsApp" value={telefone} onChangeText={setTelefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" autoCapitalize="none" />
              <CampoTexto label="Objetivo" value={objetivo} onChangeText={setObjetivo} placeholder="Ex: Ganhar massa" />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <CampoTexto label="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="Ex: 80" keyboardType="numeric" />
                </View>
                <View className="flex-1">
                  <CampoTexto label="Altura (cm)" value={altura} onChangeText={setAltura} placeholder="Ex: 175" keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => editarMutation.mutate()}
                disabled={editarMutation.isPending || !nome}
                className="bg-primary rounded-xl py-4 items-center mt-2"
              >
                {editarMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">Salvar alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AlunosScreen() {
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const queryClient = useQueryClient();

  const { data: alunos = [], isLoading } = useQuery<Aluno[]>({
    queryKey: ['meus-alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
  });

  const removerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/alunos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meus-alunos'] }),
    onError: () => Alert.alert('Erro', 'Não foi possível remover o aluno.'),
  });

  function confirmarRemocao(aluno: Aluno) {
    Alert.alert(
      'Remover aluno?',
      `${aluno.nome || aluno.email} será desvinculado da sua conta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removerMutation.mutate(aluno._id) },
      ]
    );
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-textPrimary text-2xl font-bold">Alunos</Text>
          <Text className="text-textSecondary text-sm">{alunos.length} aluno(s)</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalAberto(true)}
          className="bg-primary w-12 h-12 rounded-2xl items-center justify-center"
        >
          <Ionicons name="person-add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View className="mx-5 mb-4 flex-row items-center bg-surface border border-border rounded-xl px-4">
        <Ionicons name="search-outline" size={18} color="#9090a8" />
        <TextInput
          className="flex-1 text-textPrimary py-3.5 ml-3 text-base"
          placeholder="Buscar aluno..."
          placeholderTextColor="#5a5a70"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="people-outline" size={56} color="#2e2e40" />
              <Text className="text-textSecondary text-center mt-4 text-base">
                {busca ? 'Nenhum aluno encontrado.' : 'Adicione seu primeiro aluno!'}
              </Text>
            </View>
          }
          renderItem={({ item: aluno }) => (
            <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center mb-3">
                <View className="w-14 h-14 rounded-2xl bg-primary/20 items-center justify-center mr-4">
                  <Text className="text-primary font-bold text-xl">
                    {(aluno.nome || aluno.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-bold text-base">{aluno.nome || 'Sem nome'}</Text>
                  <Text className="text-textMuted text-xs">{aluno.email}</Text>
                  {aluno.telefone ? (
                    <Text className="text-textMuted text-xs mt-0.5">{aluno.telefone}</Text>
                  ) : null}
                  {aluno.objetivo ? (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons name="flag-outline" size={11} color="#9090a8" />
                      <Text className="text-textSecondary text-xs">{aluno.objetivo}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Ações */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/(personal)/treinos',
                    params: { alunoId: aluno._id, alunoNome: aluno.nome },
                  })}
                  className="flex-1 bg-primary/10 py-2 rounded-xl items-center"
                >
                  <Text className="text-primary text-xs font-semibold">Ver treinos</Text>
                </TouchableOpacity>

                {aluno.telefone ? (
                  <TouchableOpacity
                    onPress={() => enviarWhatsApp(aluno.nome, aluno.email, '••••••', aluno.telefone)}
                    className="w-9 h-9 bg-green-500/10 rounded-xl items-center justify-center"
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => setAlunoEditando(aluno)}
                  className="w-9 h-9 bg-surface border border-border rounded-xl items-center justify-center"
                >
                  <Ionicons name="pencil-outline" size={16} color="#9090a8" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmarRemocao(aluno)}
                  className="w-9 h-9 bg-red-500/10 rounded-xl items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <ModalNovoAluno visivel={modalAberto} onFechar={() => setModalAberto(false)} />
      <ModalEditarAluno aluno={alunoEditando} onFechar={() => setAlunoEditando(null)} />
    </SafeAreaView>
  );
}
