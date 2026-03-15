import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';

const { width: SCREEN_W } = Dimensions.get('window');

interface ResumoData {
  totalSessoes: number;
  ultimasSessoes: Array<{
    _id: string;
    treino: { nome: string; tipo: string };
    dataFim: string;
    duracaoSegundos: number;
  }>;
  prs: Array<{
    _id: string;
    exercicio: { nome: string };
    cargaMaxima: number;
    volumeTotal: number;
    ultimaData: string;
  }>;
  treinosPorDia: Array<{ _id: string; count: number }>;
}

function BarraSemana({ dados }: { dados: Array<{ _id: string; count: number }> }) {
  const maxCount = Math.max(...dados.map((d) => d.count), 1);
  const barW = Math.floor((SCREEN_W - 80) / 7);

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const hoje = new Date();
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <View className="flex-row items-end justify-between h-20">
      {ultimos7.map((dia, i) => {
        const registro = dados.find((d) => d._id === dia);
        const count = registro?.count ?? 0;
        const pct = count / maxCount;
        const diaSemana = new Date(dia + 'T00:00:00').getDay();

        return (
          <View key={dia} className="items-center" style={{ width: barW }}>
            <View className="flex-1 w-full items-center justify-end">
              <View
                className={`rounded-t-sm ${count > 0 ? 'bg-primary' : 'bg-surfaceLight'}`}
                style={{ width: barW - 6, height: Math.max(4, 56 * pct) }}
              />
            </View>
            <Text className="text-textMuted text-xs mt-1">{diasSemana[diaSemana]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CardPR({ pr }: { pr: ResumoData['prs'][0] }) {
  const data = new Date(pr.ultimaData).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mr-3" style={{ width: 160 }}>
      <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
        <Ionicons name="trophy-outline" size={20} color="#6C63FF" />
      </View>
      <Text className="text-textSecondary text-xs mb-1" numberOfLines={1}>{pr.exercicio.nome}</Text>
      <Text className="text-textPrimary text-2xl font-bold">{pr.cargaMaxima}kg</Text>
      <Text className="text-textMuted text-xs mt-1">{data}</Text>
    </View>
  );
}

export default function ProgressoScreen() {
  const { data, isLoading } = useQuery<ResumoData>({
    queryKey: ['progresso-resumo'],
    queryFn: () => api.get('/progresso/resumo').then((r) => r.data),
  });

  const formatDuracao = (seg: number) => {
    const min = Math.floor(seg / 60);
    return `${min}min`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6C63FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-textPrimary text-2xl font-bold">Meu Progresso</Text>
          <Text className="text-textSecondary text-sm">Acompanhe sua evolução</Text>
        </View>

        {/* Stats rápidos */}
        <View className="flex-row px-5 gap-3 mt-4">
          <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
            <Ionicons name="flash-outline" size={22} color="#6C63FF" />
            <Text className="text-textPrimary text-3xl font-bold mt-2">{data?.totalSessoes ?? 0}</Text>
            <Text className="text-textSecondary text-xs mt-1">Treinos totais</Text>
          </View>
          <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
            <Ionicons name="trophy-outline" size={22} color="#facc15" />
            <Text className="text-textPrimary text-3xl font-bold mt-2">{data?.prs.length ?? 0}</Text>
            <Text className="text-textSecondary text-xs mt-1">Recordes (PRs)</Text>
          </View>
        </View>

        {/* Frequência últimos 7 dias */}
        <View className="mx-5 mt-5 bg-surface border border-border rounded-2xl p-5">
          <Text className="text-textPrimary font-bold text-base mb-4">Frequência — últimos 7 dias</Text>
          {data?.treinosPorDia && data.treinosPorDia.length > 0 ? (
            <BarraSemana dados={data.treinosPorDia} />
          ) : (
            <View className="h-20 items-center justify-center">
              <Text className="text-textMuted text-sm">Nenhum treino esta semana</Text>
            </View>
          )}
        </View>

        {/* PRs */}
        {data?.prs && data.prs.length > 0 && (
          <View className="mt-5">
            <Text className="text-textPrimary font-bold text-base px-5 mb-3">Seus recordes pessoais 🏆</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
              {data.prs.map((pr) => <CardPR key={pr._id} pr={pr} />)}
            </ScrollView>
          </View>
        )}

        {/* Histórico recente */}
        <View className="px-5 mt-5 mb-8">
          <Text className="text-textPrimary font-bold text-base mb-3">Histórico recente</Text>
          {data?.ultimasSessoes && data.ultimasSessoes.length > 0 ? (
            data.ultimasSessoes.map((sessao) => (
              <View key={sessao._id} className="bg-surface border border-border rounded-2xl p-4 mb-3">
                <View className="flex-row justify-between items-center">
                  <View>
                    <View className="bg-primary/20 px-2 py-0.5 rounded-md self-start mb-1">
                      <Text className="text-primary text-xs font-bold">Treino {sessao.treino.tipo}</Text>
                    </View>
                    <Text className="text-textPrimary font-semibold">{sessao.treino.nome}</Text>
                    <Text className="text-textMuted text-xs mt-0.5">
                      {new Date(sessao.dataFim).toLocaleDateString('pt-BR', {
                        weekday: 'short', day: '2-digit', month: 'short',
                      })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Ionicons name="time-outline" size={16} color="#9090a8" />
                    <Text className="text-textSecondary text-sm mt-1">
                      {formatDuracao(sessao.duracaoSegundos)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="py-10 items-center">
              <Ionicons name="calendar-outline" size={40} color="#2e2e40" />
              <Text className="text-textSecondary text-center mt-3">
                Nenhum treino concluído ainda.{'\n'}Comece agora na aba Treino!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
