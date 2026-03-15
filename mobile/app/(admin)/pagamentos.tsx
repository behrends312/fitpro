import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';

interface PagamentoPersonal {
  _id: string;
  nome: string;
  email: string;
  valorMensal: number;
  plano: { tipo: string; status: string; dataInicio: string };
}

interface PagamentosData {
  personais: PagamentoPersonal[];
  totalReceita: number;
}

const PLANO_COR: Record<string, string> = {
  basic: '#4ade80', intermediate: '#6C63FF', advanced: '#facc15',
};
const STATUS_COR: Record<string, string> = {
  ativo: '#4ade80', inativo: '#f87171', cancelado: '#9090a8',
};

export default function AdminPagamentosScreen() {
  const { data, isLoading } = useQuery<PagamentosData>({
    queryKey: ['admin-pagamentos'],
    queryFn: () => api.get('/admin/pagamentos').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#facc15" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-4">
          <Text className="text-textPrimary text-2xl font-bold">Pagamentos</Text>
          <Text className="text-textSecondary text-sm">Receita mensal estimada</Text>
        </View>

        {/* Card de receita total */}
        <View className="mx-5 mb-5 bg-warning/10 border border-warning/30 rounded-2xl p-5">
          <View className="flex-row items-center gap-3 mb-2">
            <Ionicons name="cash-outline" size={28} color="#facc15" />
            <Text className="text-warning text-lg font-bold">Receita Mensal</Text>
          </View>
          <Text className="text-textPrimary text-5xl font-bold">
            R$ {data?.totalReceita ?? 0}
          </Text>
          <Text className="text-textSecondary text-sm mt-2">
            {data?.personais.length ?? 0} assinante(s) ativos
          </Text>
          <Text className="text-textMuted text-xs mt-1">* Valores em modo de teste (Stripe)</Text>
        </View>

        {/* Distribuição por plano */}
        <View className="mx-5 mb-5">
          <Text className="text-textPrimary font-bold text-base mb-3">Por plano</Text>
          {(['basic', 'intermediate', 'advanced'] as const).map((tipo) => {
            const count = data?.personais.filter((p) => p.plano.tipo === tipo).length ?? 0;
            const val = { basic: 1, intermediate: 2, advanced: 3 }[tipo];
            const subtotal = count * val;
            const cor = PLANO_COR[tipo];

            return (
              <View key={tipo} className="bg-surface border border-border rounded-xl p-4 mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                  <View>
                    <Text className="text-textPrimary font-semibold capitalize">{tipo}</Text>
                    <Text className="text-textMuted text-xs">{count} assinante(s) × R${val}</Text>
                  </View>
                </View>
                <Text className="text-textPrimary font-bold text-lg">R${subtotal}</Text>
              </View>
            );
          })}
        </View>

        {/* Lista de assinantes */}
        <View className="px-5 mb-8">
          <Text className="text-textPrimary font-bold text-base mb-3">Assinantes ativos</Text>

          {(data?.personais ?? []).length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="card-outline" size={48} color="#2e2e40" />
              <Text className="text-textSecondary text-center mt-3">
                Nenhum assinante pago ainda.
              </Text>
            </View>
          ) : (
            data?.personais.map((p) => {
              const cor = PLANO_COR[p.plano.tipo] ?? '#9090a8';
              const statusCor = STATUS_COR[p.plano.status] ?? '#9090a8';

              return (
                <View key={p._id} className="bg-surface border border-border rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: cor + '20' }}>
                        <Text className="font-bold" style={{ color: cor }}>
                          {(p.nome || p.email)[0].toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold">{p.nome || 'Sem nome'}</Text>
                        <Text className="text-textMuted text-xs">{p.email}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View style={{ backgroundColor: cor + '20' }} className="px-2 py-0.5 rounded-md">
                            <Text className="capitalize text-xs font-semibold" style={{ color: cor }}>{p.plano.tipo}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCor }} />
                            <Text className="text-xs capitalize" style={{ color: statusCor }}>{p.plano.status}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-textPrimary font-bold text-lg">R${p.valorMensal}</Text>
                      <Text className="text-textMuted text-xs">/mês</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
