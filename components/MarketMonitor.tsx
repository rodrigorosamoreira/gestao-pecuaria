
import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '../services/geminiService';
import { 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ExternalLink, 
  RefreshCcw, 
  BarChart4, 
  Info,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MarketMonitor: React.FC = () => {
  const [marketText, setMarketText] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadMarketData = async () => {
    setLoading(true);
    const result = await fetchMarketData();
    setMarketText(result.text);
    setSources(result.sources);
    setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    setLoading(false);
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase flex items-center gap-3">
            <BarChart4 className="text-emerald-600" size={28} /> Monitor de Mercado
          </h2>
          <p className="text-gray-500 text-sm italic">Dados em tempo real baseados na Scot Consultoria e CEPEA</p>
        </div>
        <button 
          onClick={loadMarketData} 
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          Atualizar Cotações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Principal de Análise */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Globe className="text-blue-500" size={20} />
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Relatório de Cotações</span>
               </div>
               <span className="text-[10px] font-bold text-gray-400">Última atualização: {lastUpdate}</span>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto prose prose-emerald max-w-none">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                   <Loader2 size={48} className="animate-spin mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">Consultando Scot Consultoria...</p>
                </div>
              ) : (
                <ReactMarkdown>{marketText}</ReactMarkdown>
              )}
            </div>

            {!loading && sources.length > 0 && (
              <div className="p-6 bg-blue-50/50 border-t border-blue-100">
                <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Info size={14} /> Fontes e Referências
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, idx) => (
                    <a 
                      key={idx} 
                      href={src.web?.uri || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink size={10} />
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
          <div className="bg-[#1a1f2c] text-white rounded-[2.5rem] p-8 shadow-xl border-[6px] border-[#252b3a] space-y-6">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Destaques da Bolsa</h3>
             
             <div className="space-y-4">
                <div className="bg-[#252b3a] p-5 rounded-3xl border border-gray-700/30 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Boi Gordo (SP)</p>
                      <p className="text-xl font-black text-white">Consulte Relatório</p>
                   </div>
                   <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                   </div>
                </div>

                <div className="bg-[#252b3a] p-5 rounded-3xl border border-gray-700/30 flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Milho (Saca)</p>
                      <p className="text-xl font-black text-white">Consulte Relatório</p>
                   </div>
                   <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                   </div>
                </div>

                <div className="bg-[#252b3a] p-5 rounded-3xl border border-gray-700/30 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Soja (Saca)</p>
                      <p className="text-xl font-black text-white">Consulte Relatório</p>
                   </div>
                   <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                   </div>
                </div>
             </div>

             <div className="p-6 bg-emerald-600/10 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Insight de Venda</p>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                   "Aproveite as janelas de baixa no milho para travar seus custos de suplementação para o próximo semestre."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitor;
