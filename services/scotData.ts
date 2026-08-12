export interface ScotRegionQuote {
  id: string;
  state: string;
  regionName: string;
  boiGordoVista: number; // R$/@ À Vista
  boiGordoPrazo: number; // R$/@ 30 dias
  vacaGorda: number;     // R$/@
  novilhaGorda: number;  // R$/@
  bezerroCabeca: number; // R$/cab
  milhoSaca: number;     // R$/saca 60kg
  sojaSaca: number;      // R$/saca 60kg
  trend: 'up' | 'down' | 'stable';
  variationPercent: number;
  lastUpdateDate?: string;
  notes?: string;
}

export const INITIAL_SCOT_QUOTES: ScotRegionQuote[] = [
  {
    id: 'SP_BARRETOS',
    state: 'SP',
    regionName: 'São Paulo (Barretos / Araçatuba)',
    boiGordoVista: 345.50,
    boiGordoPrazo: 350.00,
    vacaGorda: 321.00,
    novilhaGorda: 332.00,
    bezerroCabeca: 3480.00,
    milhoSaca: 65.00,
    sojaSaca: 142.00,
    trend: 'up',
    variationPercent: 0.8,
    lastUpdateDate: '11/08/2026',
    notes: 'Praça de referência Scot Consultoria (SP Barretos / Araçatuba)'
  },
  {
    id: 'SP_PRUDENTE',
    state: 'SP',
    regionName: 'São Paulo (Presidente Prudente)',
    boiGordoVista: 343.50,
    boiGordoPrazo: 348.00,
    vacaGorda: 319.00,
    novilhaGorda: 330.00,
    bezerroCabeca: 3450.00,
    milhoSaca: 63.50,
    sojaSaca: 140.00,
    trend: 'stable',
    variationPercent: 0.0,
    lastUpdateDate: '11/08/2026',
    notes: 'Escalas de abate médias de 7 a 9 dias'
  },
  {
    id: 'MG_TRIANGULO',
    state: 'MG',
    regionName: 'Minas Gerais (Triângulo Mineiro)',
    boiGordoVista: 333.00,
    boiGordoPrazo: 337.00,
    vacaGorda: 316.00,
    novilhaGorda: 324.00,
    bezerroCabeca: 3380.00,
    milhoSaca: 62.00,
    sojaSaca: 138.00,
    trend: 'up',
    variationPercent: 0.5,
    lastUpdateDate: '11/08/2026',
    notes: 'Forte demanda das indústrias exportadoras'
  },
  {
    id: 'MG_BH',
    state: 'MG',
    regionName: 'Minas Gerais (Belo Horizonte / Sul)',
    boiGordoVista: 338.00,
    boiGordoPrazo: 342.00,
    vacaGorda: 318.00,
    novilhaGorda: 326.00,
    bezerroCabeca: 3400.00,
    milhoSaca: 63.00,
    sojaSaca: 139.00,
    trend: 'stable',
    variationPercent: 0.1,
    lastUpdateDate: '11/08/2026',
    notes: 'Mercado interno estável'
  },
  {
    id: 'GO_GOIANIA',
    state: 'GO',
    regionName: 'Goiás (Goiânia)',
    boiGordoVista: 331.00,
    boiGordoPrazo: 335.00,
    vacaGorda: 312.00,
    novilhaGorda: 322.00,
    bezerroCabeca: 3515.00,
    milhoSaca: 59.50,
    sojaSaca: 135.00,
    trend: 'up',
    variationPercent: 0.6,
    lastUpdateDate: '11/08/2026',
    notes: 'Oferta de animais terminados enxuta'
  },
  {
    id: 'GO_RIOVERDE',
    state: 'GO',
    regionName: 'Goiás (Rio Verde / Região Sul)',
    boiGordoVista: 328.00,
    boiGordoPrazo: 332.00,
    vacaGorda: 310.00,
    novilhaGorda: 320.00,
    bezerroCabeca: 3480.00,
    milhoSaca: 58.00,
    sojaSaca: 134.00,
    trend: 'stable',
    variationPercent: 0.2,
    lastUpdateDate: '11/08/2026',
    notes: 'Polo de confinamento ativo'
  },
  {
    id: 'MT_CUIABA',
    state: 'MT',
    regionName: 'Mato Grosso (Cuiabá / Baixada Cuiabana)',
    boiGordoVista: 328.00,
    boiGordoPrazo: 332.00,
    vacaGorda: 305.00,
    novilhaGorda: 315.00,
    bezerroCabeca: 3250.00,
    milhoSaca: 48.00,
    sojaSaca: 129.00,
    trend: 'up',
    variationPercent: 0.9,
    lastUpdateDate: '11/08/2026',
    notes: 'Insumos de nutrição com preços atrativos no estado'
  },
  {
    id: 'MT_SINOP',
    state: 'MT',
    regionName: 'Mato Grosso (Norte / Sinop)',
    boiGordoVista: 326.00,
    boiGordoPrazo: 330.00,
    vacaGorda: 302.00,
    novilhaGorda: 312.00,
    bezerroCabeca: 3200.00,
    milhoSaca: 45.50,
    sojaSaca: 127.00,
    trend: 'stable',
    variationPercent: 0.0,
    lastUpdateDate: '11/08/2026',
    notes: 'Escalas de abate confortáveis nas plantas locais'
  },
  {
    id: 'MS_CAMPO_GRANDE',
    state: 'MS',
    regionName: 'Mato Grosso do Sul (Campo Grande)',
    boiGordoVista: 338.00,
    boiGordoPrazo: 342.00,
    vacaGorda: 315.00,
    novilhaGorda: 325.00,
    bezerroCabeca: 3710.00,
    milhoSaca: 58.50,
    sojaSaca: 136.00,
    trend: 'up',
    variationPercent: 0.4,
    lastUpdateDate: '11/08/2026',
    notes: 'Mercado aquecido para boi China'
  },
  {
    id: 'MS_DOURADOS',
    state: 'MS',
    regionName: 'Mato Grosso do Sul (Dourados)',
    boiGordoVista: 336.00,
    boiGordoPrazo: 340.00,
    vacaGorda: 313.00,
    novilhaGorda: 323.00,
    bezerroCabeca: 3680.00,
    milhoSaca: 57.00,
    sojaSaca: 135.00,
    trend: 'stable',
    variationPercent: 0.0,
    lastUpdateDate: '11/08/2026',
    notes: 'Reposição acompanhando ritmo do terminado'
  },
  {
    id: 'PR_MARINGA',
    state: 'PR',
    regionName: 'Paraná (Maringá / Noroeste)',
    boiGordoVista: 342.00,
    boiGordoPrazo: 346.00,
    vacaGorda: 318.00,
    novilhaGorda: 328.00,
    bezerroCabeca: 3450.00,
    milhoSaca: 60.00,
    sojaSaca: 142.00,
    trend: 'up',
    variationPercent: 0.3,
    lastUpdateDate: '11/08/2026',
    notes: 'Demanda regional firme para abastecimento local'
  },
  {
    id: 'RS_PELOTAS',
    state: 'RS',
    regionName: 'Rio Grande do Sul (Fronteira / Pelotas)',
    boiGordoVista: 335.00,
    boiGordoPrazo: 339.00,
    vacaGorda: 310.00,
    novilhaGorda: 320.00,
    bezerroCabeca: 3350.00,
    milhoSaca: 66.00,
    sojaSaca: 140.00,
    trend: 'stable',
    variationPercent: 0.0,
    lastUpdateDate: '11/08/2026',
    notes: 'Cotações em R$/kg de carcaça convertidas para arroba'
  },
  {
    id: 'BA_FEIRA',
    state: 'BA',
    regionName: 'Bahia (Feira de Santana / Vitória da Conquista)',
    boiGordoVista: 325.00,
    boiGordoPrazo: 329.00,
    vacaGorda: 300.00,
    novilhaGorda: 310.00,
    bezerroCabeca: 3100.00,
    milhoSaca: 65.00,
    sojaSaca: 135.00,
    trend: 'stable',
    variationPercent: -0.2,
    lastUpdateDate: '11/08/2026',
    notes: 'Mercado atacadista baiano com ritmo constante'
  },
  {
    id: 'PA_REDENCAO',
    state: 'PA',
    regionName: 'Pará (Redenção / Marabá)',
    boiGordoVista: 320.00,
    boiGordoPrazo: 324.00,
    vacaGorda: 295.00,
    novilhaGorda: 305.00,
    bezerroCabeca: 3000.00,
    milhoSaca: 61.00,
    sojaSaca: 130.00,
    trend: 'up',
    variationPercent: 0.7,
    lastUpdateDate: '11/08/2026',
    notes: 'Exportação em pé e frigoríficos do norte ativos'
  },
  {
    id: 'TO_ARAGUAINA',
    state: 'TO',
    regionName: 'Tocantins (Araguaína / Gurupi)',
    boiGordoVista: 322.00,
    boiGordoPrazo: 326.00,
    vacaGorda: 298.00,
    novilhaGorda: 308.00,
    bezerroCabeca: 3050.00,
    milhoSaca: 58.00,
    sojaSaca: 128.00,
    trend: 'up',
    variationPercent: 0.5,
    lastUpdateDate: '11/08/2026',
    notes: 'Crescimento na procura por fêmeas de reposição'
  },
  {
    id: 'RO_JIPARANA',
    state: 'RO',
    regionName: 'Rondônia (Ji-Paraná / Porto Velho)',
    boiGordoVista: 318.00,
    boiGordoPrazo: 322.00,
    vacaGorda: 292.00,
    novilhaGorda: 302.00,
    bezerroCabeca: 2950.00,
    milhoSaca: 56.00,
    sojaSaca: 125.00,
    trend: 'stable',
    variationPercent: 0.0,
    lastUpdateDate: '11/08/2026',
    notes: 'Atividade de abate regular no estado'
  },
  {
    id: 'MA_IMPERATRIZ',
    state: 'MA',
    regionName: 'Maranhão / Piauí (Imperatriz / Teresina)',
    boiGordoVista: 324.00,
    boiGordoPrazo: 328.00,
    vacaGorda: 298.00,
    novilhaGorda: 308.00,
    bezerroCabeca: 3050.00,
    milhoSaca: 62.00,
    sojaSaca: 129.00,
    trend: 'stable',
    variationPercent: 0.1,
    lastUpdateDate: '11/08/2026',
    notes: 'Mercado de reposição aquecido na região Matopiba'
  }
];

