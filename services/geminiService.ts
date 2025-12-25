
import { GoogleGenAI } from "@google/genai";
import { Animal, Transaction, InventoryItem, Lot } from "../types";

// Always use the API key exclusively from process.env.API_KEY and initialize with named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFarmStatus = async (
    animals: Animal[], 
    transactions: Transaction[], 
    inventory: InventoryItem[] = [], 
    lots: Lot[] = []
): Promise<string> => {
  // Assume process.env.API_KEY is available and configured per guidelines
  try {
    const animalSummary = animals.map(a => 
      `- ${a.earTag} (${a.breed}): ${a.weightKg}kg, GMD ult. pesagem: ${a.history[a.history.length-1]?.gmd?.toFixed(3) || 'N/A'}`
    ).slice(0, 30).join('\n'); // Limit to avoid token limit

    const stockSummary = inventory.map(i => 
      `- ${i.name}: ${i.quantity} ${i.unit} (Mín: ${i.minQuantity})`
    ).join('\n');

    const prompt = `
      Atue como um gerente de fazenda experiente. Analise os dados:
      
      1. ESTOQUE:
      ${stockSummary}
      
      2. REBANHO (Amostra):
      ${animalSummary}
      
      3. FINANCEIRO:
      Receita vs Despesa recente... (considere dados gerais)

      Gere um relatório focado em:
      - Alertas urgentes de estoque.
      - Animais com baixo desempenho (GMD).
      - Sugestões de manejo sanitário e nutricional.
    `;

    // Using gemini-3-pro-preview for complex reasoning tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error(error);
    return "Erro ao consultar IA.";
  }
};

export const getQuickAdvice = async (question: string): Promise<string> => {
  try {
    // Using gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Responda de forma curta e técnica para um pecuarista: ${question}`
    });
    return response.text || "Sem resposta.";
  } catch (e) {
    return "Erro no serviço de IA.";
  }
};

export const analyzeFeedFormula = async (ingredients: { name: string; percent: number }[]): Promise<string> => {
  const ingredientsList = ingredients.map(i => `- ${i.name}: ${i.percent}%`).join('\n');

  const prompt = `
    Atue como um Nutricionista de Ruminantes (Zootecnista). Analise a seguinte formulação de ração/suplemento para gado de corte:

    Ingredientes:
    ${ingredientsList}

    Por favor, forneça uma estimativa técnica contendo:
    1. **Composição Nutricional Estimada** (Matéria Seca, Proteína Bruta (PB), Energia (NDT)).
    2. **Categoria Animal Recomendada** (Ex: Recria, Terminação, Creep, etc.).
    3. **Estimativa de GMD (Ganho Médio Diário)** esperado para esta dieta (considerando um pasto de qualidade média como base).
    4. **Observações/Correções**: Se a soma não for 100% ou se houver desbalanceamento grave (ex: excesso de ureia, falta de fibra, relação Ca:P), alerte.
    
    Seja direto e use formatação Markdown.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning and mathematical estimates
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return response.text || "Não foi possível analisar a mistura.";
  } catch (e) {
    console.error(e);
    return "Erro ao processar análise nutricional.";
  }
};
