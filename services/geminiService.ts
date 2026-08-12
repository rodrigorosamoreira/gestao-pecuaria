import { Animal, Transaction, InventoryItem, Lot } from "../types";

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

    const data = await response.json();
    if (!response.ok) {
      return data.error || "Não foi possível gerar a análise no momento.";
    }

    return data.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Erro na análise da fazenda via servidor:", error);
    return "Não foi possível conectar ao serviço de IA. Tente novamente mais tarde.";
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

    const data = await response.json();
    if (!response.ok) {
      return data.error || "Serviço de IA indisponível.";
    }

    return data.text || "Sem resposta.";
  } catch (e) {
    console.error("Erro no conselho rápido:", e);
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

    const data = await response.json();
    if (!response.ok) {
      return data.error || "Não foi possível analisar a mistura.";
    }

    return data.text || "Não foi possível analisar a mistura.";
  } catch (e) {
    console.error("Erro ao processar análise nutricional:", e);
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

    const data = await response.json();
    return {
      text: data.text || "Não foi possível obter os dados de mercado.",
      sources: data.sources || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado via servidor:", error);
    return { 
      text: "Erro ao conectar com o serviço de monitoramento de mercado. Tente novamente mais tarde.", 
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

    const data = await response.json();
    if (!response.ok) {
      return data.error || "Não foi possível gerar o relatório diagnóstico do consultor no momento.";
    }

    return data.text || "Relatório indisponível.";
  } catch (error) {
    console.error("Erro ao buscar relatório do consultor IA:", error);
    return "Erro de conexão ao servidor de IA. Tente novamente mais tarde.";
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

    const data = await response.json();
    if (!response.ok) {
      return data.error || "Não foi possível obter resposta do consultor.";
    }

    return data.text || "Sem resposta no momento.";
  } catch (error) {
    console.error("Erro no chat do consultor IA:", error);
    return "Erro ao conversar com o consultor IA. Verifique sua conexão e tente novamente.";
  }
};

