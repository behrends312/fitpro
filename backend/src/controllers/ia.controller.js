const Anthropic = require('@anthropic-ai/sdk');
const Treino = require('../models/Treino');
const Exercicio = require('../models/Exercicio');
const User = require('../models/User');

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada.');
  return new Anthropic({ apiKey: key });
}

// POST /ia/gerar-treino
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

    const prompt = `Você é um personal trainer especialista. Crie um plano de treino completo e profissional.

Dados do aluno:
- Nome: ${alunoNome}
- Altura: ${altura}cm
- Peso: ${peso}kg
- Objetivo: ${objetivo}
- Dias de treino por semana: ${diasTreino}
- Nível: ${nivel || 'intermediário'}
- Equipamentos disponíveis: ${equipStr}

Retorne APENAS um JSON válido, sem texto adicional, seguindo EXATAMENTE esta estrutura:
{
  "plano": {
    "nome": "Nome do plano",
    "descricao": "Descrição geral do plano",
    "periodizacao": "Descrição da periodização (ex: 4 semanas de adaptação...)",
    "progressao": "Como progredir (ex: aumentar 2.5kg a cada 2 semanas...)"
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
          "musculosSecundarios": ["tríceps", "deltoides anterior"],
          "equipamento": "barra",
          "dificuldade": "intermediario",
          "series": 4,
          "reps": "8-12",
          "carga": 60,
          "descanso": 90,
          "observacoes": "Controle a descida em 3 segundos"
        }
      ]
    }
  ]
}

Regras:
- diasSemana deve usar: seg, ter, qua, qui, sex, sab, dom
- equipamento deve ser um de: barra, halteres, maquina, cabo, peso_corporal, elastico, kettlebell, outro
- dificuldade deve ser: iniciante, intermediario ou avancado
- carga deve ser um número realista em kg
- descanso em segundos
- Gere exatamente ${diasTreino} treino(s) diferentes
- Cada treino deve ter entre 4 e 8 exercícios
- Inclua progressão específica e periodização detalhada`;

    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ message: 'IA retornou resposta inválida.' });

    const planoGerado = JSON.parse(jsonMatch[0]);

    // Se salvar=true, persiste no banco
    if (salvar && alunoId) {
      const treinosSalvos = [];

      for (const t of planoGerado.treinos) {
        const exerciciosSalvos = [];

        for (const ex of t.exercicios) {
          // Busca ou cria o exercício
          let exercicio = await Exercicio.findOne({
            nome: { $regex: new RegExp(`^${ex.nome}$`, 'i') },
          });

          if (!exercicio) {
            exercicio = await Exercicio.create({
              nome: ex.nome,
              musculosPrincipais: ex.musculosPrincipais || [],
              musculosSecundarios: ex.musculosSecundarios || [],
              equipamento: ex.equipamento || 'outro',
              dificuldade: ex.dificuldade || 'intermediario',
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
          descricao: `${planoGerado.plano.descricao}\n\nProgressão: ${planoGerado.plano.progressao}`,
          tipo: t.tipo || 'A',
          aluno: alunoId,
          personal: req.user.id,
          exercicios: exerciciosSalvos,
          diasSemana: t.diasSemana || [],
        });

        treinosSalvos.push(treino._id);
      }

      return res.json({ plano: planoGerado, salvo: true, treinos: treinosSalvos });
    }

    res.json({ plano: planoGerado, salvo: false });
  } catch (err) {
    next(err);
  }
}

module.exports = { gerarTreino };
