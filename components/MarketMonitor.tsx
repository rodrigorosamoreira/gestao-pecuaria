
import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '../services/geminiService';
import { 
  TrendingUp, 
  Globe, 
  ExternalLink, 
  RefreshCcw, 
  BarChart4, 
  Info,
  Loader2,
  Building2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ScotQuoteBar from './ScotQuoteBar';
import { getSelectedScotQuote } from '../services/scotData';

interface MarketMonitorProps {
  onApplyPriceToCalculator?: (sellPrice: number, buyPrice?: number) => void;
  onNavigateToCalculators?: () => void;
}

const MarketMonitor: React.FC<MarketMonitorProps> = ({
  onApplyPriceToCalculator,
  onNavigateToCalculators
}) => {
  const [marketText, setMarketText] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const activeQuote = getSelectedScotQuote();

  const loadMarketData = async () => {
    setLoading(true);
    const result = await fetchMarketData(activeQuote.regionName);
    setMarketText(result.text);
    setSources(result.sources);
    setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    setLoading(false);
  };

  useEffect(() => {
    loadMarketData();
  }, [activeQuote.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug flex items-center gap-2.5">
            <BarChart4 className="text-[#145C46]" size={24} /> Monitor de Mercado Scot Consultoria
          </h2>
          <p className="text-[#64766C] text-[13px] leading-normal mt-1">Cotações da arroba do boi, vaca gorda e grãos por região em tempo real</p>
        </div>
        <button 
          onClick={loadMarketData} 
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#E3EAE6] text-[#20332C] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#E5F2EB] hover:text-[#145C46] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin text-[#145C46]" /> : <RefreshCcw size={16} className="text-[#145C46]" />}
          Atualizar Cotações
        </button>
      </div>

      {/* Bar de Cotação Regional da Arroba Scot Consultoria */}
      <ScotQuoteBar 
        onApplyPriceToCalculator={onApplyPriceToCalculator} 
        onNavigateToCalculators={onNavigateToCalculators} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Principal de Análise */}
        <div className="lg:col-span-8 space-y-6">
          <div className="agro-card overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-[#E3EAE6] bg-[#F6F8F5]/60 flex items-center justify-between gap-3">
               <div className="flex items-center gap-2.5">
                  <Globe className="text-[#145C46]" size={18} />
                  <h3 className="text-base font-semibold text-[#20332C]">
                    Relatório Regional — {activeQuote.regionName}
                  </h3>
               </div>
               <span className="text-xs font-normal text-[#64766C] font-nums">Última atualização: {lastUpdate}</span>
            </div>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto prose prose-emerald max-w-none text-sm leading-relaxed text-[#20332C]">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-[#64766C]">
                   <Loader2 size={40} className="animate-spin mb-3 text-[#218568]" />
                   <p className="text-sm font-medium">Consultando Scot Consultoria para {activeQuote.regionName}...</p>
                </div>
              ) : (
                <ReactMarkdown>{marketText}</ReactMarkdown>
              )}
            </div>

            {!loading && sources.length > 0 && (
              <div className="p-5 bg-[#F6F8F5] border-t border-[#E3EAE6]">
                <h4 className="text-xs font-medium text-[#64766C] mb-3 flex items-center gap-1.5">
                   <Info size={14} className="text-[#145C46]" /> Fontes e referências
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, idx) => (
                    <a 
                      key={`src-${idx}-${src.web?.uri || ''}`} 
                      href={src.web?.uri || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white border border-[#E3EAE6] px-3 py-1.5 rounded-lg text-xs font-medium text-[#145C46] hover:bg-[#DCEDE4] transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink size={12} />
                      {src.web?.title || 'Ver Fonte'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Widgets Laterais */}
        <div className="lg:col-span-4 space-y-6">
          <div className="agro-card p-6 space-y-5">
             <h3 className="text-base font-semibold text-[#20332C] leading-snug">Destaques da Região ({activeQuote.state})</h3>
             
             <div className="space-y-3">
                <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#DCEDE4] flex items-center justify-between transition-all">
                   <div>
                      <p className="text-xs font-medium text-[#145C46]">Boi Gordo (À Vista)</p>
                      <p className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">
                        R$ {activeQuote.boiGordoVista.toFixed(2)}<span className="text-sm font-normal text-[#64766C] ml-1">/@</span>
                      </p>
                   </div>
                   <div className="p-2.5 bg-[#DCEDE4] text-[#145C46] rounded-lg">
                      <TrendingUp size={18} />
                   </div>
                </div>

                <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex items-center justify-between transition-all">
                   <div>
                      <p className="text-xs font-medium text-[#64766C]">Vaca Gorda</p>
                      <p className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">
                        R$ {activeQuote.vacaGorda.toFixed(2)}<span className="text-sm font-normal text-[#64766C] ml-1">/@</span>
                      </p>
                   </div>
                   <div className="p-2.5 bg-white border border-[#E3EAE6] text-[#64766C] rounded-lg">
                      <Building2 size={18} />
                   </div>
                </div>

                <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex items-center justify-between transition-all">
                   <div>
                      <p className="text-xs font-medium text-[#64766C]">Milho (Saca 60 kg)</p>
                      <p className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">R$ {activeQuote.milhoSaca.toFixed(2)}</p>
                   </div>
                   <div className="p-2.5 bg-white border border-[#E3EAE6] text-[#64766C] rounded-lg">
                      <TrendingUp size={18} />
                   </div>
                </div>

                <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex items-center justify-between transition-all">
                   <div>
                      <p className="text-xs font-medium text-[#64766C]">Soja (Saca 60 kg)</p>
                      <p className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">R$ {activeQuote.sojaSaca.toFixed(2)}</p>
                   </div>
                   <div className="p-2.5 bg-white border border-[#E3EAE6] text-[#64766C] rounded-lg">
                      <TrendingUp size={18} />
                   </div>
                </div>
             </div>

             <div className="p-4 bg-[#DCEDE4]/50 rounded-xl border border-[#DCEDE4] space-y-2.5">
                <p className="text-xs font-semibold text-[#145C46]">Aplicação nos cálculos</p>
                <p className="text-[13px] text-[#64766C] leading-relaxed">
                   Você pode usar o valor de R$ {activeQuote.boiGordoVista.toFixed(2)}/@ da praça <strong className="font-semibold text-[#20332C]">{activeQuote.regionName}</strong> nas calculadoras de margem e simulação de venda.
                </p>
                {onApplyPriceToCalculator && (
                  <button 
                    onClick={() => onApplyPriceToCalculator(activeQuote.boiGordoVista, activeQuote.bezerroCabeca)}
                    className="w-full mt-1 bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-all cursor-pointer"
                  >
                    Usar R$ {activeQuote.boiGordoVista.toFixed(2)}/@ na Calculadora
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitor;
