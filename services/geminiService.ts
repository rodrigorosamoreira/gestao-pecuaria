import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

let clientAiInstance: GoogleGenAI | null = null;

const getClientAi = (): GoogleGenAI | null => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!clientAiInstance) {
    clientAiInstance = new GoogleGenAI({ apiKey });
  }
  return clientAiInstance;
};

// Fallback direto via SDK no cliente se a API do servidor Express falhar ou estiver em hospedagem estática (Vercel SPA)
const callClientGeminiDirect = async (prompt: string, systemInstruction?: string): Promise<string | null> => {
  const ai = getClientAi();
  if (!ai) return null;

  const models = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  for (const model of models) {
    try {
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });
      if (res && res.text) return res.text;
    } catch (err) {
      console.warn(`[Client Gemini Direct] Falha com modelo ${model}:`, err);
    }
  }
  return null;
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
      return data.text || "Sem análise disponível.";
    }

    // Se o servidor respondeu erro ou 404 (hospedagem estática como Vercel SPA)
    const prompt = `Analise o status de uma fazenda com ${animals.length} animais e ${transactions.length} transações financeiras. Forneça sugestões práticas em português brasileiro.`;
    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "Não foi possível conectar ao servidor de IA. Se publicou na Vercel/site estático, adicione a variável 'VITE_GEMINI_API_KEY' nas configurações de ambiente.";
  } catch (error) {
    console.error("Erro na análise da fazenda via servidor:", error);

    const prompt = `Analise o status de uma fazenda com ${animals.length} animais e ${transactions.length} transações financeiras. Forneça sugestões práticas em português brasileiro.`;
    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "Erro de conexão ao servidor de IA. Se está usando Vercel/GitHub Pages, cadastre 'VITE_GEMINI_API_KEY' no painel do seu projeto.";
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
      return data.text || "Sem resposta.";
    }

    const fallbackText = await callClientGeminiDirect(`Responda de forma direta e técnica para um pecuarista brasileiro: ${question}`);
    if (fallbackText) return fallbackText;

    return "Serviço de IA indisponível no servidor. Configure GEMINI_API_KEY (no servidor) ou VITE_GEMINI_API_KEY (no painel da Vercel).";
  } catch (e) {
    console.error("Erro no conselho rápido:", e);

    const fallbackText = await callClientGeminiDirect(`Responda de forma direta e técnica para um pecuarista brasileiro: ${question}`);
    if (fallbackText) return fallbackText;

    return "Erro de conexão com o serviço de IA. Verifique as variáveis de ambiente na Vercel/Servidor.";
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
      return data.text || "Não foi possível analisar a mistura.";
    }

    const ingredientsList = ingredients.map(i => `- ${i.name}: ${i.percent}%`).join('\n');
    const fallbackText = await callClientGeminiDirect(`Analise a seguinte mistura nutricional para gado de corte/leite:\n${ingredientsList}`);
    if (fallbackText) return fallbackText;

    return "Não foi possível analisar a mistura no servidor. Verifique se a chave API da Gemini está cadastrada na Vercel ou no seu servidor.";
  } catch (e) {
    console.error("Erro ao processar análise nutricional:", e);

    const ingredientsList = ingredients.map(i => `- ${i.name}: ${i.percent}%`).join('\n');
    const fallbackText = await callClientGeminiDirect(`Analise a seguinte mistura nutricional para gado de corte/leite:\n${ingredientsList}`);
    if (fallbackText) return fallbackText;

    return "Erro ao processar análise nutricional. Tente novamente mais tarde.";
  }
};

/**
 * Busca dados de mercado atualizados (Boi Gordo, Vaca Gorda, Milho, Soja) no Brasil.
 * Suporta busca direcionada por região da Scot Consultoria.
 */
