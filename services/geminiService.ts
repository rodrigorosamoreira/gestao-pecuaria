import { Animal, Transaction, InventoryItem, Lot } from "../types";

// Analisa o status da fazenda com base nos dados do rebanho, estoque e lotes.
export const analyzeFarmStatus = async (
    animals: Animal[], 
    transactions: Transaction[], 
    inventory: InventoryItem[] = [], 
    lots: Lot[] = []
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/analyze-farm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animals, transactions, inventory, lots })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.analysis || "Sem análise disponível.";
  } catch (error) {
    console.error("Erro em analyzeFarmStatus:", error);
    return "⚠️ Erro ao comunicar com o servidor de IA. Tente novamente em alguns momentos.";
  }
};

// Fornece conselhos rápidos e técnicos para perguntas do produtor.
export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/quick-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text || "Sem resposta.";
  } catch (e) {
    console.error("Erro em getQuickAdvice:", e);
    return "⚠️ Serviço de IA temporariamente indisponível.";
  }
};

// Analisa a formulação de ração e fornece observações técnicas.
export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai/feed-formula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text || "Não foi possível analisar a mistura.";
  } catch (e) {
    console.error("Erro em analyzeFeedFormula:", e);
    return "⚠️ Erro ao processar análise nutricional.";
  }
};

/**
 * Busca dados de mercado atualizados (Boi Gordo, Milho, Soja) no Brasil usando Google Search.
 * Essencial para o componente MarketMonitor.
 */
export const fetchMarketData = async (): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await fetch('/api/ai/market-data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      text: data.text || "Não foi possível obter dados de mercado no momento.",
      sources: data.sources || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado via API:", error);
    return { 
      text: "⚠️ Erro ao conectar com o serviço de monitoramento de mercado. Tente novamente em alguns instantes.", 
      sources: [] 
    };
  }
};
