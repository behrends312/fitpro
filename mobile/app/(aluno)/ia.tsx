import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';

const STORAGE_KEY = 'ia_conversas_aluno';

interface Mensagem {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface Conversa {
  id: string;
  titulo: string;
  mensagens: Mensagem[];
  ultimaAtualizacao: string;
}

const SUGESTOES = [
  'Como faço um agachamento corretamente?',
  'Qual é a diferença entre bíceps e tríceps?',
  'Quanto tempo devo descansar entre as séries?',
  'O que é progressão de carga e por que é importante?',
];

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function AlunoIAScreen() {
  const [tela, setTela] = useState<'lista' | 'chat'>('lista');
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Carregar conversas salvas
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setConversas(JSON.parse(raw));
    });
  }, []);

  async function salvarConversas(lista: Conversa[]) {
    setConversas(lista);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function abrirConversa(conversa: Conversa) {
    setConversaAtual(conversa);
    setTela('chat');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }

  function novaConversa() {
    const nova: Conversa = {
      id: gerarId(),
      titulo: 'Nova conversa',
      mensagens: [],
      ultimaAtualizacao: new Date().toISOString(),
    };
    setConversaAtual(nova);
    setTela('chat');
  }

  function voltar() {
    setTela('lista');
    setConversaAtual(null);
    setInput('');
  }

  async function excluirConversa(id: string) {
    Alert.alert('Excluir conversa', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const nova = conversas.filter((c) => c.id !== id);
          await salvarConversas(nova);
        },
      },
    ]);
  }

  const chatMutation = useMutation({
    mutationFn: (msgs: Mensagem[]) =>
      api.post('/ia/chat', {
        mensagens: msgs.map((m) => ({ role: m.role, content: m.content })),
        contexto: 'aluno',
      }).then((r) => r.data.resposta as string),
    onSuccess: async (resposta) => {
      const nova: Mensagem = { id: gerarId(), role: 'model', content: resposta };
      const novasMensagens = [...(conversaAtual?.mensagens ?? []), nova];

      const atualizada: Conversa = {
        ...conversaAtual!,
        mensagens: novasMensagens,
        ultimaAtualizacao: new Date().toISOString(),
      };
      setConversaAtual(atualizada);

      const existe = conversas.find((c) => c.id === atualizada.id);
      const novaLista = existe
        ? conversas.map((c) => (c.id === atualizada.id ? atualizada : c))
        : [atualizada, ...conversas];
      await salvarConversas(novaLista);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () =>
      Alert.alert('Erro', 'Falha ao comunicar com a IA. Tente novamente.'),
  });

  const enviar = useCallback(async (texto?: string) => {
    const conteudo = (texto ?? input).trim();
    if (!conteudo || !conversaAtual) return;

    const novaMsg: Mensagem = { id: gerarId(), role: 'user', content: conteudo };
    const novasMensagens = [...conversaAtual.mensagens, novaMsg];

    // Titulo = primeira mensagem
    const titulo = conversaAtual.mensagens.length === 0
      ? conteudo.slice(0, 50)
      : conversaAtual.titulo;

    const atualizada: Conversa = {
      ...conversaAtual,
      titulo,
      mensagens: novasMensagens,
      ultimaAtualizacao: new Date().toISOString(),
    };
    setConversaAtual(atualizada);
    setInput('');

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    chatMutation.mutate(novasMensagens);
  }, [input, conversaAtual, conversas]);

  // ── TELA: LISTA ──────────────────────────────────────────────────────────
  if (tela === 'lista') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2e2e40' }}>
          <Ionicons name="sparkles" size={22} color="#6C63FF" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 10, flex: 1 }}>Assistente Fit</Text>
          <TouchableOpacity
            onPress={novaConversa}
            style={{ backgroundColor: '#6C63FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Nova</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {conversas.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="sparkles" size={34} color="#6C63FF" />
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Olá! Posso te ajudar 💪</Text>
              <Text style={{ color: '#9090a8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Tire dúvidas sobre exercícios, técnicas e muito mais.
              </Text>
              {SUGESTOES.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { novaConversa(); setTimeout(() => enviar(s), 100); }}
                  style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6C63FF" />
                  <Text style={{ color: '#c0c0d8', fontSize: 13, lineHeight: 20, flex: 1 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            conversas.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => abrirConversa(c)}
                style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#6C63FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{c.titulo}</Text>
                  <Text style={{ color: '#9090a8', fontSize: 12, marginTop: 2 }}>
                    {c.mensagens.length} mensagens · {new Date(c.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => excluirConversa(c.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={18} color="#5a5a70" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── TELA: CHAT ───────────────────────────────────────────────────────────
  const mensagens = conversaAtual?.mensagens ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#13131f' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2e2e40', gap: 12 }}>
        <TouchableOpacity onPress={voltar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#9090a8" />
        </TouchableOpacity>
        <Ionicons name="sparkles" size={20} color="#6C63FF" />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {conversaAtual?.titulo || 'Nova conversa'}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {mensagens.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#9090a8', fontSize: 14, textAlign: 'center' }}>
                Pergunte qualquer coisa sobre treino e exercícios!
              </Text>
              <View style={{ marginTop: 20, width: '100%', gap: 8 }}>
                {SUGESTOES.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => enviar(s)}
                    style={{ backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2e2e40', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6C63FF" />
                    <Text style={{ color: '#c0c0d8', fontSize: 13, flex: 1 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {mensagens.map((msg) => (
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
                paddingHorizontal: 16, paddingVertical: 12,
                borderWidth: msg.role === 'model' ? 1 : 0,
                borderColor: '#2e2e40',
              }}>
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
              </View>
            </View>
          ))}

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
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: input.trim() && !chatMutation.isPending ? '#6C63FF' : '#2e2e40',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() && !chatMutation.isPending ? '#fff' : '#5a5a70'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
