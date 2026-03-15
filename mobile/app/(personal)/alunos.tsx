import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
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

function ModalNovoAluno({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const queryClient = useQueryClient();

  const criarMutation = useMutation({
    mutationFn: () => api.post('/users/alunos', { nome, email, senha: senha || '123456', objetivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-alunos'] });
      onFechar();
      setNome(''); setEmail(''); setSenha(''); setObjetivo('');
      Alert.alert('Aluno adicionado!', 'O aluno foi vinculado à sua conta.');
    },
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível adicionar o aluno.'),
  });

  return (
    <Modal visible={visivel} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/70 justify-end">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
        <View className="bg-surface rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-textPrimary text-xl font-bold">Novo Aluno</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          {[
            { label: 'Nome', value: nome, setter: setNome, placeholder: 'Nome do aluno', cap: 'words' as const },
            { label: 'E-mail', value: email, setter: setEmail, placeholder: 'email@exemplo.com', kb: 'email-address' as const, cap: 'none' as const },
            { label: 'Senha inicial (opcional)', value: senha, setter: setSenha, placeholder: 'Padrão: 123456' },
            { label: 'Objetivo (opcional)', value: objetivo, setter: setObjetivo, placeholder: 'Ex: Ganhar massa' },
          ].map((c) => (
            <View key={c.label} className="mb-4">
              <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">{c.label}</Text>
              <View className="bg-background border border-border rounded-xl px-4">
                <TextInput
                  className="text-textPrimary py-3.5 text-base"
                  value={c.value}
                  onChangeText={c.setter}
                  placeholder={c.placeholder}
                  placeholderTextColor="#5a5a70"
                  keyboardType={(c as any).kb || 'default'}
                  autoCapitalize={(c as any).cap || 'sentences'}
                />
              </View>
            </View>
          ))}

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

export default function AlunosScreen() {
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
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
            <TouchableOpacity
              className="bg-surface border border-border rounded-2xl p-4 mb-3"
              onLongPress={() =>
                Alert.alert('Remover aluno?', aluno.nome || aluno.email, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => removerMutation.mutate(aluno._id),
                  },
                ])
              }
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-2xl bg-primary/20 items-center justify-center mr-4">
                  <Text className="text-primary font-bold text-xl">
                    {(aluno.nome || aluno.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-bold text-base">{aluno.nome || 'Sem nome'}</Text>
                  <Text className="text-textMuted text-xs">{aluno.email}</Text>
                  {aluno.objetivo ? (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons name="flag-outline" size={11} color="#9090a8" />
                      <Text className="text-textSecondary text-xs">{aluno.objetivo}</Text>
                    </View>
                  ) : null}
                </View>
                <View className="items-end gap-2">
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/(personal)/treinos',
                      params: { alunoId: aluno._id, alunoNome: aluno.nome },
                    })}
                    className="bg-primary/10 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="text-primary text-xs font-semibold">Ver treinos</Text>
                  </TouchableOpacity>
                  {aluno.peso && aluno.altura ? (
                    <Text className="text-textMuted text-xs">{aluno.peso}kg · {aluno.altura}cm</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <ModalNovoAluno visivel={modalAberto} onFechar={() => setModalAberto(false)} />
    </SafeAreaView>
  );
}
