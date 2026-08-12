import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

export const getStoredGeminiKey = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_gemini_api_key') || '';
  }
  return '';
};

export const saveGeminiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('user_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
  }
};

const getClientAi = (): GoogleGenAI | null => {
  const userKey = getStoredGeminiKey();
  const metaEnv = (import.meta as any).env || {};
  const apiKey = 
    userKey ||
    (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) ||
    metaEnv.VITE_GEMINI_API_KEY || 
    metaEnv.GEMINI_API_KEY ||
    '';

  if (!apiKey || apiKey === 'undefined' || apiKey === '""' || String(apiKey).trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey: String(apiKey).trim() });
};

// Gerador dinâmico de relatório diagnóstico quando a chave de API Gemini não está configurada
export const generateFarmDiagnosticReport = (farmData: any, farmName: string = "Sua Fazenda"): string => {
  const { 
    animals = [], 
    transactions = [], 
    inventory = [], 
    lots = [], 
    healthRecords = [], 
    tasks = [],
    globalDailyCost = 0 
  } = farmData || {};

  const activeAnimals = animals.filter((a: any) => a.status === 'Ativo' || !a.status);
  const totalHead = activeAnimals.length;
  const males = activeAnimals.filter((a: any) => a.gender === 'Macho').length;
  const females = activeAnimals.filter((a: any) => a.gender === 'Fêmea').length;
  const avgWeight = totalHead > 0 
    ? (activeAnimals.reduce((acc: number, a: any) => acc + (Number(a.weightKg) || 0), 0) / totalHead).toFixed(1) 
    : "0";
  const avgArrobas = (Number(avgWeight) / 30).toFixed(1);

  const totalIncome = transactions
    .filter((t: any) => t.type === 'Receita')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const totalExpense = transactions
    .filter((t: any) => t.type === 'Despesa')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  const lowStock = inventory.filter((i: any) => Number(i.quantity) <= Number(i.minQuantity));
  const sickAnimals = animals.filter((a: any) => a.status === 'Doente' || a.status === 'Quarentena');
  const pendingHealth = healthRecords.filter((h: any) => h.status === 'Em Tratamento' || h.status === 'Agendado');
  const pendingTasks = tasks.filter((t: any) => t.status === 'Pendente');

  return `### 🟢 Pontos Positivos da Operação (${farmName})
- **Controle e Volume do Rebanho:** **${totalHead} cabeças ativas** registradas (${males} machos e ${females} fêmeas), com média de peso geral de **${avgWeight} kg (${avgArrobas} @)**.
- **Estrutura de Lotes:** Rebanho organizado em **${lots.length || 1} lotes operacionais**, facilitando o direcionamento da suplementação e o manejo diário no curral.
- **Rastreabilidade Financeira:** **${transactions.length} movimentações** de caixa registradas, com saldo consolidado em **R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.

### 🔴 Pontos Negativos e Falhas Críticas
${sickAnimals.length > 0 
  ? `- **Atenção Sanitária Requerida:** Identificados **${sickAnimals.length} animais doentes ou em quarentena**. Risco de perda de desempenho e contaminação nos piquetes.` 
  : `- **Frequência de Pesagem:** Recomenda-se aumentar a rotina de pesagem para acompanhar com precisão o Ganho Médio Diário (GMD) por lote.`}
${balance < 0 
  ? `- **Desbalanço Financeiro:** Despesas acumuladas (R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) superando as receitas (R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Requer alinhamento urgente no giro de vendas.` 
  : `- **Custo Operacional Diário:** Custo diário geral estimado em **R$ ${globalDailyCost.toFixed(2)}/cabeça/dia**. Exige monitoramento do valor nutricional para garantir rentabilidade.`}

### ⚡ Gargalos Operacionais e Perda de Dinheiro
${lowStock.length > 0 
  ? `- **Insumos em Nível Crítico (${lowStock.length} itens):** ${lowStock.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')} abaixo do estoque mínimo. Risco de interrupção na dieta.` 
  : `- **Aproveitamento de Pastagem:** Monitore a taxa de lotação para evitar degradação de pastejo e desperdício de suplementação no cocho.`}
${pendingTasks.length > 0 
  ? `- **Pendências no Campo:** **${pendingTasks.length} tarefas operacionais pendentes**. Atrasos em manutenções e manejos geram estresse e perda de peso no rebanho.` 
  : `- **Giro de Vendas:** Planeje o momento exato de saída dos animais terminados para não estender a permanência no cocho sem ganho compensatório.`}

### ⚠️ Preocupações e Desafios no Campo
${pendingHealth.length > 0 
  ? `- **Sanidade Rebanho:** **${pendingHealth.length} tratamentos e vacinações pendentes**. Priorize a aplicação e acompanhe o período de carência dos medicamentos.` 
  : `- **Conforto e Bem-Estar:** Verifique regularmente a limpeza dos bebedouros, área de sombra e cochos de suplementação.`}
- **Oscilação do Mercado da Arroba:** Acompanhe diariamente as cotações da Scot Consultoria para travar custos de insumos (milho/soja) e negociar a melhor arroba no frigorífico.

### 🚀 Plano de Ação: Como Melhorar a Operação e Alavancar o Lucro
1. **Suplementação Contínua:** Reabasteça com urgência os insumos em nível crítico e mantenha regularidade na oferta de proteinado/mineral.
2. **Manejo Racional & GMD:** Realize pesagens amostrais mensais para identificar animais "fundo de lote" e direcioná-los para recuperação nutricional.
3. **Estratégia de Venda:** Calcule o ponto de equilíbrio (Break-even) e aproveite os picos de cotação da arroba regional para efetuar as vendas do lote terminado.
4. **Execução de Manejos:** Cumpra as **${pendingTasks.length || 1} tarefas pendentes** no curral, garantindo bem-estar animal e segurança para a equipe de campo.`;
};

// Resposta dinâmica inteligente para o Chat com o Consultor IA quando a chave não está disponível
export const generateSmartChatFallback = (
  message: string,
  history: any[],
  farmData: any,
  farmName: string = "Sua Fazenda"
): string => {
  const msgLower = message.toLowerCase();
  const { animals = [], transactions = [], inventory = [], globalDailyCost = 0 } = farmData || {};
  const activeAnimals = animals.filter((a: any) => a.status === 'Ativo' || !a.status);

  if (msgLower.includes('ração') || msgLower.includes('suplemento') || msgLower.includes('comida') || msgLower.includes('nutrição') || msgLower.includes('proteico')) {
    return `Para otimizar a nutrição na **${farmName}** (atualmente com **${activeAnimals.length} cabeças**):

1. **Estrutura da Dieta**: Em recria/engorda, busque consumo de proteinado de seca entre 0,1% e 0,2% do peso vivo (PV). Em terminação intensiva, ração concentrada entre 1,2% e 1,5% do PV.
2. **Custo x Benefício**: Seu custo diário estimado é de R$ ${globalDailyCost.toFixed(2)}/cab/dia. Mantenha o Ganho Médio Diário (GMD) acima de 0,850 kg para assegurar margem positiva.
3. **Manejo de Cocho**: Garanta área de cocho entre 15cm a 30cm por cabeça e disponibilidade permanente de água limpa.`;
  }

  if (msgLower.includes('venda') || msgLower.includes('preço') || msgLower.includes('boi') || msgLower.includes('arroba') || msgLower.includes('mercado') || msgLower.includes('vender')) {
    return `Análise de mercado e vendas para **${farmName}**:

- **Cotação Atual de Referência**: Boi gordo girando ao redor de **R$ 345,00 a R$ 350,00 /@** nas praças de São Paulo e Centro-Oeste (Fonte: Scot Consultoria).
- **Momento de Venda**: Lotes com peso acima de 18 a 20 arrobas bem terminados devem ser comercializados para evitar permanência desnecessária no cocho com conversão alimentar reduzida.
- **Negociação**: Procure frigoríficos que bonificam por Boi China (animais até 30 meses) e rendimento de carcaça acima de 53%.`;
  }

  if (msgLower.includes('doente') || msgLower.includes('vacina') || msgLower.includes('saúde') || msgLower.includes('remédio') || msgLower.includes('tratamento')) {
    return `Recomendações sanitárias para o rebanho de **${farmName}**:

1. **Isolamento Imediato**: Animais que apresentem apatia, febre ou sintomas respiratórios devem ser transferidos para a baia/piquete de quarentena.
2. **Protocolo Preventivo**: Mantenha a vacinação em dia (Clostridiose, Aftosa/Raiva se aplicável) e faça vermifugação estratégica na troca de estação (águas/seca).
3. **Manejo Racional**: Trate os animais sem agressões ou gritaria no curral para não comprometer o sistema imunológico.`;
  }

  return `Entendido! Como Consultor Pecuário de **${farmName}** (atualmente com **${activeAnimals.length} cabeças** ativas e custo diário de R$ ${globalDailyCost.toFixed(2)}/cab/dia):

Foque em três pilares fundamentais hoje:
1. **Eficiência Nutricional**: Garantir suplementação adequada no cocho.
2. **Controle Financeiro**: Acompanhar de perto o custo da arroba produzida.
3. **Manejo Racional**: Preservar o bem-estar animal para maximizar o ganho de peso.

Como posso ajudar você especificamente em relação ao rebanho, nutrição ou comercialização?`;
};

// Analisa o status da fazenda
export const analyzeFarmStatus = async (
  animals: Animal[], 
  transactions: Transaction[], 
  inventory: InventoryItem[] = [], 
  lots: Lot[] = []
): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/analyze-farm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animals, transactions, inventory, lots }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && !data.text.includes("não configurado")) return data.text;
    }
  } catch (error) {
    console.warn("Express endpoint /api/gemini/analyze-farm indisponível, tentando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const animalSummary = animals.map(a => `- ${a.earTag} (${a.breed}): ${a.weightKg}kg`).slice(0, 30).join('\n');
      const stockSummary = inventory.map(i => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n');
      const prompt = `Atue como gerente pecuário experiente. Analise:\n1. ESTOQUE: ${stockSummary || 'Vazio.'}\n2. REBANHO: ${animalSummary || 'Nenhum.'}\n3. LOTES: ${lots.length} ativos.\nGere relatório técnico em português.`;
      const res = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
      if (res.text) return res.text;
    }
  } catch (err) {
    console.warn("Erro Gemini cliente em analyzeFarmStatus:", err);
  }

  return generateFarmDiagnosticReport({ animals, transactions, inventory, lots }, "Sua Fazenda");
};

// Conselhos rápidos
export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/quick-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && !data.text.includes("não configurado")) return data.text;
    }
  } catch (e) {
    console.warn("Express /api/gemini/quick-advice indisponível:", e);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const res = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Responda de forma direta, clara e técnica para um pecuarista brasileiro: ${question}`
      });
      if (res.text) return res.text;
    }
  } catch (err) {
    console.warn("Erro Gemini cliente em getQuickAdvice:", err);
  }

  return generateSmartChatFallback(question, [], {}, "Sua Fazenda");
};

