import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../src/services/api';

interface Plano {
  tipo: string;
  status: string;
  dataInicio: string;
}
interface MeuPerfil {
  nome: string;
  email: string;
  plano: Plano;
}
interface PlanoInfo {
  id: string;
  nome: string;
  valor: number;
  limiteAlunos: number | null;
  descricao: string;
}

const PLANO_CORES: Record<string, { cor: string; bg: string }> = {
  trial: { cor: '#9090a8', bg: '#9090a820' },
  basic: { cor: '#4ade80', bg: '#4ade8020' },
  intermediate: { cor: '#6C63FF', bg: '#6C63FF20' },
  advanced: { cor: '#facc15', bg: '#facc1520' },
};

export default function AssinaturaScreen() {
  const { data: perfil, isLoading } = useQuery<MeuPerfil>({
    queryKey: ['meu-perfil'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const { data: planos = [] } = useQuery<PlanoInfo[]>({
    queryKey: ['planos'],
    queryFn: () => api.get('/stripe/planos').then((r) => r.data),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plano: string) => api.post('/stripe/checkout', { plano }).then((r) => r.data),
    onSuccess: ({ url }) => Linking.openURL(url),
    onError: (err: any) => Alert.alert('Erro', err?.response?.data?.message || 'Erro ao iniciar pagamento.'),
  });

  const cancelarMutation = useMutation({
    mutationFn: () => api.post('/stripe/cancelar'),
    onSuccess: () => Alert.alert('Assinatura cancelada', 'Você foi movido para o plano Trial.'),
    onError: () => Alert.alert('Erro', 'Não foi possível cancelar a assinatura.'),
  });

  const planoAtual = perfil?.plano?.tipo ?? 'trial';
  const corPlanoAtual = PLANO_CORES[planoAtual];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6C63FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#9090a8" />
        </TouchableOpacity>
        <Text className="text-textPrimary text-xl font-bold">Assinatura</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Plano atual */}
        <View className="mx-5 mt-5 mb-6 rounded-2xl border border-border bg-surface p-5">
          <Text className="text-textSecondary text-xs font-semibold tracking-widest uppercase mb-3">Plano atual</Text>
          <View className="flex-row items-center justify-between">
            <View>
              <View style={{ backgroundColor: corPlanoAtual.bg }} className="flex-row items-center self-start px-3 py-1.5 rounded-full mb-2">
                <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: corPlanoAtual.cor }} />
                <Text style={{ color: corPlanoAtual.cor }} className="font-bold capitalize">{planoAtual}</Text>
              </View>
              <Text className="text-textSecondary text-sm capitalize">
                Status: {perfil?.plano?.status ?? 'trial'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={32} color={corPlanoAtual.cor} />
          </View>
        </View>

        {/* Lista de planos */}
        <View className="px-5 mb-10">
          <Text className="text-textPrimary font-bold text-lg mb-1">Planos disponíveis</Text>
          <Text className="text-textSecondary text-sm mb-4">Modo de teste — valores simbólicos</Text>

          {planos.map((plano) => {
            const ePlanoAtual = planoAtual === plano.id;
            const cor = PLANO_CORES[plano.id];

            return (
              <View
                key={plano.id}
                className={`rounded-2xl border p-4 mb-3 ${ePlanoAtual ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cor.cor }} />
                      <Text className="text-textPrimary font-bold text-base">{plano.nome}</Text>
                      {ePlanoAtual && (
                        <View className="bg-primary/20 px-2 py-0.5 rounded-md">
                          <Text className="text-primary text-xs font-semibold">Atual</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-textSecondary text-sm mt-1">{plano.descricao}</Text>
                  </View>
                  <View className="items-end ml-3">
                    {plano.valor === 0 ? (
                      <Text className="text-success text-2xl font-bold">Grátis</Text>
                    ) : (
                      <>
                        <Text className="text-textPrimary text-2xl font-bold">R${plano.valor}</Text>
                        <Text className="text-textMuted text-xs">/mês</Text>
                      </>
                    )}
                  </View>
                </View>

                {!ePlanoAtual && plano.id !== 'trial' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        `Assinar plano ${plano.nome}?`,
                        `R$ ${plano.valor}/mês (modo teste)`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Continuar', onPress: () => checkoutMutation.mutate(plano.id) },
                        ]
                      )
                    }
                    disabled={checkoutMutation.isPending}
                    className="bg-primary rounded-xl py-3 items-center mt-1"
                  >
                    {checkoutMutation.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Assinar agora</Text>
                    )}
                  </TouchableOpacity>
                )}

                {ePlanoAtual && plano.id !== 'trial' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Cancelar assinatura?',
                        'Você voltará para o plano Trial.',
                        [
                          { text: 'Manter', style: 'cancel' },
                          { text: 'Cancelar assinatura', style: 'destructive', onPress: () => cancelarMutation.mutate() },
                        ]
                      )
                    }
                    className="border border-error/30 rounded-xl py-3 items-center mt-1"
                  >
                    <Text className="text-error font-semibold text-sm">Cancelar assinatura</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
