import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Inicialização do SDK do Gemini com User-Agent exigido
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn('AVISO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Endpoint da IA Especialista em Pecuária - Análise Completa
app.post('/api/ai/analyze-farm', async (req, res) => {
  try {
    const { farmName, animals, lots, inventory, transactions, healthRecords, tasks, calculatorConfig, globalDailyCost } = req.body;

    const ai = getGenAIClient();

    // Sumarização estruturada dos dados para alimentar a IA
    const activeAnimals = (animals || []).filter((a: any) => a.status === 'Ativo');
    const soldAnimals = (animals || []).filter((a: any) => a.status === 'Vendido');
    const deadAnimals = (animals || []).filter((a: any) => a.status === 'Morto');

    const totalWeight = activeAnimals.reduce((acc: number, a: any) => acc + (Number(a.weightKg) || 0), 0);
    const avgWeight = activeAnimals.length > 0 ? (totalWeight / activeAnimals.length).toFixed(1) : '0';

    // Cálculo do GMD médio recente
    let totalGmd = 0;
    let gmdCount = 0;
    activeAnimals.forEach((a: any) => {
      if (a.history && a.history.length > 1) {
        const last = a.history[a.history.length - 1];
        if (last.gmd && last.gmd > 0) {
          totalGmd += last.gmd;
          gmdCount++;
        }
      }
    });
    const avgGmd = gmdCount > 0 ? (totalGmd / gmdCount).toFixed(3) : 'Não informado';

    // Lotes
    const lotsSummary = (lots || []).map((l: any) => {
      const lotAnimals = activeAnimals.filter((a: any) => a.lotId === l.id);
      return `- Lote "${l.name}" (${l.category || 'Geral'}): ${lotAnimals.length} cabeças, Custo Diário: R$ ${l.dailyCost || globalDailyCost || 0}/cabeça`;
    }).join('\n');

    // Estoque com alertas
    const lowStock = (inventory || []).filter((i: any) => Number(i.quantity) <= Number(i.minQuantity));
    const inventorySummary = (inventory || []).map((i: any) => 
      `- ${i.name}: ${i.quantity} ${i.unit} (Mínimo: ${i.minQuantity}) ${Number(i.quantity) <= Number(i.minQuantity) ? '[ESTOQUE CRÍTICO]' : ''}`
    ).join('\n');

    // Financeiro
    const incomeTotal = (transactions || [])
      .filter((t: any) => t.type === 'Receita')
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const expenseTotal = (transactions || [])
      .filter((t: any) => t.type === 'Despesa')
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const netProfit = incomeTotal - expenseTotal;

    // Saúde
    const criticalHealth = (healthRecords || []).filter((r: any) => r.status === 'Em Tratamento');

    const prompt = `
Você é o Agente IA Especialista em Pecuária de Corte e Leite (Consultor Zootecnista & Gestor Financeiro Sênior).
Seu objetivo é fazer um diagnóstico completo, crítico e pragmático da fazenda "${farmName || 'Minha Fazenda'}" e entregar um relatório claro, direto ao ponto e focado na maximização do lucro.

--- DADOS ATUAIS DA FAZENDA ---
• Nome da Unidade: ${farmName || 'Fazenda sem nome'}
• Rebanho Ativo: ${activeAnimals.length} cabeças
• Animais Vendidos: ${soldAnimals.length} | Animais Mortos: ${deadAnimals.length}
• Peso Médio do Rebanho: ${avgWeight} kg (${(Number(avgWeight) / 30).toFixed(1)} @)
• Ganho Médio Diário (GMD) Recente: ${avgGmd} kg/dia
• Custo Diário Padrão por Cabeça: R$ ${globalDailyCost || 0}

• Lotes Cadastrados (${(lots || []).length}):
${lotsSummary || 'Nenhum lote específico cadastrado.'}

• Resumo do Estoque / Insumos (${(inventory || []).length} itens, ${lowStock.length} abaixo do mínimo):
${inventorySummary || 'Nenhum insumo cadastrado.'}

• Resumo Financeiro Consolidação:
  - Total de Receitas: R$ ${incomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  - Total de Despesas: R$ ${expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  - Resultado Líquido: R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

• Ocorrências de Saúde em Tratamento: ${criticalHealth.length} casos.
• Tarefas Pendentes na Fazenda: ${(tasks || []).filter((t: any) => t.status === 'Pendente').length} tarefas.
• Configuração do Simulador / Diária: Renda/Aluguel R$ ${calculatorConfig?.rentCost || 0}, Suplementação R$ ${calculatorConfig?.suppCostMonthly || 0}/mês.

--- INSTRUÇÃO DE ESTRUTURA E ESTILO ---
Analise esses dados e construa um diagnóstico executivo em Português (Brasil).
Responda EXCLUSIVAMENTE em formato Markdown bem estruturado utilizando os títulos e emojis abaixo:

### 📊 Panorama Geral da Operação
[Breve resumo executivo da situação atual zootécnica e financeira da fazenda]

### ✅ Pontos Positivos
[Liste de 3 a 5 pontos fortes observados nos dados, valorizando o que está dando certo]

### ⚠️ Pontos Negativos e Gargalos
[Liste de 3 a 5 gargalos, falhas de dados, custos altos, desbalanços de estoque ou desempenho abaixo da meta que estão fazendo a fazenda perder dinheiro]

### 🚀 Plano de Ação para Maximizar a Lucratividade
[Forneça recomendações práticas e quantificadas sobre:
1. Como reduzir o custo da diária / otimizar a nutrição.
2. Como acelerar o GMD e atingir o ponto ótimo de abate/venda.
3. Ajustes no estoque de insumos e controle sanitário.
4. Estratégia de precificação e gestão de margem por cabeça.]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ analysis: response.text || 'Não foi possível gerar a análise no momento.' });
  } catch (error: any) {
    console.error('Erro na análise da fazenda:', error);
    res.status(500).json({ error: error?.message || 'Erro ao comunicar com o agente especialista IA.' });
  }
});

// Endpoint do Chat Direto com o Agente Especialista
app.post('/api/ai/chat-specialist', async (req, res) => {
  try {
    const { question, farmContext, history } = req.body;

    const ai = getGenAIClient();

    const systemInstruction = `
Você é o Agente IA Especialista em Pecuária de Corte e Leite (Consultor Zootecnista e Economista Agrícola).
Responda às dúvidas do pecuarista de forma profissional, direta, amigável e extremamente técnica, utilizando os dados da fazenda disponibilizados como contexto.
Sempre que pertinente, apresente números, cálculos de arroba (@), custo diário, conversão alimentar ou estratégias de mercadoScot/CEPEA.
`;

    const contextText = farmContext ? `CONTEXTO DA FAZENDA:\n${JSON.stringify(farmContext, null, 2)}\n\n` : '';
    const fullPrompt = `${contextText}PERGUNTA DO PECUARISTA: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ answer: response.text || 'Sem resposta no momento.' });
  } catch (error: any) {
    console.error('Erro no chat com o especialista:', error);
    res.status(500).json({ error: error?.message || 'Erro ao processar mensagem no chat com IA.' });
  }
});

// Configuração do Vite ou Arquivos Estáticos em Produção
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Pecuária rodando na porta http://localhost:${PORT}`);
  });
}

startServer();