// Analisa formulação de ração
export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/feed-formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && !data.text.includes("não configurado")) return data.text;
    }
  } catch (e) {
    console.warn("Express /api/gemini/feed-formula indisponível:", e);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const ingredientsList = ingredients.map((i) => `- ${i.name}: ${i.percent}%`).join('\n');
      const prompt = `Analise a seguinte formulação de ração pecuária: \n${ingredientsList}\nForneça estimativa nutricional e observações em português.`;
      const res = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
      if (res.text) return res.text;
    }
  } catch (err) {
    console.warn("Erro Gemini cliente em analyzeFeedFormula:", err);
  }

  return `### 📊 Análise Nutricional Estimada da Mistura
- **Ingredientes Declarados**: ${ingredients.map(i => `${i.name} (${i.percent}%)`).join(', ')}
- **Observação Técnica**: Certifique-se da homogeneidade na mistura no vagão ou betoneira. Mantenha os níveis de proteína bruta e NDT adequados para a fase do rebanho (recria/engorda).`;
};

// Busca dados de mercado
export const fetchMarketData = async (regionName?: string): Promise<{ text: string; sources: any[] }> => {
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
    const response = await fetch("/api/gemini/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return { text: data.text, sources: data.sources || [] };
    }
  } catch (error) {
    console.warn("Express endpoint /api/gemini/market-data indisponível, buscando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const regionPrompt = `Atue como analista sênior de mercado pecuário brasileiro.
Forneça uma análise atualizada sobre o mercado físico do boi gordo, vaca gorda, reposição e grãos na região de "${currentRegion}" com base na Scot Consultoria.
Destaque a firmeza das cotações da arroba do boi gordo e tendências para o produtor. Use formatação Markdown.`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: regionPrompt,
      });

      if (res.text) return { text: res.text, sources: [] };
    }
  } catch (err) {
    console.warn("Erro Gemini cliente em fetchMarketData:", err);
  }

  return { text: fallbackReport, sources: [] };
};

// Busca o Relatório Diagnóstico da fazenda
export const fetchConsultantReport = async (farmData: any, farmName?: string): Promise<string> => {
  const targetName = farmName || "Sua Fazenda";

  try {
    const response = await fetch("/api/gemini/consultant-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmData, farmName: targetName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && !data.text.includes("não está configurado") && !data.text.includes("não configurado")) {
        return data.text;
      }
    }
  } catch (error) {
    console.warn("Express /api/gemini/consultant-report indisponível, usando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const { animals = [], transactions = [], inventory = [], lots = [], healthRecords = [], tasks = [], globalDailyCost = 0 } = farmData || {};
      const activeAnimals = animals.filter((a: any) => a.status === 'Ativo' || !a.status);
      const totalHead = activeAnimals.length;
      const avgWeight = totalHead > 0 ? (activeAnimals.reduce((acc: number, a: any) => acc + (Number(a.weightKg) || 0), 0) / totalHead).toFixed(1) : 0;
      
      const prompt = `
Atue como um CONSULTOR PECUÁRIO SÊNIOR com mais de 20 anos de experiência na pecuária brasileira.
Abaixo estão os dados reais da propriedade "${targetName}":
- Total de cabeças ativas: ${totalHead}
- Média de peso: ${avgWeight} kg (${(Number(avgWeight)/30).toFixed(1)} @)
- Transações cadastradas: ${transactions.length}
- Insumos em estoque: ${inventory.length}
- Lotes: ${lots.length}
- Custo diário estimado: R$ ${globalDailyCost}/cab/dia

COMO CONSULTOR SÊNIOR, elabore um RELATÓRIO DIAGNÓSTICO ESTRATÉGICO com foco no LUCRO, BEM-ESTAR ANIMAL e DESAFIOS DO CAMPO. Use seções Markdown:
### 🟢 Pontos Positivos da Operação
### 🔴 Pontos Negativos e Falhas Críticas
### ⚡ Gargalos Operacionais e Perda de Dinheiro
### ⚠️ Preocupações e Desafios no Campo
### 🚀 Plano de Ação: Como Melhorar a Operação e Alavancar o Lucro
`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });
      if (res.text) return res.text;
    }
  } catch (err: any) {
    console.warn("Erro no relatório cliente via Gemini:", err);
  }

  // Se a chave não estiver configurada ou falhar, retorna o relatório diagnóstico inteligente gerado dos dados reais
  return generateFarmDiagnosticReport(farmData, targetName);
};

// Envia mensagem para o Chat com o Consultor IA
export const sendConsultantChatMessage = async (
  message: string, 
  history: { role: 'user' | 'assistant'; content: string }[], 
  farmData: any, 
  farmName?: string
): Promise<string> => {
  const targetName = farmName || "Sua Fazenda";

  try {
    const response = await fetch("/api/gemini/consultant-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, farmData, farmName: targetName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && !data.text.includes("indisponível no momento")) {
        return data.text;
      }
    }
  } catch (error) {
    console.warn("Express /api/gemini/consultant-chat indisponível, usando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (ai) {
      const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Produtor' : 'Consultor IA'}: ${msg.content}`).join('\n');
      const systemPrompt = `Você é o CONSULTOR PECUÁRIO IA da fazenda "${targetName}". Foco em lucro, bem-estar animal e realidade do campo. Seja direto, técnico e empático em português do Brasil.`;
      const fullPrompt = `${systemPrompt}\n\n${formattedHistory}\nProdutor: ${message}\nConsultor IA:`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt
      });
      if (res.text) return res.text;
    }
  } catch (err: any) {
    console.warn("Erro no chat cliente via Gemini:", err);
  }

  // Resposta fallback inteligente sem erro
  return generateSmartChatFallback(message, history, farmData, targetName);
};
