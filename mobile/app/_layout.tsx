import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

// Remove o highlight/escurecimento nativo do iOS quando o dedo passa sobre um input durante scroll
if (TextInput.defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.style = [{ backgroundColor: 'transparent' }];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
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

    // Redireciona para a área correta conforme o role
    if (user?.role === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (user?.role === 'personal') {
      router.replace('/(personal)/dashboard');
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