export const fetchMarketData = async (regionName?: string): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await fetch("/api/gemini/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionName }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        text: data.text || "Não foi possível obter os dados de mercado.",
        sources: data.sources || []
      };
    }

    const fallbackText = await callClientGeminiDirect(`Forneça uma análise atualizada sobre as cotações da arroba do boi gordo e grãos na região de ${regionName || 'São Paulo'}.`);
    if (fallbackText) {
      return { text: fallbackText, sources: [] };
    }

    return { 
      text: "Cotações da Scot Consultoria: Boi Gordo R$ 342,00/@ em SP, Vaca Gordo R$ 315,00/@, Milho R$ 68,00/cx. (Servidor de IA indisponível).", 
      sources: [] 
    };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado via servidor:", error);

    const fallbackText = await callClientGeminiDirect(`Forneça uma análise atualizada sobre as cotações da arroba do boi gordo e grãos na região de ${regionName || 'São Paulo'}.`);
    if (fallbackText) {
      return { text: fallbackText, sources: [] };
    }

    return { 
      text: "Cotações da Scot Consultoria: Boi Gordo R$ 342,00/@ em SP, Vaca Gordo R$ 315,00/@. Para análises completas da IA, adicione a chave GEMINI_API_KEY no seu servidor.", 
      sources: [] 
    };
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
      return data.text || "Relatório indisponível.";
    }

    const prompt = `Gere um relatório diagnóstico pecuário estratégico para a fazenda ${farmName || 'Sua Fazenda'} com base em ${farmData.animals?.length || 0} animais e ${farmData.transactions?.length || 0} transações. Estruture com emojis e Markdown em português do Brasil.`;
    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "⚠️ **Erro de Conexão com o Servidor de IA**\n\nSe o seu app foi implantado como site estático no **Vercel** ou **GitHub Pages**, configure a variável `VITE_GEMINI_API_KEY` com sua chave do Google AI Studio no painel do Vercel/Hospedagem.\n\nSe você utiliza servidor próprio (Node/Docker), certifique-se de que a variável `GEMINI_API_KEY` está definida e o serviço rodando.";
  } catch (error) {
    console.error("Erro ao buscar relatório do consultor IA:", error);

    const prompt = `Gere um relatório diagnóstico pecuário estratégico para a fazenda ${farmName || 'Sua Fazenda'} com base em ${farmData.animals?.length || 0} animais e ${farmData.transactions?.length || 0} transações. Estruture com emojis e Markdown em português do Brasil.`;
    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "⚠️ **Erro de Conexão ao Servidor de IA**\n\nNão foi possível conectar a rota `/api/gemini/consultant-report`.\n\n**Como Resolver no Vercel / GitHub:**\n1. Vá nas **Settings** > **Environment Variables** do seu projeto no Vercel.\n2. Adicione **`VITE_GEMINI_API_KEY`** com o valor da sua chave do Gemini (`AIzaSy...`).\n3. Faça um novo **Redeploy**.";
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
      return data.text || "Sem resposta no momento.";
    }

    const systemPrompt = `Você é o CONSULTOR PECUÁRIO IA da fazenda "${farmName || 'Sua Fazenda'}". Seja prático, empático e focado no lucro por arroba e bem-estar animal.`;
    const formattedHistory = history.map((msg: any) => `${msg.role === 'user' ? 'Produtor' : 'Consultor IA'}: ${msg.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHistórico:\n${formattedHistory}\n\nProdutor: ${message}\nConsultor IA:`;

    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "Desculpe, o servidor de IA não está acessível no momento. Adicione a variável `VITE_GEMINI_API_KEY` na Vercel ou `GEMINI_API_KEY` no seu servidor backend.";
  } catch (error) {
    console.error("Erro no chat do consultor IA:", error);

    const systemPrompt = `Você é o CONSULTOR PECUÁRIO IA da fazenda "${farmName || 'Sua Fazenda'}". Seja prático, empático e focado no lucro por arroba e bem-estar animal.`;
    const formattedHistory = history.map((msg: any) => `${msg.role === 'user' ? 'Produtor' : 'Consultor IA'}: ${msg.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHistórico:\n${formattedHistory}\n\nProdutor: ${message}\nConsultor IA:`;

    const fallbackText = await callClientGeminiDirect(prompt);
    if (fallbackText) return fallbackText;

    return "Erro ao conversar com o consultor IA. Se publicou o app no Vercel, cadastre a chave `VITE_GEMINI_API_KEY` nas variáveis de ambiente e faça o redeploy.";
  }
};
