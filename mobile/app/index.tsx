import { ActivityIndicator, View } from 'react-native';

// Esta tela é apenas um placeholder enquanto o _layout.tsx redireciona
// baseado no estado de autenticação
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f14', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );
}
