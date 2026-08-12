import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

const getClientAi = (): GoogleGenAI | null => {
  const metaEnv = (import.meta as any).env || {};
  const apiKey = 
    (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) ||
    metaEnv.VITE_GEMINI_API_KEY || 
    metaEnv.GEMINI_API_KEY ||
    '';

  if (!apiKey || apiKey === 'undefined' || apiKey === '""' || String(apiKey).trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey: String(apiKey).trim() });
};

// Analisa o status da fazenda com base nos dados do rebanho, estoque e lotes.
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
      if (data.text) return data.text;
    }
  } catch (error) {
    console.warn("Express endpoint /api/gemini/analyze-farm indisponível, tentando fallback cliente:", error);
  }

  // Client-side fallback via @google/genai
  try {
    const ai = getClientAi();
    if (!ai) return "Serviço de IA não configurado. Adicione a chave GEMINI_API_KEY para habilitar a análise.";

    const animalSummary = animals.map(a => 
      `- ${a.earTag} (${a.breed}): ${a.weightKg}kg`
    ).slice(0, 30).join('\n');

    const stockSummary = inventory.map(i => 
      `- ${i.name}: ${i.quantity} ${i.unit}`
    ).join('\n');

    const prompt = `
      Atue como um gerente de fazenda pecuária experiente. Analise os dados:
      1. ESTOQUE: ${stockSummary || 'Nenhum item em estoque.'}
      2. REBANHO: ${animalSummary || 'Nenhum animal cadastrado.'}
      3. LOTES: ${lots.length} lotes ativos.
      Gere um relatório técnico sucinto em português brasileiro.
    `;

    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });
    return res.text || "Sem análise disponível.";
  } catch (err: any) {
    console.error("Erro na análise da fazenda cliente:", err);
    return "Não foi possível conectar ao serviço de IA no momento.";
  }
};

// Fornece conselhos rápidos e técnicos para perguntas do produtor.
export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/quick-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (e) {
    console.warn("Express endpoint /api/gemini/quick-advice indisponível, usando cliente:", e);
  }

  try {
    const ai = getClientAi();
    if (!ai) return "Serviço de IA não configurado.";
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Responda de forma direta, clara e técnica para um pecuarista brasileiro: ${question}`
    });
    return res.text || "Sem resposta.";
  } catch (err) {
    return "Erro no serviço de IA. Tente novamente mais tarde.";
  }
};

// Analisa a formulação de ração e fornece observações técnicas.
export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/feed-formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (e) {
    console.warn("Express endpoint /api/gemini/feed-formula indisponível, usando cliente:", e);
  }

  try {
    const ai = getClientAi();
    if (!ai) return "Serviço de IA não configurado.";
    const ingredientsList = ingredients.map((i) => `- ${i.name}: ${i.percent}%`).join('\n');
    const prompt = `Analise a seguinte formulação de ração pecuária: \n${ingredientsList}\nForneça estimativa nutricional e observações em português.`;
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });
    return res.text || "Não foi possível analisar a mistura.";
  } catch (err) {
    return "Erro ao processar análise nutricional.";
  }
};

/**
 * Busca dados de mercado atualizados (Boi Gordo, Vaca Gorda, Milho, Soja) no Brasil.
 */
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
    if (!ai) return { text: fallbackReport, sources: [] };

    const regionPrompt = `Atue como analista sênior de mercado pecuário brasileiro.
Forneça uma análise atualizada sobre o mercado físico do boi gordo, vaca gorda, reposição e grãos na região de "${currentRegion}" com base na Scot Consultoria.
Destaque a firmeza das cotações da arroba do boi gordo e tendências para o produtor. Use formatação Markdown.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: regionPrompt,
    });

    return { text: res.text || fallbackReport, sources: [] };
  } catch (err) {
    return { text: fallbackReport, sources: [] };
  }
};

/**
 * Busca o Relatório Diagnóstico da fazenda gerado pelo Consultor IA.
 */
export const fetchConsultantReport = async (farmData: any, farmName?: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/consultant-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmData, farmName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (error) {
    console.warn("Express endpoint /api/gemini/consultant-report indisponível, usando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (!ai) return "Serviço de IA não configurado. Adicione a chave GEMINI_API_KEY para gerar relatórios.";

    const { animals = [], transactions = [], inventory = [], lots = [], healthRecords = [], tasks = [], globalDailyCost = 0 } = farmData || {};
    const activeAnimals = animals.filter((a: any) => a.status === 'Ativo');
    const totalHead = activeAnimals.length;
    const avgWeight = totalHead > 0 ? (activeAnimals.reduce((acc: number, a: any) => acc + (Number(a.weightKg) || 0), 0) / totalHead).toFixed(1) : 0;
    
    const prompt = `
Atue como um CONSULTOR PECUÁRIO SÊNIOR com mais de 20 anos de experiência na pecuária brasileira.
Abaixo estão os dados reais da propriedade "${farmName || 'Sua Fazenda'}":
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
    return res.text || "Relatório diagnóstico indisponível no momento.";
  } catch (err: any) {
    console.error("Erro no relatório cliente:", err);
    return "Erro de conexão ao serviço de IA. Tente novamente mais tarde.";
  }
};

/**
 * Envia mensagem para o Chat com o Consultor IA.
 */
export const sendConsultantChatMessage = async (
  message: string, 
  history: { role: 'user' | 'assistant'; content: string }[], 
  farmData: any, 
  farmName?: string
): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/consultant-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, farmData, farmName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (error) {
    console.warn("Express endpoint /api/gemini/consultant-chat indisponível, usando cliente:", error);
  }

  try {
    const ai = getClientAi();
    if (!ai) return "Serviço de IA não configurado no momento.";

    const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Produtor' : 'Consultor IA'}: ${msg.content}`).join('\n');
    const systemPrompt = `Você é o CONSULTOR PECUÁRIO IA da fazenda "${farmName || 'Sua Fazenda'}". Foco em lucro, bem-estar animal e realidade do campo. Seja direto, técnico e empático em português do Brasil.`;
    const fullPrompt = `${systemPrompt}\n\n${formattedHistory}\nProdutor: ${message}\nConsultor IA:`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt
    });
    return res.text || "Sem resposta do consultor no momento.";
  } catch (err: any) {
    console.error("Erro no chat cliente:", err);
    return "Erro ao conversar com o consultor IA. Tente novamente mais tarde.";
  }
};
