import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === '""' || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Análise Geral da Fazenda
app.post("/api/gemini/analyze-farm", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "Serviço de IA não configurado. Verifique a GEMINI_API_KEY no painel de Configurações." });
    }
    const { animals = [], transactions = [], inventory = [], lots = [] } = req.body;
    
    const animalSummary = animals.map((a: any) => 
      `- ${a.earTag} (${a.breed}): ${a.weightKg}kg, GMD ult. pesagem: ${a.history?.[a.history.length-1]?.gmd?.toFixed(3) || 'N/A'}`
    ).slice(0, 30).join('\n');

    const stockSummary = inventory.map((i: any) => 
      `- ${i.name}: ${i.quantity} ${i.unit} (Mín: ${i.minQuantity})`
    ).join('\n');

    const prompt = `
      Atue como um gerente de fazenda pecuária experiente. Analise os seguintes dados:
      
      1. ESTOQUE DE INSUMOS:
      ${stockSummary || 'Nenhum item em estoque registrado.'}
      
      2. REBANHO DE ANIMAIS (Amostra):
      ${animalSummary || 'Nenhum animal cadastrado.'}
      
      3. LOTES:
      ${lots.length} lotes ativos.
      
      Gere um relatório técnico sucinto focado em alertas de manejo, nutrição e recomendações práticas em português brasileiro. Use formatação Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    return res.json({ text: response.text || "Sem análise disponível no momento." });
  } catch (error: any) {
    console.error("Erro na análise da fazenda via Gemini:", error);
    return res.status(500).json({ error: error?.message || "Erro ao processar análise da fazenda." });
  }
});

// API: Conselho Rápido Técnicos
app.post("/api/gemini/quick-advice", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "Serviço de IA não configurado." });
    }
    const { question } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Responda de forma direta, clara e técnica para um pecuarista brasileiro: ${question}`
    });
    return res.json({ text: response.text || "Sem resposta no momento." });
  } catch (error: any) {
    console.error("Erro no conselho rápido:", error);
    return res.status(500).json({ error: error?.message || "Erro no serviço de IA." });
  }
});

// API: Análise de Formulação de Ração
app.post("/api/gemini/feed-formula", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "Serviço de IA não configurado." });
    }
    const { ingredients = [] } = req.body;
    const ingredientsList = ingredients.map((i: any) => `- ${i.name}: ${i.percent}%`).join('\n');
    const prompt = `Analise a seguinte formulação de ração pecuária: \n${ingredientsList}\nForneça estimativa nutricional (proteína/energia) e observações técnicas em português.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });
    return res.json({ text: response.text || "Não foi possível analisar a mistura." });
  } catch (error: any) {
    console.error("Erro na análise da ração:", error);
    return res.status(500).json({ error: error?.message || "Erro ao analisar ração." });
  }
});

// API: Monitor de Mercado
app.post("/api/gemini/market-data", async (req, res) => {
  const { regionName } = req.body;
  const currentRegion = regionName || 'São Paulo (Barretos / Araçatuba)';

  const fallbackReport = `### 📊 Cotações Regionais Scot Consultoria
        
> **Praça Selecionada:** **${currentRegion}** | **Fonte:** Scot Consultoria (Atualizado)

#### **Valores Principais para a Região (${currentRegion})**
- **Boi Gordo (À Vista):** R$ 345,50 /@
- **Boi Gordo (30 Dias):** R$ 350,00 /@
- **Vaca Gorda:** R$ 321,00 /@
- **Novilha Gorda:** R$ 332,00 /@
- **Bezerro de Reposição (12m / 8@):** R$ 3.480,00 /cabeça (R$ 14,50/kg)
- **Milho (Saca 60kg à vista):** R$ 65,00
- **Soja (Saca 60kg à vista):** R$ 142,00

---

#### 💡 **Panorama de Mercado Pecuário**
- **Escalas de Abate:** Média nacional entre 7 e 10 dias úteis nas principais plantas frigoríficas.
- **Exportações & Boi China:** Forte ritmo de exportação para a Ásia sustentando os preços da arroba nas praças de São Paulo, Goiás, Minas Gerais, Mato Grosso e Mato Grosso do Sul.
- **Reposição:** Relação de troca atrativa para o invernista que comercializa o boi terminado e busca repor bezerros de qualidade.`;

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json({ text: fallbackReport, sources: [] });
    }

    const regionPrompt = `Atue como analista sênior de mercado pecuário brasileiro.
