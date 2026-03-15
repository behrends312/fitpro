import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

interface DashboardData {
  totais: {
    totalPersonais: number;
    totalAlunos: number;
    totalSessoes: number;
    personaisAtivos: number;
  };
  porPlano: Array<{ _id: string; count: number }>;
  novosPersonais: number;
}

const PLANO_COR: Record<string, string> = {
  trial: '#9090a8',
  basic: '#4ade80',
  intermediate: '#6C63FF',
  advanced: '#facc15',
};

function StatCard({
  label, valor, icon, cor, onPress,
}: {
  label: string;
  valor: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  cor: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-surface border border-border rounded-2xl p-4"
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: cor + '22' }}>
        <Ionicons name={icon} size={20} color={cor} />
      </View>
      <Text className="text-textPrimary text-3xl font-bold">{valor}</Text>
      <Text className="text-textSecondary text-xs mt-1">{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuthStore();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#facc15" />
      </SafeAreaView>
    );
  }

  const totalReceita = (data?.porPlano ?? []).reduce((acc, p) => {
    const vals: Record<string, number> = { basic: 1, intermediate: 2, advanced: 3 };
    return acc + (vals[p._id] ?? 0) * p.count;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6 flex-row justify-between items-center">
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-warning/20 px-3 py-1 rounded-full">
                <Text className="text-warning text-xs font-bold">👑 Admin</Text>
              </View>
            </View>
            <Text className="text-textPrimary text-2xl font-bold">Painel de Gestão</Text>
            <Text className="text-textSecondary text-sm">Visão completa da plataforma</Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-surface border border-border p-3 rounded-xl">
            <Ionicons name="log-out-outline" size={20} color="#9090a8" />
          </TouchableOpacity>
        </View>

        {/* Stats principais */}
        <View className="px-5">
          <View className="flex-row gap-3 mb-3">
            <StatCard
              label="Personais"
              valor={data?.totais.totalPersonais ?? 0}
              icon="people-circle-outline"
              cor="#6C63FF"
              onPress={() => router.push('/(admin)/personais')}
            />
            <StatCard
              label="Alunos totais"
              valor={data?.totais.totalAlunos ?? 0}
              icon="people-outline"
              cor="#4ade80"
              onPress={() => router.push('/(admin)/alunos')}
            />
          </View>
          <View className="flex-row gap-3 mb-5">
            <StatCard
              label="Treinos realizados"
              valor={data?.totais.totalSessoes ?? 0}
              icon="barbell-outline"
              cor="#FF6584"
            />
            <StatCard
              label="Receita/mês (est.)"
              valor={`R$${totalReceita}`}
              icon="cash-outline"
              cor="#facc15"
              onPress={() => router.push('/(admin)/pagamentos')}
            />
          </View>

          {/* Novos personais */}
          {(data?.novosPersonais ?? 0) > 0 && (
            <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-5 flex-row items-center">
              <Ionicons name="trending-up" size={24} color="#6C63FF" />
              <View className="ml-3">
                <Text className="text-textPrimary font-bold">
                  +{data?.novosPersonais} novo(s) personal(is)
                </Text>
                <Text className="text-textSecondary text-xs">nos últimos 30 dias</Text>
              </View>
            </View>
          )}

          {/* Distribuição por plano */}
          <Text className="text-textPrimary font-bold text-base mb-3">Personais por plano</Text>
          <View className="bg-surface border border-border rounded-2xl p-5 mb-5">
            {(data?.porPlano ?? []).length === 0 ? (
              <Text className="text-textMuted text-center py-4">Nenhum dado ainda</Text>
            ) : (
              data?.porPlano.map((p) => {
                const total = data.totais.totalPersonais || 1;
                const pct = (p.count / total) * 100;
                const cor = PLANO_COR[p._id] ?? '#9090a8';
                const vals: Record<string, number> = { basic: 1, intermediate: 2, advanced: 3 };
                const receita = (vals[p._id] ?? 0) * p.count;

                return (
                  <View key={p._id} className="mb-4 last:mb-0">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
                        <Text className="text-textSecondary text-sm capitalize font-medium">{p._id}</Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Text className="text-textMuted text-xs">R${receita}/mês</Text>
                        <Text className="text-textPrimary font-bold">{p.count}</Text>
                      </View>
                    </View>
                    <View className="h-2 bg-surfaceLight rounded-full">
                      <View
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cor }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
