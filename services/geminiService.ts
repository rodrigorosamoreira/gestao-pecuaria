
import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analisa o status da fazenda com base nos dados do rebanho, estoque e lotes.
export const analyzeFarmStatus = async (
    animals: Animal[], 
    transactions: Transaction[], 
    inventory: InventoryItem[] = [], 
    lots: Lot[] = []
): Promise<string> => {
  try {
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
      model: 'gemini-3-pro-preview',
      contents: prompt
    });

    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error(error);
    return "Erro ao consultar IA.";
  }
};

// Fornece conselhos rápidos e técnicos para perguntas do produtor.
export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Responda de forma curta e técnica para um pecuarista: ${question}`
    });
    return response.text || "Sem resposta.";
  } catch (e) {
    return "Erro no serviço de IA.";
  }
};

// Analisa a formulação de ração e fornece observações técnicas.
export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  const ingredientsList = ingredients.map(i => `- ${i.name}: ${i.percent}%`).join('\n');
  const prompt = `Analise a seguinte formulação de ração: \n${ingredientsList}\nForneça composição estimada e observações técnicas.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return response.text || "Não foi possível analisar a mistura.";
  } catch (e) {
    return "Erro ao processar análise nutricional.";
  }
};

/**
 * Busca dados de mercado atualizados (Boi Gordo, Milho, Soja) no Brasil usando Google Search.
 * Essencial para o componente MarketMonitor.
 */
export const fetchMarketData = async (): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Forneça um relatório atualizado sobre as cotações do Boi Gordo, Milho e Soja no Brasil, mencionando Scot Consultoria e CEPEA. Use formatação Markdown.',
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Não foi possível obter dados de mercado no momento.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado via Gemini:", error);
    return { 
      text: "Erro ao conectar com o serviço de monitoramento de mercado. Tente novamente mais tarde.", 
      sources: [] 
    };
  }
};