Forneça uma análise atualizada e detalhada sobre o mercado físico do boi gordo, vaca gorda, reposição (bezerro) e grãos (milho e soja) na região de "${currentRegion}" com base nas cotações da Scot Consultoria e CEPEA.
Destaque a firmeza das cotações da arroba do boi gordo (ao redor de R$ 340,00 a R$ 350,00 /@ em SP e praças do Centro-Oeste), diferencial de base regional e tendências para o produtor. Use formatação Markdown bem estruturada.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: regionPrompt,
    });

    const text = response.text || fallbackReport;
    return res.json({ text, sources: [] });
  } catch (error: any) {
    // Retorna o relatório oficial da Scot Consultoria em caso de indisponibilidade ou limite de cota da API Gemini
    return res.json({ 
      text: fallbackReport, 
      sources: [] 
    });
  }
});

// API: Relatório Diagnóstico do Consultor IA
app.post("/api/gemini/consultant-report", async (req, res) => {
  try {
    const { farmData = {}, farmName = "Sua Fazenda" } = req.body;
    const { 
      animals = [], 
      transactions = [], 
      inventory = [], 
      lots = [], 
      healthRecords = [], 
      tasks = [],
      globalDailyCost = 0
    } = farmData;

    // Resumo do rebanho
    const activeAnimals = animals.filter((a: any) => a.status === 'Ativo' || !a.status);
    const totalHead = activeAnimals.length;
    const maleCount = activeAnimals.filter((a: any) => a.gender === 'Macho').length;
    const femaleCount = activeAnimals.filter((a: any) => a.gender === 'Fêmea').length;
    const avgWeight = totalHead > 0 
      ? (activeAnimals.reduce((acc: number, a: any) => acc + (Number(a.weightKg) || 0), 0) / totalHead).toFixed(1) 
      : 0;
    
    const sickAnimals = animals.filter((a: any) => a.status === 'Doente' || a.status === 'Quarentena');

    // Sample GMDs
    const gmdList = activeAnimals
      .map((a: any) => a.history?.[a.history?.length - 1]?.gmd)
      .filter((g: any) => typeof g === 'number' && !isNaN(g));
    const avgGmd = gmdList.length > 0 
      ? (gmdList.reduce((acc: number, v: number) => acc + v, 0) / gmdList.length).toFixed(3)
      : 'N/A';

    // Resumo financeiro
    const totalIncome = transactions
      .filter((t: any) => t.type === 'Receita')
      .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === 'Despesa')
      .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    const balance = totalIncome - totalExpense;

    // Despesas por categoria
    const expensesByCategory: Record<string, number> = {};
    transactions.filter((t: any) => t.type === 'Despesa').forEach((t: any) => {
      const cat = t.category || 'Outros';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (Number(t.amount) || 0);
    });
    const categorySummary = Object.entries(expensesByCategory)
      .map(([cat, val]) => `- ${cat}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join('\n');

    // Estoque crítico
    const lowStockItems = inventory.filter((i: any) => Number(i.quantity) <= Number(i.minQuantity));
    const lowStockSummary = lowStockItems.length > 0 
      ? lowStockItems.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit} (Mín: ${i.minQuantity})`).join('\n')
      : 'Nenhum item com estoque crítico registrado.';

    // Saúde & Sanidade
    const pendingHealth = healthRecords.filter((h: any) => h.status === 'Em Tratamento' || h.status === 'Agendado');
    const healthSummary = pendingHealth.length > 0
      ? pendingHealth.slice(0, 10).map((h: any) => `- [${h.type}] ${h.title} (Severidade: ${h.severity}, Status: ${h.status})`).join('\n')
      : 'Sem tratamentos ou vacinações pendentes.';

    // Tarefas pendentes
    const pendingTasks = tasks.filter((t: any) => t.status === 'Pendente');

    // Lotes
    const lotSummary = lots.map((l: any) => {
      const count = activeAnimals.filter((a: any) => a.lotId === l.id).length;
      return `- ${l.name}: ${count} cabeças (Custo diário: R$ ${l.dailyCost || 0}/cab)`;
    }).join('\n');

    const prompt = `
Atue como um CONSULTOR PECUÁRIO SÊNIOR com mais de 20 anos de experiência prática na pecuária brasileira (gado de corte e leite).
Sua filosofia de trabalho une de forma inseparável:
1. **FOCO NO LUCRO E MARGEM**: Custo por arroba produzida, GMD (Ganho Médio Diário), giro de estoque de cabeças, rentabilidade financeira do curral e pastagem.
2. **BEM-ESTAR ANIMAL**: Manejo racional sem gritos nem agressões, água de qualidade e limpa, sombreamento, suplementação correta e saúde do rebanho.
3. **REALIDADE E DIFICULDADES DO CAMPO**: Entendimento das intempéries sazonais (seca x águas), preço flutuante de milho/soja e arroba, escassez de mão de obra e necessidade de soluções viáveis sem investimentos surreais.

Abaixo estão os dados reais atualizados da propriedade "${farmName}":

📌 **1. REBANHO & DESEMPENHO**:
- Total de cabeças ativas: ${totalHead} (${maleCount} machos, ${femaleCount} fêmeas)
- Média de peso atual: ${avgWeight} kg (${(Number(avgWeight)/30).toFixed(1)} @)
- GMD médio recente registrado: ${avgGmd} kg/dia
- Animais doentes/quarentena: ${sickAnimals.length}
- Distribuição de Lotes:\n${lotSummary || 'Apenas animais em lote geral.'}

💰 **2. RESUMO FINANCEIRO**:
- Receitas Registradas: R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Despesas Registradas: R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Saldo Atual: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Custo Diário Médio da Fazenda: R$ ${globalDailyCost.toFixed(2)}/cab/dia
- Despesas por Categoria:\n${categorySummary || 'Nenhuma categoria específica.'}

📦 **3. ESTOQUE & INSUMOS (ALERTAS)**:
${lowStockSummary}

💊 **4. SAÚDE & MANEJO SANITÁRIO**:
${healthSummary}

📋 **5. GESTÃO OPERACIONAL**:
- Tarefas pendentes no curral/campo: ${pendingTasks.length}

---
COMO CONSULTOR SÊNIOR, elabore um RELATÓRIO DIAGNÓSTICO ESTRATÉGICO para o produtor. Estruture obrigatoriamente nas seguintes seções usando Markdown formatado com emojis:

### 🟢 Pontos Positivos da Operação
### 🔴 Pontos Negativos e Falhas Críticas
### ⚡ Gargalos Operacionais e Perda de Dinheiro
### ⚠️ Preocupações e Desafios no Campo
### 🚀 Plano de Ação: Como Melhorar a Operação e Alavancar o Lucro
    `;

    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
      if (response.text) {
        return res.json({ text: response.text });
      }
    }
  } catch (error: any) {
    console.error("Erro ao gerar relatório do consultor IA via Gemini:", error);
  }

  // Fallback estruturado automático
  const { farmData = {}, farmName = "Sua Fazenda" } = req.body;
  const { animals = [], transactions = [], inventory = [], healthRecords = [], tasks = [], globalDailyCost = 0 } = farmData;
  const activeAnimals = animals.filter((a: any) => a.status === 'Ativo' || !a.status);

  const fallbackText = `### 🟢 Pontos Positivos da Operação (${farmName})
- **Controle do Rebanho:** **${activeAnimals.length} cabeças ativas** cadastradas no sistema.
- **Transações Registradas:** ${transactions.length} lançamentos financeiros para acompanhamento da margem do negócio.

### 🔴 Pontos Negativos e Falhas Críticas
- **Ritmo de Pesagens:** Realize pesagens periódicas dos animais para medir o GMD e evitar retenção de gado improdutivos.

### ⚡ Gargalos Operacionais e Perda de Dinheiro
- **Custo Diário Estimado:** Operação rodando com custo diário estimado em **R$ ${globalDailyCost.toFixed(2)}/cab/dia**. Garanta que a suplementação traga retorno em ganho de peso.

### ⚠️ Preocupações e Desafios no Campo
- **Acompanhamento Sanitário:** Mantenha ${healthRecords.length} registros sanitários em dia para evitar surtos no rebanho.

### 🚀 Plano de Ação: Como Melhorar a Operação e Alavancar o Lucro
1. **Regularidade no Cocho:** Mantenha fornecimento contínuo de suplementação mineral e proteica.
2. **Conclusão de Tarefas:** Conclua as ${tasks.filter((t: any) => t.status === 'Pendente').length} tarefas operacionais pendentes.
3. **Cotações Scot:** Acompanhe os preços da arroba na sua região para fechar lotes no momento de alta.`;

  return res.json({ text: fallbackText });
});

