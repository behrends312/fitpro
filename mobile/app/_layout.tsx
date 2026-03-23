import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';

// Remove o efeito de escurecimento ao tocar em qualquer botão do app
(TouchableOpacity as any).defaultProps = {
  ...((TouchableOpacity as any).defaultProps ?? {}),
  activeOpacity: 1,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 0 },
  },
});

export default function RootLayout() {
  const { loadFromStorage, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (user?.role === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (user?.role === 'personal') {
      router.replace('/(personal)/dashboard');
    } else if (!user?.anamneseConcluida) {
      router.replace('/(aluno)/anamnese' as any);
    } else {
      router.replace('/(aluno)/treino');
    }
  }, [isLoading, isAuthenticated, user?.role]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#0f0f14" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f14' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(aluno)" />
          <Stack.Screen name="(personal)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
