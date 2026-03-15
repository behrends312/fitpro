import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const PLANOS_INFO: Record<string, { cor: string; bg: string; label: string }> = {
  trial: { cor: '#9090a8', bg: '#9090a820', label: 'Trial' },
  basic: { cor: '#4ade80', bg: '#4ade8020', label: 'Basic' },
  intermediate: { cor: '#6C63FF', bg: '#6C63FF20', label: 'Intermediate' },
  advanced: { cor: '#facc15', bg: '#facc1520', label: 'Advanced' },
};

export default function PersonalDashboard() {
  const { user } = useAuthStore();

  const { data: alunos = [], isLoading: alunosLoading } = useQuery<any[]>({
    queryKey: ['meus-alunos'],
    queryFn: () => api.get('/users/alunos').then((r) => r.data),
  });

  const { data: treinos = [], isLoading: treinosLoading } = useQuery<any[]>({
    queryKey: ['meus-treinos'],
    queryFn: () => api.get('/treinos').then((r) => r.data),
  });

  const { data: meuPerfil } = useQuery<any>({
    queryKey: ['meu-perfil'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const planoInfo = PLANOS_INFO[meuPerfil?.plano?.tipo ?? 'trial'];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-textSecondary text-sm">{saudacao} 👋</Text>
          <Text className="text-textPrimary text-2xl font-bold">
            {meuPerfil?.nome || user?.email?.split('@')[0]}
          </Text>

          {/* Badge do plano */}
          <TouchableOpacity
            onPress={() => router.push('/(personal)/perfil')}
            style={{ backgroundColor: planoInfo.bg }}
            className="flex-row items-center self-start px-3 py-1.5 rounded-full mt-2"
          >
            <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: planoInfo.cor }} />
            <Text style={{ color: planoInfo.cor }} className="text-xs font-bold">
              Plano {planoInfo.label}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cards de stats */}
        <View className="px-5 mt-5">
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={() => router.push('/(personal)/alunos')}
              className="flex-1 bg-surface border border-border rounded-2xl p-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="bg-primary/10 p-2.5 rounded-xl">
                  <Ionicons name="people-outline" size={22} color="#6C63FF" />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#5a5a70" />
              </View>
              <Text className="text-textPrimary text-3xl font-bold mt-3">
                {alunosLoading ? '—' : alunos.length}
              </Text>
              <Text className="text-textSecondary text-xs mt-1">Alunos ativos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(personal)/treinos')}
              className="flex-1 bg-surface border border-border rounded-2xl p-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="bg-accent/10 p-2.5 rounded-xl">
                  <Ionicons name="clipboard-outline" size={22} color="#FF6584" />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#5a5a70" />
              </View>
              <Text className="text-textPrimary text-3xl font-bold mt-3">
                {treinosLoading ? '—' : treinos.length}
              </Text>
              <Text className="text-textSecondary text-xs mt-1">Treinos criados</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alunos recentes */}
        <View className="px-5 mt-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-textPrimary font-bold text-base">Alunos recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(personal)/alunos')}>
              <Text className="text-primary text-sm">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {alunosLoading ? (
            <ActivityIndicator color="#6C63FF" />
          ) : alunos.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/(personal)/alunos')}
              className="bg-surface border border-dashed border-border rounded-2xl p-6 items-center"
            >
              <Ionicons name="person-add-outline" size={32} color="#5a5a70" />
              <Text className="text-textSecondary text-center mt-2 text-sm">
                Nenhum aluno ainda.{'\n'}Toque para adicionar seu primeiro aluno.
              </Text>
            </TouchableOpacity>
          ) : (
            alunos.slice(0, 4).map((aluno) => (
              <TouchableOpacity
                key={aluno._id}
                onPress={() => router.push({ pathname: '/(personal)/alunos', params: { alunoId: aluno._id } })}
                className="flex-row items-center bg-surface border border-border rounded-2xl p-4 mb-3"
              >
                <View className="w-12 h-12 rounded-2xl bg-primary/20 items-center justify-center mr-3">
                  <Text className="text-primary font-bold text-lg">
                    {(aluno.nome || aluno.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold">{aluno.nome || 'Sem nome'}</Text>
                  <Text className="text-textMuted text-xs">{aluno.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#5a5a70" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Ações rápidas */}
        <View className="px-5 mt-5 mb-8">
          <Text className="text-textPrimary font-bold text-base mb-3">Ações rápidas</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(personal)/exercicios')}
              className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"
            >
              <Ionicons name="add-circle-outline" size={28} color="#6C63FF" />
              <Text className="text-textSecondary text-xs text-center mt-2">Novo Exercício</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(personal)/treinos')}
              className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"
            >
              <Ionicons name="document-text-outline" size={28} color="#6C63FF" />
              <Text className="text-textSecondary text-xs text-center mt-2">Novo Treino</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(personal)/alunos')}
              className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"
            >
              <Ionicons name="person-add-outline" size={28} color="#6C63FF" />
              <Text className="text-textSecondary text-xs text-center mt-2">Novo Aluno</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
