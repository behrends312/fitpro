import { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import api from '../../src/services/api';

interface Mensagem {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const SUGESTOES = [
  'Como faço um agachamento corretamente?',
  'Qual é a diferença entre bíceps e tríceps?',
  'Quanto tempo devo descansar entre as séries?',
  'O que é progressão de carga e por que é importante?',
  'Posso treinar com dor muscular do dia anterior?',
];

export default function AlunoIAScreen() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const chatMutation = useMutation({
    mutationFn: (msgs: Mensagem[]) =>
      api.post('/ia/chat', {
        mensagens: msgs.map((m) => ({ role: m.role, content: m.content })),
        contexto: 'aluno',
      }).then((r) => r.data.resposta as string),
    onSuccess: (resposta) => {
      const nova: Mensagem = { id: Date.now().toString(), role: 'model', content: resposta };
      setMensagens((prev) => [...prev, nova]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const enviar = useCallback((texto?: string) => {
    const conteudo = (texto ?? input).trim();
    if (!conteudo) return;

    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: conteudo };
    const novaLista = [...mensagens, nova];
    setMensagens(novaLista);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    chatMutation.mutate(novaLista);
  }, [input, mensagens]);

  const limpar = () => setMensagens([]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}>
        <Ionicons name="sparkles" size={22} color="#6C63FF" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Assistente Fit</Text>
          <Text style={{ color: '#9090a8', fontSize: 12 }}>Tire suas dúvidas sobre treino e exercícios</Text>
        </View>
        {mensagens.length > 0 && (
          <TouchableOpacity onPress={limpar} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={20} color="#9090a8" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {mensagens.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="sparkles" size={34} color="#6C63FF" />
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Olá! Posso te ajudar 💪</Text>
              <Text style={{ color: '#9090a8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Tire dúvidas sobre exercícios, técnicas, descanso e muito mais. Estou aqui para te ajudar a evoluir!
              </Text>
              {SUGESTOES.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => enviar(s)}
                  style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6C63FF" />
                  <Text style={{ color: '#c0c0d8', fontSize: 13, lineHeight: 20, flex: 1 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            mensagens.map((msg) => (
              <View key={msg.id} style={{ marginBottom: 16, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'model' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="sparkles" size={12} color="#6C63FF" />
                    </View>
                    <Text style={{ color: '#9090a8', fontSize: 11 }}>Assistente Fit</Text>
                  </View>
                )}
                <View style={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#6C63FF' : '#1e1e2e',
                  borderRadius: 18,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                  borderBottomLeftRadius: msg.role === 'model' ? 4 : 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: msg.role === 'model' ? 1 : 0,
                  borderColor: '#2e2e40',
                }}>
                  <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
                </View>
              </View>
            ))
          )}

          {chatMutation.isPending && (
            <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(108,99,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="sparkles" size={12} color="#6C63FF" />
                </View>
                <Text style={{ color: '#9090a8', fontSize: 11 }}>Assistente Fit</Text>
              </View>
              <View style={{ backgroundColor: '#1e1e2e', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: '#2e2e40', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text style={{ color: '#9090a8', fontSize: 14 }}>Pensando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2e2e40', flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 20, borderWidth: 1, borderColor: '#2e2e40', paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pergunte sobre treino, exercícios..."
              placeholderTextColor="#5a5a70"
              multiline
              style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}
              onSubmitEditing={() => enviar()}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => enviar()}
            disabled={!input.trim() || chatMutation.isPending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() && !chatMutation.isPending ? '#6C63FF' : '#2e2e40',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() && !chatMutation.isPending ? '#fff' : '#5a5a70'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
