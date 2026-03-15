import { useState } from 'react';
import {
  View, Text, TextInput, ActivityIndicator, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';

interface Aluno {
  _id: string;
  nome: string;
  email: string;
  createdAt: string;
  personalId: { nome: string; email: string } | null;
}

export default function AdminAlunosScreen() {
  const [busca, setBusca] = useState('');

  const { data: alunos = [], isLoading } = useQuery<Aluno[]>({
    queryKey: ['admin-alunos'],
    queryFn: () => api.get('/admin/alunos').then((r) => r.data),
  });

  const alunosFiltrados = alunos.filter((a) =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-4">
        <Text className="text-textPrimary text-2xl font-bold">Todos os Alunos</Text>
        <Text className="text-textSecondary text-sm">{alunos.length} aluno(s) na plataforma</Text>
      </View>

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
        <ActivityIndicator color="#facc15" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="people-outline" size={56} color="#2e2e40" />
              <Text className="text-textSecondary text-center mt-4">Nenhum aluno encontrado.</Text>
            </View>
          }
          renderItem={({ item: aluno }) => (
            <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-success/20 items-center justify-center mr-3">
                  <Text className="text-success font-bold text-lg">
                    {(aluno.nome || aluno.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-bold">{aluno.nome || 'Sem nome'}</Text>
                  <Text className="text-textMuted text-xs">{aluno.email}</Text>
                  {aluno.personalId ? (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons name="person-circle-outline" size={12} color="#9090a8" />
                      <Text className="text-textSecondary text-xs">
                        Personal: {aluno.personalId.nome || aluno.personalId.email}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-warning text-xs mt-1">Sem personal vinculado</Text>
                  )}
                </View>
                <Text className="text-textMuted text-xs">
                  {new Date(aluno.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
