import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  Calculator, 
  ExternalLink,
  Edit2,
  Check,
  RefreshCcw,
  CheckCircle2,
  Building2,
  Layers
} from 'lucide-react';
import { 
  ScotRegionQuote, 
  getStoredScotQuotes, 
  getSelectedScotRegionId, 
  setSelectedScotRegionId, 
  saveScotQuotes,
  resetScotQuotesToDefault 
} from '../services/scotData';
import { fetchMarketData } from '../services/geminiService';

interface ScotQuoteBarProps {
  onApplyPriceToCalculator?: (sellPrice: number, buyPrice?: number) => void;
  onNavigateToCalculators?: () => void;
  compact?: boolean;
}

const ScotQuoteBar: React.FC<ScotQuoteBarProps> = ({ 
  onApplyPriceToCalculator, 
  onNavigateToCalculators,
  compact = false 
}) => {
  const [quotes, setQuotes] = useState<ScotRegionQuote[]>(getStoredScotQuotes());
  const [selectedRegionId, setSelectedRegionIdState] = useState<string>(getSelectedScotRegionId());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const selectedQuote = quotes.find(q => q.id === selectedRegionId) || quotes[0];

  useEffect(() => {
    setSelectedScotRegionId(selectedRegionId);
  }, [selectedRegionId]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedRegionIdState(newId);
    setSelectedScotRegionId(newId);
    setIsEditing(false);
  };

  const handleSaveCustomPrice = () => {
    if (editingPrice <= 0) return;
    const updated = quotes.map(q => {
      if (q.id === selectedRegionId) {
        return {
          ...q,
          boiGordoVista: editingPrice,
          boiGordoPrazo: Number((editingPrice * 1.012).toFixed(2)),
          lastUpdateDate: new Date().toLocaleDateString('pt-BR')
        };
      }
      return q;
    });
    setQuotes(updated);
    saveScotQuotes(updated);
    setIsEditing(false);
  };

  const handleResetQuotes = () => {
    const fresh = resetScotQuotesToDefault();
    setQuotes(fresh);
    setIsEditing(false);
  };

  const handleApplyToCalc = () => {
    if (selectedQuote && onApplyPriceToCalculator) {
      onApplyPriceToCalculator(selectedQuote.boiGordoVista, selectedQuote.bezerroCabeca);
    } else if (onNavigateToCalculators) {
      onNavigateToCalculators();
    }
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3000);
  };

  const handleAiRefresh = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetchMarketData(selectedQuote.regionName);
      if (res.text) {
        // Exemplo de parse básico ou feedback visual do relatório atualizado
        console.log('Relatório regional obtido:', res.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-emerald-950 text-white p-4 rounded-xl shadow-xs border border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-emerald-800/80 text-emerald-300 rounded-lg shrink-0 border border-emerald-700/50">
            <Building2 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Arroba do Boi (Scot)</span>
              <span className="text-[9px] bg-emerald-800/60 text-emerald-200 border border-emerald-700/60 px-1.5 py-0.2 rounded font-semibold">{selectedQuote.state}</span>
            </div>
            <p className="text-lg font-black text-white font-nums tracking-tight">
              R$ {selectedQuote.boiGordoVista.toFixed(2)} <span className="text-xs font-normal text-emerald-300/80">/@ (À Vista)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={selectedRegionId}
              onChange={handleRegionChange}
              className="bg-emerald-900/90 border border-emerald-800 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer max-w-[200px] truncate"
            >
              {quotes.map(q => (
                <option key={q.id} value={q.id} className="bg-emerald-950 text-white">
                  {q.regionName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleApplyToCalc}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer border border-emerald-500/40"
            title="Usar esta cotação nas calculadoras de margem e simulador"
          >
            <Calculator size={14} />
            {appliedNotification ? 'Aplicado!' : 'Usar nos Cálculos'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#121622] via-[#1a1f2c] to-[#252c3f] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border-[4px] border-[#252b3a] space-y-6 relative overflow-hidden">
      {/* Elemento Decorativo no fundo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar / Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Building2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Scot Consultoria & CEPEA
              </span>
              <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                <MapPin size={12} className="text-emerald-400" /> Praça Selecionada
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Cotações Regionais da Arroba do Boi
            </h3>
          </div>
        </div>

        {/* Seletor de Região */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              Selecione a Região:
            </label>
            <div className="relative">
              <select
                value={selectedRegionId}
                onChange={handleRegionChange}
                className="w-full sm:w-auto bg-[#252b3a] hover:bg-[#2e3547] text-white text-xs font-black py-3 pl-4 pr-10 rounded-2xl border border-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner transition-all"
              >
                {quotes.map((q, idx) => (
                  <option key={`${q.id}-${idx}`} value={q.id}>
                    {q.state} - {q.regionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {onApplyPriceToCalculator && (
            <button
              type="button"
              onClick={handleApplyToCalc}
              className="mt-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-5 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <Calculator size={16} />
              {appliedNotification ? (
                <span className="flex items-center gap-1 text-emerald-200">
                  <CheckCircle2 size={16} /> Cotação Aplicada!
                </span>
              ) : (
                'Aplicar nas Calculadoras'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Grid de Valores Principais da Região */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Boi Gordo À Vista */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-emerald-500/30 relative group hover:border-emerald-500 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Boi Gordo (À Vista)</p>
            <button 
              onClick={() => {
                setEditingPrice(selectedQuote.boiGordoVista);
                setIsEditing(!isEditing);
              }} 
              className="text-gray-500 hover:text-white transition-colors"
              title="Ajustar preço negociado localmente"
            >
              <Edit2 size={12} />
            </button>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-bold text-emerald-400">R$</span>
              <input 
                type="number"
                step="0.5"
                value={editingPrice}
                onChange={e => setEditingPrice(Number(e.target.value))}
                className="w-20 bg-black/50 text-white font-black text-sm px-2 py-1 rounded border border-emerald-500 outline-none"
              />
              <button 
                onClick={handleSaveCustomPrice}
                className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-500"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-black text-white tracking-tight">
                R$ {selectedQuote.boiGordoVista.toFixed(2)}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">por Arroba (@)</p>
            </div>
          )}
        </div>

        {/* Boi Gordo 30 Dias */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-gray-700/50 hover:border-gray-500 transition-all shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Boi Gordo (30 Dias)</p>
          <p className="text-2xl font-black text-gray-200 tracking-tight">
            R$ {selectedQuote.boiGordoPrazo.toFixed(2)}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">por Arroba (@)</p>
        </div>

        {/* Vaca Gorda */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-gray-700/50 hover:border-gray-500 transition-all shadow-sm">
          <p className="text-[10px] font-black text-pink-400 uppercase tracking-wider mb-1">Vaca Gorda</p>
          <p className="text-2xl font-black text-white tracking-tight">
            R$ {selectedQuote.vacaGorda.toFixed(2)}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">por Arroba (@)</p>
        </div>

        {/* Novilha Gorda */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-gray-700/50 hover:border-gray-500 transition-all shadow-sm">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Novilha Gorda</p>
          <p className="text-2xl font-black text-white tracking-tight">
            R$ {selectedQuote.novilhaGorda.toFixed(2)}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">por Arroba (@)</p>
        </div>

        {/* Bezerro de Reposição */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-gray-700/50 hover:border-gray-500 transition-all shadow-sm">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-wider mb-1">Bezerro (Reposição)</p>
          <p className="text-2xl font-black text-white tracking-tight">
            R$ {selectedQuote.bezerroCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">por Cabeça (Aproximado)</p>
        </div>

        {/* Insumos Grãos */}
        <div className="bg-[#212736] p-4 rounded-2xl border border-gray-700/50 hover:border-gray-500 transition-all shadow-sm">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Insumos (Saca 60kg)</p>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-white">
              Milho: <span className="text-yellow-400">R$ {selectedQuote.milhoSaca.toFixed(2)}</span>
            </p>
            <p className="text-sm font-black text-white">
              Soja: <span className="text-blue-400">R$ {selectedQuote.sojaSaca.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Observação / Rodapé informativo */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3 pt-2 border-t border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Praça: <strong className="text-white">{selectedQuote.regionName}</strong> — {selectedQuote.notes || 'Scot Consultoria'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetQuotes}
            className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Sincronizar com valores oficiais da Scot Consultoria"
          >
            <RefreshCcw size={12} /> Atualizar Cotações Oficiais
          </button>
          <a
            href="https://www.scotconsultoria.com.br/cotacoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            Site Scot Consultoria <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ScotQuoteBar;
