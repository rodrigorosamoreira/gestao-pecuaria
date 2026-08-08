
import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

const getAiClient = (): GoogleGenAI | null => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '""' || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Erro ao inicializar o cliente GoogleGenAI:", err);
    return null;
  }
};

// Analisa o status da fazenda com base nos dados do rebanho, estoque e lotes.
export const analyzeFarmStatus = async (
    animals: Animal[], 
    transactions: Transaction[], 
    inventory: InventoryItem[] = [], 
    lots: Lot[] = []
): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return "Serviço de IA não disponível no momento. Verifique a chave de API nas configurações.";
    }

    const animalSummary = animals.map(a => 
      `- ${a.earTag} (${a.breed}): ${a.weightKg}kg, GMD ult. pesagem: ${a.history[a.history.length-1]?.gmd?.toFixed(3) || 'N/A'}`
    ).slice(0, 30).join('\n');

    const stockSummary = inventory.map(i => 
      `- ${i.name}: ${i.quantity} ${i.unit} (Mín: ${i.minQuantity})`
    ).join('\n');

    const prompt = `
      Atue como um gerente de fazenda experiente. Analise os dados:
      
      1. ESTOQUE:
      ${stockSummary}
      
      2. REBANHO (Amostra):
      ${animalSummary}
      
      Gere um relatório focado em alertas e sugestões de manejo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    });

    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Erro na análise da fazenda via Gemini:", error);
    return "Não foi possível conectar ao serviço de IA. Verifique sua conexão e tente novamente.";
  }
};

// Fornece conselhos rápidos e técnicos para perguntas do produtor.
export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return "Serviço de IA não disponível no momento. Verifique a chave de API nas configurações.";
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Responda de forma curta e técnica para um pecuarista: ${question}`
    });
    return response.text || "Sem resposta.";
  } catch (e) {
    console.error("Erro no conselho rápido:", e);
    return "Erro no serviço de IA. Verifique sua conexão e tente novamente.";
  }
};

// Analisa a formulação de ração e fornece observações técnicas.
export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return "Serviço de IA não disponível no momento.";
    }
    const ingredientsList = ingredients.map(i => `- ${i.name}: ${i.percent}%`).join('\n');
    const prompt = `Analise a seguinte formulação de ração: \n${ingredientsList}\nForneça composição estimada e observações técnicas.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    });
    return response.text || "Não foi possível analisar a mistura.";
  } catch (e) {
    console.error("Erro ao processar análise nutricional:", e);
    return "Erro ao processar análise nutricional. Tente novamente mais tarde.";
  }
};

/**
 * Busca dados de mercado atualizados (Boi Gordo, Milho, Soja) no Brasil usando Google Search.
 * Essencial para o componente MarketMonitor.
 */
export const fetchMarketData = async (): Promise<{ text: string; sources: any[] }> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return {
        text: "Serviço de IA não configurado. Por favor, certifique-se de definir a GEMINI_API_KEY no ambiente.",
        sources: []
      };
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Forneça um relatório atualizado sobre as cotações do Boi Gordo, Milho e Soja no Brasil, mencionando Scot Consultoria e CEPEA. Use formatação Markdown.',
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Não foi possível obter dados de mercado no momento.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado via Gemini (tentando fallback):", error);
    try {
      const ai = getAiClient();
      if (ai) {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Forneça uma estimativa e panorama geral das cotações do Boi Gordo, Milho e Soja no Brasil (Scot Consultoria e CEPEA). Use formatação Markdown.',
        });
        return {
          text: fallbackResponse.text || "Sem informações de mercado no momento.",
          sources: []
        };
      }
    } catch (fallbackError) {
      console.error("Erro no fallback de mercado:", fallbackError);
    }
    return { 
      text: "Erro ao conectar com o serviço de monitoramento de mercado. Verifique sua conexão e tente novamente mais tarde.", 
      sources: [] 
    };
  }
};

