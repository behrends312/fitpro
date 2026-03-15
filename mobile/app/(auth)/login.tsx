import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), senha);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.';
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
        {/* Header com gradiente */}
        <LinearGradient
          colors={['#6C63FF22', '#0f0f14']}
          className="px-6 pt-20 pb-10 items-center"
        >
          <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-4">
            <Ionicons name="barbell" size={40} color="white" />
          </View>
          <Text className="text-textPrimary text-3xl font-bold">FitPro</Text>
          <Text className="text-textSecondary text-base mt-1">Treine com propósito</Text>
        </LinearGradient>

        {/* Formulário */}
        <View className="flex-1 px-6 pt-6">
          <Text className="text-textPrimary text-2xl font-bold mb-1">Bem-vindo de volta 👋</Text>
          <Text className="text-textSecondary text-sm mb-8">Entre com sua conta para continuar</Text>

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
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 mb-6">
            <Ionicons name="lock-closed-outline" size={18} color="#9090a8" />
            <TextInput
              className="flex-1 text-textPrimary py-4 ml-3 text-base"
              placeholder="••••••••"
              placeholderTextColor="#5a5a70"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!verSenha}
            />
            <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
              <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9090a8" />
            </TouchableOpacity>
          </View>

          {/* Botão entrar */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Link registro */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-textSecondary">Não tem conta? </Text>
            <Link href="/(auth)/register">
              <Text className="text-primary font-semibold">Cadastre-se</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
