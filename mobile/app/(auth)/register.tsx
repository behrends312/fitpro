import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, UserRole } from '../../src/store/authStore';

type Papel = { label: string; value: UserRole; icon: keyof typeof Ionicons.glyphMap; desc: string };

const PAPEIS: Papel[] = [
  { label: 'Sou Aluno', value: 'aluno', icon: 'person-outline', desc: 'Acompanhe seus treinos e evolução' },
  { label: 'Sou Personal', value: 'personal', icon: 'barbell-outline', desc: 'Gerencie seus alunos e treinos' },
];

export default function RegisterScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  async function handleRegister() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      setLoading(true);
      await register(email.trim().toLowerCase(), senha, role, nome.trim());
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-16 pb-10">
          {/* Volta */}
          <Link href="/(auth)/login" className="mb-8">
            <Ionicons name="arrow-back" size={24} color="#9090a8" />
          </Link>

          <Text className="text-textPrimary text-2xl font-bold mb-1">Criar conta</Text>
          <Text className="text-textSecondary text-sm mb-8">Comece sua jornada hoje</Text>

          {/* Seleção de papel */}
          <Text className="text-textSecondary text-xs font-semibold mb-3 tracking-widest uppercase">Eu sou...</Text>
          <View className="flex-row gap-3 mb-6">
            {PAPEIS.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setRole(p.value)}
                className={`flex-1 p-4 rounded-xl border ${role === p.value ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
              >
                <Ionicons
                  name={p.icon}
                  size={24}
                  color={role === p.value ? '#6C63FF' : '#9090a8'}
                  style={{ marginBottom: 8 }}
                />
                <Text className={`font-bold text-sm ${role === p.value ? 'text-primary' : 'text-textSecondary'}`}>
                  {p.label}
                </Text>
                <Text className="text-textMuted text-xs mt-1">{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nome */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 tracking-widest uppercase">Nome</Text>
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 mb-4">
            <Ionicons name="person-outline" size={18} color="#9090a8" />
            <TextInput
              className="flex-1 text-textPrimary py-4 ml-3 text-base"
              placeholder="Seu nome completo"
              placeholderTextColor="#5a5a70"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
          </View>

          {/* E-mail */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 tracking-widest uppercase">E-mail</Text>
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 mb-4">
            <Ionicons name="mail-outline" size={18} color="#9090a8" />
            <TextInput
              className="flex-1 text-textPrimary py-4 ml-3 text-base"
              placeholder="seu@email.com"
              placeholderTextColor="#5a5a70"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Senha */}
          <Text className="text-textSecondary text-xs font-semibold mb-2 tracking-widest uppercase">Senha</Text>
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 mb-8">
            <Ionicons name="lock-closed-outline" size={18} color="#9090a8" />
            <TextInput
              className="flex-1 text-textPrimary py-4 ml-3 text-base"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#5a5a70"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!verSenha}
            />
            <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
              <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9090a8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Criar conta</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-textSecondary">Já tem conta? </Text>
            <Link href="/(auth)/login">
              <Text className="text-primary font-semibold">Entrar</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
