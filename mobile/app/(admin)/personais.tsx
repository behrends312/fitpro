import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, FlatList, Modal, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';

interface Personal {
  _id: string;
  nome: string;
  email: string;
  ativo: boolean;
  totalAlunos: number;
  createdAt: string;
  plano: { tipo: string; status: string };
}

const PLANO_COR: Record<string, string> = {
  trial: '#9090a8', basic: '#4ade80', intermediate: '#6C63FF', advanced: '#facc15',
};
const PLANOS_OPCOES = ['trial', 'basic', 'intermediate', 'advanced'];

function ModalDetalhePersonal({ personal, onFechar }: { personal: Personal | null; onFechar: () => void }) {
  const [planoSel, setPlanoSel] = useState(personal?.plano?.tipo ?? 'trial');
  const queryClient = useQueryClient();

  const atualizarMutation = useMutation({
    mutationFn: (dados: any) => api.patch(`/admin/personais/${personal!._id}`, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personais'] });
      Alert.alert('Atualizado!', 'Dados do personal salvos.');
    },
  });

  const desativarMutation = useMutation({
    mutationFn: () => api.delete(`/admin/personais/${personal!._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personais'] });
      onFechar();
      Alert.alert('Personal desativado');
    },
  });

  if (!personal) return null;

  return (
    <Modal visible={!!personal} transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-surface rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-textPrimary text-xl font-bold">{personal.nome || 'Personal'}</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={24} color="#9090a8" />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="bg-background border border-border rounded-xl p-4 mb-5">
            <Text className="text-textSecondary text-xs">{personal.email}</Text>
            <View className="flex-row gap-4 mt-2">
              <Text className="text-textPrimary text-sm">
                <Text className="text-textMuted">Alunos: </Text>
                {personal.totalAlunos}
              </Text>
              <Text className="text-textPrimary text-sm">
                <Text className="text-textMuted">Cadastro: </Text>
                {new Date(personal.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>

          {/* Alterar plano manualmente */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 uppercase tracking-widest">Plano (admin override)</Text>
          <View className="flex-row gap-2 mb-5 flex-wrap">
            {PLANOS_OPCOES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPlanoSel(p)}
                className={`px-4 py-2 rounded-lg border ${planoSel === p ? 'bg-primary border-primary' : 'bg-background border-border'}`}
              >
                <Text className={`capitalize font-semibold ${planoSel === p ? 'text-white' : 'text-textSecondary'}`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => atualizarMutation.mutate({ plano: { tipo: planoSel, status: 'ativo' } })}
            disabled={atualizarMutation.isPending}
            className="bg-primary rounded-xl py-3.5 items-center mb-3"
          >
            {atualizarMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Salvar alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Desativar personal?', 'O personal não poderá mais acessar a plataforma.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Desativar', style: 'destructive', onPress: () => desativarMutation.mutate() },
              ])
            }
            className="border border-error/30 rounded-xl py-3.5 items-center"
          >
            <Text className="text-error font-semibold">Desativar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminPersonaisScreen() {
  const [busca, setBusca] = useState('');
  const [personalSel, setPersonalSel] = useState<Personal | null>(null);

  const { data: personais = [], isLoading } = useQuery<Personal[]>({
    queryKey: ['admin-personais', busca],
    queryFn: () => api.get('/admin/personais', { params: busca ? { busca } : {} }).then((r) => r.data),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-4">
        <Text className="text-textPrimary text-2xl font-bold">Personais</Text>
        <Text className="text-textSecondary text-sm">{personais.length} cadastrado(s)</Text>
      </View>

      <View className="mx-5 mb-4 flex-row items-center bg-surface border border-border rounded-xl px-4">
        <Ionicons name="search-outline" size={18} color="#9090a8" />
        <TextInput
          className="flex-1 text-textPrimary py-3.5 ml-3 text-base"
          placeholder="Buscar personal..."
          placeholderTextColor="#5a5a70"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#facc15" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={personais}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-textSecondary">Nenhum personal encontrado.</Text>
            </View>
          }
          renderItem={({ item: personal }) => {
            const cor = PLANO_COR[personal.plano?.tipo ?? 'trial'];
            return (
              <TouchableOpacity
                onPress={() => setPersonalSel(personal)}
                className={`bg-surface border rounded-2xl p-4 mb-3 ${personal.ativo ? 'border-border' : 'border-error/30'}`}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: cor + '20' }}>
                    <Text className="font-bold text-lg" style={{ color: cor }}>
                      {(personal.nome || personal.email)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-textPrimary font-bold">{personal.nome || 'Sem nome'}</Text>
                      {!personal.ativo && (
                        <View className="bg-error/10 px-2 py-0.5 rounded-md">
                          <Text className="text-error text-xs">Inativo</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-textMuted text-xs">{personal.email}</Text>
                    <View className="flex-row items-center gap-3 mt-1">
                      <View style={{ backgroundColor: cor + '20' }} className="px-2 py-0.5 rounded-md">
                        <Text className="capitalize text-xs font-semibold" style={{ color: cor }}>
                          {personal.plano?.tipo ?? 'trial'}
                        </Text>
                      </View>
                      <Text className="text-textMuted text-xs">{personal.totalAlunos} aluno(s)</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#5a5a70" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <ModalDetalhePersonal personal={personalSel} onFechar={() => setPersonalSel(null)} />
    </SafeAreaView>
  );
}
