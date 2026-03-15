import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const API_URL = 'http://192.168.1.100:3001';

interface MeuPerfil {
  _id: string;
  nome: string;
  email: string;
  telefone: string;
  objetivo: string;
  peso: number | null;
  altura: number | null;
  foto: string | null;
  personalId?: { nome: string; email: string } | null;
}

export default function PerfilAlunoScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');

  const { data: perfil, isLoading, refetch } = useQuery<MeuPerfil>({
    queryKey: ['meu-perfil'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    onSuccess: (data) => {
      setNome(data.nome);
      setTelefone(data.telefone);
      setObjetivo(data.objetivo);
      setPeso(data.peso ? String(data.peso) : '');
      setAltura(data.altura ? String(data.altura) : '');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.patch('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
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
    formData.append('objetivo', objetivo);
    if (peso) formData.append('peso', peso);
    if (altura) formData.append('altura', altura);
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

  const imc = perfil?.peso && perfil?.altura
    ? (perfil.peso / Math.pow(perfil.altura / 100, 2)).toFixed(1)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="items-center pt-8 pb-6 px-5">
          <TouchableOpacity onPress={handleFoto} className="relative">
            {perfil?.foto ? (
              <Image
                source={{ uri: `${API_URL}${perfil.foto}` }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center">
                <Text className="text-primary text-4xl font-bold">
                  {(perfil?.nome || user?.email || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-background">
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <Text className="text-textPrimary text-xl font-bold mt-3">{perfil?.nome || 'Sem nome'}</Text>
          <Text className="text-textSecondary text-sm">{perfil?.email}</Text>

          {perfil?.personalId && (
            <View className="flex-row items-center gap-2 mt-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <Ionicons name="person-outline" size={14} color="#6C63FF" />
              <Text className="text-primary text-xs font-semibold">
                Personal: {(perfil.personalId as any).nome}
              </Text>
            </View>
          )}
        </View>

        {/* Stats físicos */}
        {(perfil?.peso || perfil?.altura) && (
          <View className="flex-row mx-5 gap-3 mb-5">
            {perfil.peso && (
              <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
                <Ionicons name="scale-outline" size={20} color="#9090a8" />
                <Text className="text-textPrimary text-2xl font-bold mt-1">{perfil.peso}</Text>
                <Text className="text-textMuted text-xs">kg</Text>
              </View>
            )}
            {perfil.altura && (
              <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
                <Ionicons name="resize-outline" size={20} color="#9090a8" />
                <Text className="text-textPrimary text-2xl font-bold mt-1">{perfil.altura}</Text>
                <Text className="text-textMuted text-xs">cm</Text>
              </View>
            )}
            {imc && (
              <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
                <Ionicons name="fitness-outline" size={20} color="#9090a8" />
                <Text className="text-textPrimary text-2xl font-bold mt-1">{imc}</Text>
                <Text className="text-textMuted text-xs">IMC</Text>
              </View>
            )}
          </View>
        )}

        {/* Formulário */}
        <View className="px-5 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-textPrimary font-bold text-base">Meus dados</Text>
            <TouchableOpacity
              onPress={() => (editando ? handleSalvar() : setEditando(true))}
              disabled={atualizarMutation.isPending}
              className={`px-4 py-2 rounded-lg ${editando ? 'bg-primary' : 'bg-surfaceLight'}`}
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
            { label: 'Objetivo', value: objetivo, setter: setObjetivo, placeholder: 'Ex: Ganhar massa muscular' },
            { label: 'Peso (kg)', value: peso, setter: setPeso, placeholder: '70', keyboard: 'numeric' as const },
            { label: 'Altura (cm)', value: altura, setter: setAltura, placeholder: '175', keyboard: 'numeric' as const },
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

          {/* Botão sair */}
          <TouchableOpacity
            onPress={() => Alert.alert('Sair', 'Deseja sair da conta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: logout },
            ])}
            className="flex-row items-center justify-center gap-2 mt-4 py-4 rounded-xl border border-error/30 bg-error/10"
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
