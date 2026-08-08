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
  return new GoogleGenAI(
    apiKey
      ? {
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        }
      : {
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        }
  );
};

// Helper de chamada Gemini com fallback de modelos e retentativa automática em caso de alta demanda (503/429)
async function generateContentWithFallback(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const modelsToTry = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = typeof err === 'object' ? (JSON.stringify(err) || String(err)) : String(err);
        const errMessage = err?.message || errStr;
        const isTransient = errMessage.includes('503') || errMessage.includes('429') || errMessage.includes('UNAVAILABLE') || errMessage.includes('high demand');
        
        console.warn(`[Gemini Fallback] Tentativa ${attempt} com modelo ${modelName} falhou:`, errMessage);
        if (isTransient && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('Não foi possível se comunicar com os modelos de IA.');
}

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

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ analysis: response.text || 'Não foi possível gerar a análise no momento.' });
  } catch (error: any) {
    console.error('Erro na análise da fazenda via IA:', error);

    const { farmName, animals, inventory, transactions, lots } = req.body || {};
    const activeAnimals = (animals || []).filter((a: any) => a.status === 'Ativo');
    const incomeTotal = (transactions || []).filter((t: any) => t.type === 'Receita').reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
    const expenseTotal = (transactions || []).filter((t: any) => t.type === 'Despesa').reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
    const netProfit = incomeTotal - expenseTotal;
    const lowStock = (inventory || []).filter((i: any) => Number(i.quantity) <= Number(i.minQuantity));

    const fallbackReport = `
> ⚠️ *Nota: O servidor de IA está enfrentando alta demanda temporária no momento. Apresentando diagnóstico zootécnico preliminar com base na consolidação dos seus dados.*

### 📊 Panorama Geral da Operação
A fazenda **"${farmName || 'Minha Fazenda'}"** conta atualmente com **${activeAnimals.length} cabeças ativas** no rebanho.
No âmbito financeiro, a operação registra **R$ ${incomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em receitas e **R$ ${expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em despesas, gerando um resultado operacional de **R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.

### ✅ Pontos Positivos
- **Controle de Rebanho**: Rebanho ativo com ${activeAnimals.length} animais cadastrados.
- **Gestão de Lotes**: ${(lots || []).length} lote(s) estruturado(s) para acompanhamento do manejo.
- **Fluxo Financeiro**: Lançamentos financeiros organizados para cálculo de margem e rentabilidade.

### ⚠️ Pontos Negativos e Gargalos
- **Estoque Crítico**: ${lowStock.length} item(ns) de insumo estão no nível mínimo ou abaixo do limite de segurança.
- **Acompanhamento de Custos**: Atenção ao custo de permanência diária para evitar erosão do lucro na terminação.
- **Indisponibilidade Momentânea da IA**: O cluster da IA do Gemini reportou alta demanda temporária. Clique no botão de atualizar a análise em alguns instantes para obter o relatório ampliado via Gemini.

### 🚀 Plano de Ação para Maximizar a Lucratividade
1. **Recomposição do Estoque**: Repor imediatamente os ${lowStock.length} insumos em estado crítico para evitar paralisações no manejo alimentar.
2. **Monitoramento do GMD**: Manter a rotina de pesagens para garantir um ganho de peso diário consistente e acima da meta.
3. **Gestão da Diária**: Avaliar o custo da nutrição em relação ao preço da arroba no mercado regional.
`;

    res.json({ analysis: fallbackReport });
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

    const response = await generateContentWithFallback(ai, {
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ answer: response.text || 'Sem resposta no momento.' });
  } catch (error: any) {
    console.error('Erro no chat com o especialista:', error);
    res.json({ answer: '⚠️ O serviço de IA está enfrentando alta demanda temporária. Por favor, aguarde alguns segundos e tente enviar sua pergunta novamente.' });
  }
});

// Endpoint de Conselho Rápido
app.post('/api/ai/quick-advice', async (req, res) => {
  try {
    const { question } = req.body;
    const ai = getGenAIClient();
    const response = await generateContentWithFallback(ai, {
      contents: `Responda de forma curta, pragmática e técnica para um pecuarista: ${question}`,
    });
    res.json({ text: response.text || 'Sem resposta no momento.' });
  } catch (error: any) {
    console.error('Erro em quick-advice:', error);
    res.json({ text: '⚠️ O serviço de IA está temporariamente indisponível. Tente novamente em instantes.' });
  }
});

// Endpoint de Análise de Ração / Nutrição
app.post('/api/ai/feed-formula', async (req, res) => {
  try {
    const { ingredients } = req.body;
    const ingredientsList = (ingredients || []).map((i: any) => `- ${i.name}: ${i.percent}%`).join('\n');
    const prompt = `Analise a seguinte formulação de ração: \n${ingredientsList}\nForneça composição estimada e observações técnicas.`;
    const ai = getGenAIClient();
    const response = await generateContentWithFallback(ai, { contents: prompt });
    res.json({ text: response.text || 'Não foi possível analisar a mistura.' });
  } catch (error: any) {
    console.error('Erro em feed-formula:', error);
    res.json({ text: '⚠️ Não foi possível processar a análise nutricional no momento.' });
  }
});

// Endpoint de Monitor de Mercado (Scot Consultoria e CEPEA)
app.get('/api/ai/market-data', async (req, res) => {
  try {
    const ai = getGenAIClient();
    const response = await generateContentWithFallback(ai, {
      contents: 'Forneça um relatório atualizado sobre as cotações do Boi Gordo, Milho e Soja no Brasil, mencionando Scot Consultoria e CEPEA. Use formatação Markdown.',
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'Não foi possível obter dados de mercado no momento.';
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    res.json({ text, sources });
  } catch (error: any) {
    console.error('Erro em market-data:', error);
    res.json({
      text: '⚠️ O serviço de cotação de mercado está enfrentando alta demanda. Atualize em alguns momentos para consultar os valores da Scot Consultoria e CEPEA.',
      sources: [],
    });
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

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor Pecuária rodando na porta http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