const LOCAL_STORAGE_KEY_REGION = 'scot_selected_region_id';
const LOCAL_STORAGE_KEY_QUOTES = 'scot_custom_quotes_data_v2';

export const getStoredScotQuotes = (): ScotRegionQuote[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_QUOTES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Verifica se os valores são do mercado atualizado (ex: SP_BARRETOS >= 300)
        const spQuote = parsed.find(q => q.id === 'SP_BARRETOS');
        if (spQuote && spQuote.boiGordoVista >= 300) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar cotações salvas:', e);
  }
  return INITIAL_SCOT_QUOTES;
};

export const saveScotQuotes = (quotes: ScotRegionQuote[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_QUOTES, JSON.stringify(quotes));
  } catch (e) {
    console.warn('Erro ao salvar cotações:', e);
  }
};

export const resetScotQuotesToDefault = (): ScotRegionQuote[] => {
  saveScotQuotes(INITIAL_SCOT_QUOTES);
  return INITIAL_SCOT_QUOTES;
};

export const getSelectedScotRegionId = (): string => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REGION);
    if (saved) return saved;
  } catch (e) {
    console.warn('Erro ao ler região selecionada:', e);
  }
  return 'SP_BARRETOS';
};

export const setSelectedScotRegionId = (id: string) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_REGION, id);
  } catch (e) {
    console.warn('Erro ao salvar região selecionada:', e);
  }
};

export const getSelectedScotQuote = (): ScotRegionQuote => {
  const regionId = getSelectedScotRegionId();
  const quotes = getStoredScotQuotes();
  return quotes.find(q => q.id === regionId) || quotes[0] || INITIAL_SCOT_QUOTES[0];
};
