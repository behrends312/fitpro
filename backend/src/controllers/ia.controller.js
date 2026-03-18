const { GoogleGenerativeAI } = require('@google/generative-ai');
const Treino = require('../models/Treino');
const Exercicio = require('../models/Exercicio');
const User = require('../models/User');

function getModel(systemInstruction) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY não configurada. Obtenha uma chave gratuita em https://aistudio.google.com/apikey');
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });
}

const SYSTEM_PERSONAL = `Você é um assistente especialista em prescrição de treinos para personal trainers. Responda SEMPRE em português brasileiro.

Quando solicitado a criar um plano de treino, responda com:
1. Uma breve explicação do plano
2. Um bloco JSON exatamente assim:

\`\`\`json
{
  "plano": {
    "nome": "Nome do plano",
    "descricao": "Descrição geral",
    "periodizacao": "Como funciona a periodização",
    "progressao": "Como progredir ao longo das semanas"
  },
  "treinos": [
    {
      "nome": "Treino A - Peito e Tríceps",
      "tipo": "A",
      "diasSemana": ["seg", "qui"],
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "musculosPrincipais": ["peitoral"],
          "series": 4,
          "reps": "8-12",
          "carga": 60,
          "descanso": 90,
          "observacoes": "Controle a descida em 3s"
        }
      ]
    }
  ]
}
\`\`\`

Regras para o JSON:
- diasSemana: seg, ter, qua, qui, sex, sab, dom
- carga em kg (número)
- descanso em segundos
- 4-8 exercícios por treino

Para perguntas gerais sobre treino, responda normalmente sem JSON.`;

const SYSTEM_ALUNO = `Você é um assistente de fitness amigável e motivador para alunos de academia. Responda SEMPRE em português brasileiro, de forma clara, simples e encorajadora.

Você pode ajudar com:
- Explicar exercícios e técnicas corretas de execução
- Tirar dúvidas sobre treinos e grupos musculares
- Dicas de nutrição básica e recuperação
- Motivação e progressão nos exercícios

Seja conciso mas completo. Use emojis ocasionalmente para tornar a conversa mais agradável. Não prescreva medicamentos ou suplementos específicos.`;

// POST /ia/chat — conversacional para personal e aluno
async function chat(req, res, next) {
  try {
    const { mensagens, contexto } = req.body;

    if (!mensagens || !mensagens.length) {
      return res.status(400).json({ message: 'Mensagens são obrigatórias.' });
    }

    const systemInstruction = contexto === 'aluno' ? SYSTEM_ALUNO : SYSTEM_PERSONAL;
    const model = getModel(systemInstruction);

    // Histórico = todas menos a última mensagem
    const history = mensagens.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const ultimaMensagem = mensagens[mensagens.length - 1].content;
    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(ultimaMensagem);
    const resposta = result.response.text();

    res.json({ resposta });
  } catch (err) {
    next(err);
  }
}

// POST /ia/salvar-plano — salva o plano gerado pelo chat para um aluno
async function salvarPlanoChat(req, res, next) {
  try {
    const { planoJson, alunoId } = req.body;

    if (!planoJson || !alunoId) {
      return res.status(400).json({ message: 'planoJson e alunoId são obrigatórios.' });
    }

    const aluno = await User.findOne({ _id: alunoId, personalId: req.user.id });
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    const treinosSalvos = [];

    for (const t of planoJson.treinos) {
      const exerciciosSalvos = [];

      for (const ex of t.exercicios) {
        let exercicio = await Exercicio.findOne({ nome: { $regex: new RegExp(`^${ex.nome}$`, 'i') } });
        if (!exercicio) {
          exercicio = await Exercicio.create({
            nome: ex.nome,
            musculosPrincipais: ex.musculosPrincipais || [],
            equipamento: 'outro',
            dificuldade: 'intermediario',
            criadoPor: req.user.id,
            publica: false,
          });
        }
        exerciciosSalvos.push({
          exercicio: exercicio._id,
          series: ex.series || 3,
          reps: ex.reps || '10',
          carga: ex.carga || 0,
          descanso: ex.descanso || 60,
          observacoes: ex.observacoes || '',
        });
      }

      const treino = await Treino.create({
        nome: t.nome,
        tipo: t.tipo || 'A',
        descricao: planoJson.plano?.descricao || '',
        aluno: alunoId,
        personal: req.user.id,
        exercicios: exerciciosSalvos,
        diasSemana: t.diasSemana || [],
      });

      treinosSalvos.push(treino);
    }

    res.status(201).json({
      message: `${treinosSalvos.length} treino(s) salvos para ${aluno.nome}.`,
      treinos: treinosSalvos,
    });
  } catch (err) {
    next(err);
  }
}

// POST /ia/gerar-treino — mantido para retrocompatibilidade (migrado para Gemini)
async function gerarTreino(req, res, next) {
  try {
    const { alunoId, altura, peso, objetivo, diasTreino, nivel, equipamentos, salvar } = req.body;

    if (!altura || !peso || !objetivo || !diasTreino) {
      return res.status(400).json({ message: 'Altura, peso, objetivo e dias de treino são obrigatórios.' });
    }

    let alunoNome = 'Aluno';
    if (alunoId) {
      const aluno = await User.findOne({ _id: alunoId, personalId: req.user.id });
      if (aluno) alunoNome = aluno.nome || 'Aluno';
    }

    const equipStr = equipamentos?.length ? equipamentos.join(', ') : 'academia completa';
    const prompt = `Crie um plano de treino completo para:\n- Aluno: ${alunoNome}\n- Altura: ${altura}cm, Peso: ${peso}kg\n- Objetivo: ${objetivo}\n- Dias/semana: ${diasTreino}, Nível: ${nivel || 'intermediário'}\n- Equipamentos: ${equipStr}`;

    const model = getModel(SYSTEM_PERSONAL);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'IA retornou resposta inválida.' });

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const planoGerado = JSON.parse(jsonStr);

    if (salvar && alunoId) {
      const treinosSalvos = [];
      for (const t of planoGerado.treinos) {
        const exerciciosSalvos = [];
        for (const ex of t.exercicios) {
          let exercicio = await Exercicio.findOne({ nome: { $regex: new RegExp(`^${ex.nome}$`, 'i') } });
          if (!exercicio) {
            exercicio = await Exercicio.create({ nome: ex.nome, musculosPrincipais: ex.musculosPrincipais || [], equipamento: ex.equipamento || 'outro', dificuldade: ex.dificuldade || 'intermediario', criadoPor: req.user.id, publica: false });
          }
          exerciciosSalvos.push({ exercicio: exercicio._id, series: ex.series || 3, reps: ex.reps || '10', carga: ex.carga || 0, descanso: ex.descanso || 60, observacoes: ex.observacoes || '' });
        }
        const treino = await Treino.create({ nome: t.nome, tipo: t.tipo || 'A', descricao: planoGerado.plano?.descricao || '', aluno: alunoId, personal: req.user.id, exercicios: exerciciosSalvos, diasSemana: t.diasSemana || [] });
        treinosSalvos.push(treino._id);
      }
      return res.json({ plano: planoGerado, salvo: true, treinos: treinosSalvos });
    }

    res.json({ plano: planoGerado, salvo: false });
  } catch (err) {
    next(err);
  }
}

module.exports = { gerarTreino, chat, salvarPlanoChat };