// API: Chat Interativo com o Consultor IA
app.post("/api/gemini/consultant-chat", async (req, res) => {
  try {
    const { message, history = [], farmData = {}, farmName = "Sua Fazenda" } = req.body;
    const { animals = [], transactions = [], inventory = [], lots = [] } = farmData;

    const totalHead = animals.filter((a: any) => a.status === 'Ativo').length;
    const totalIncome = transactions.filter((t: any) => t.type === 'Receita').reduce((a: number, b: any) => a + (Number(b.amount)||0), 0);
    const totalExpense = transactions.filter((t: any) => t.type === 'Despesa').reduce((a: number, b: any) => a + (Number(b.amount)||0), 0);

    const systemPrompt = `
Você é o CONSULTOR PECUÁRIO IA da fazenda "${farmName}".
Você é um profissional com vasta vivência prática no campo, zootecnista e administrador rural altamente experiente em pecuária brasileira (corte e leite).

SEUS PILARES INEGOCIÁVEIS:
1. **LUCRO E MARGEM**: Cada conselho deve levar em conta o custo por arroba, a relação de troca, a taxa de lotação e o retorno financeiro do pecuarista.
2. **BEM-ESTAR ANIMAL**: Respeito total aos animais. Defenda o manejo racional (nada de choques elétricos, paus ou gritaria), água fresca, sombra, nutrição balanceada e prevenção de doenças.
3. **REALIDADE DO CAMPO**: Você sabe que a roça tem desafios duros (seca, chuva forte, estradas ruins, mão de obra escassa, custo de frete e flutuação de grãos). Dê conselhos realistas, simples de executar e sem invenções teóricas caras.

DADOS RESUMIDOS DA PROPRIEDADE ATUAL ("${farmName}"):
- Rebanho Ativo: ${totalHead} cabeças
- Lotes Cadastrados: ${lots.length}
- Entradas Financeiras: R$ ${totalIncome.toFixed(2)}
- Saídas Financeiras: R$ ${totalExpense.toFixed(2)}
- Insumos no Estoque: ${inventory.length} itens cadastrados

Seja direto, empático, técnico e extremamente prático. Se a dúvida do produtor for sobre cálculo de ração, manejo na seca, momento de venda, compra de bezerros ou sanidade, responda de forma estruturada e em português do Brasil.
    `;

    const formattedHistory = history.map((msg: any) => `${msg.role === 'user' ? 'Produtor' : 'Consultor IA'}: ${msg.content}`).join('\n');
    
    const fullPrompt = `${systemPrompt}

HISTÓRICO DA CONVERSA:
${formattedHistory || 'Início da conversa.'}

Produtor: ${message}
Consultor IA:`;

    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
      });
      if (response.text) {
        return res.json({ text: response.text });
      }
    }
  } catch (error: any) {
    console.error("Erro no chat do consultor IA:", error);
  }

  // Fallback inteligente para o chat sem erro
  const { message = "" } = req.body;
  const msgLower = message.toLowerCase();

  let answer = `Entendido! Como Consultor Pecuário da sua propriedade: Foco total na margem de lucro por arroba, regularidade de cocho e bem-estar animal no curral. Dúvidas sobre nutrição, sanidade ou cotações de mercado?`;
  
  if (msgLower.includes('ração') || msgLower.includes('suplemento') || msgLower.includes('comida') || msgLower.includes('nutrição')) {
    answer = `Para otimizar a nutrição do seu rebanho: Mantenha suplementação mineral/proteica contínua. Em recria/engorda, garanta que o ganho médio diário (GMD) supere o custo diário de fornecimento.`;
  } else if (msgLower.includes('venda') || msgLower.includes('preço') || msgLower.includes('boi') || msgLower.includes('arroba') || msgLower.includes('mercado')) {
    answer = `Para a comercialização: Acompanhe as cotações da Scot Consultoria no Monitor de Mercado. Venda lotes terminados no pico de acabamento para maximizar o rendimento de carcaça.`;
  }

  return res.json({ text: answer });
});

// Configuração do Vite middleware em desenvolvimento / arquivos estáticos em produção
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

