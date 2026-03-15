import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const API_URL = 'http://192.168.1.100:3001';

const PLANO_CORES: Record<string, { cor: string; bg: string }> = {
  trial: { cor: '#9090a8', bg: '#9090a820' },
  basic: { cor: '#4ade80', bg: '#4ade8020' },
  intermediate: { cor: '#6C63FF', bg: '#6C63FF20' },
  advanced: { cor: '#facc15', bg: '#facc1520' },
};

interface MeuPerfil {
  nome: string;
  email: string;
  telefone: string;
  especialidade: string;
  bio: string;
  foto: string | null;
  plano: { tipo: string; status: string };
}

export default function PerfilPersonalScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [bio, setBio] = useState('');

  const { data: perfil, isLoading, refetch } = useQuery<MeuPerfil>({
    queryKey: ['meu-perfil'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    onSuccess: (data) => {
      setNome(data.nome || '');
      setTelefone(data.telefone || '');
      setEspecialidade(data.especialidade || '');
      setBio(data.bio || '');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.patch('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: ({ data }) => {
      updateUser({ nome: data.nome, foto: data.foto });
      refetch();
      setEditando(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    },
    onError: () => Alert.alert('Erro', 'Não foi possível atualizar o perfil.'),
  });

  async function handleSalvar() {
    const formData = new FormData() as any;
    formData.append('nome', nome);
    formData.append('telefone', telefone);
    formData.append('especialidade', especialidade);
    formData.append('bio', bio);
    atualizarMutation.mutate(formData);
  }

  async function handleFoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const formData = new FormData() as any;
      formData.append('foto', { uri: file.uri, type: 'image/jpeg', name: 'foto.jpg' });
      atualizarMutation.mutate(formData);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6C63FF" />
      </SafeAreaView>
    );
  }

  const planoAtual = perfil?.plano?.tipo ?? 'trial';
  const corPlano = PLANO_CORES[planoAtual];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View className="items-center pt-8 pb-6 px-5">
            <TouchableOpacity onPress={handleFoto} className="relative">
              {perfil?.foto ? (
                <Image
                  source={{ uri: `${API_URL}${perfil.foto}` }}
                  className="w-24 h-24 rounded-3xl"
                />
              ) : (
                <View className="w-24 h-24 rounded-3xl bg-primary/20 items-center justify-center">
                  <Text className="text-primary text-4xl font-bold">
                    {(perfil?.nome || user?.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-background">
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>

            <Text className="text-textPrimary text-xl font-bold mt-3">{perfil?.nome || 'Personal Trainer'}</Text>
            <Text className="text-textSecondary text-sm">{perfil?.email}</Text>

            {/* Badge plano */}
            <View style={{ backgroundColor: corPlano.bg }} className="flex-row items-center px-4 py-2 rounded-full mt-3">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: corPlano.cor }} />
              <Text style={{ color: corPlano.cor }} className="font-bold capitalize">Plano {planoAtual}</Text>
            </View>
          </View>

          {/* Dados profissionais */}
          <View className="px-5 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary font-bold text-base">Meus dados</Text>
              <TouchableOpacity
                onPress={() => (editando ? handleSalvar() : setEditando(true))}
                disabled={atualizarMutation.isPending}
                className={`px-4 py-2 rounded-lg ${editando ? 'bg-primary' : 'bg-surface border border-border'}`}
              >
                {atualizarMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className={`text-sm font-semibold ${editando ? 'text-white' : 'text-textSecondary'}`}>
                    {editando ? 'Salvar' : 'Editar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {[
              { label: 'Nome', value: nome, setter: setNome, placeholder: 'Seu nome' },
              { label: 'Telefone', value: telefone, setter: setTelefone, placeholder: '(00) 00000-0000', keyboard: 'phone-pad' as const },
              { label: 'Especialidade', value: especialidade, setter: setEspecialidade, placeholder: 'Ex: Musculação, Crossfit...' },
            ].map((campo) => (
              <View key={campo.label} className="mb-4">
                <Text className="text-textSecondary text-xs font-semibold mb-2 tracking-widest uppercase">{campo.label}</Text>
                <View className={`flex-row items-center border rounded-xl px-4 py-3 ${editando ? 'bg-surface border-primary/50' : 'bg-surface border-border'}`}>
                  <TextInput
                    className="flex-1 text-textPrimary text-base"
                    value={campo.value}
                    onChangeText={campo.setter}
                    placeholder={campo.placeholder}
                    placeholderTextColor="#5a5a70"
                    editable={editando}
                    keyboardType={(campo as any).keyboard || 'default'}
                  />
                </View>
              </View>
            ))}

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-textSecondary text-xs font-semibold mb-2 tracking-widest uppercase">Bio</Text>
              <View className={`border rounded-xl px-4 py-3 ${editando ? 'bg-surface border-primary/50' : 'bg-surface border-border'}`}>
                <TextInput
                  className="text-textPrimary text-base"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Fale sobre você e seu trabalho..."
                  placeholderTextColor="#5a5a70"
                  editable={editando}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Opções */}
          <View className="px-5 mb-10">
            <Text className="text-textSecondary text-xs font-semibold mb-3 tracking-widest uppercase">Configurações</Text>

            <TouchableOpacity
              onPress={() => router.push('/(personal)/assinatura')}
              className="flex-row items-center justify-between bg-surface border border-border rounded-2xl px-4 py-4 mb-3"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center">
                  <Ionicons name="card-outline" size={18} color="#6C63FF" />
                </View>
                <View>
                  <Text className="text-textPrimary font-semibold">Assinatura</Text>
                  <Text className="text-textMuted text-xs capitalize">Plano {planoAtual} · {perfil?.plano?.status ?? 'trial'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5a5a70" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert('Sair', 'Deseja sair da conta?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: logout },
                ])
              }
              className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border border-error/30 bg-error/10"
            >
              <Ionicons name="log-out-outline" size={20} color="#f87171" />
              <Text className="text-error font-semibold">Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
