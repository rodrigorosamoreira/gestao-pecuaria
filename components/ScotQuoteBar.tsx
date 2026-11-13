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
      <div className="bg-white text-[#20332C] p-4 sm:p-5 rounded-xl shadow-xs border border-[#E3EAE6] flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-[#DCEDE4] text-[#145C46] rounded-xl shrink-0 border border-[#DCEDE4]">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#64766C]">Arroba do Boi (Scot)</span>
              <span className="text-xs font-medium bg-[#DCEDE4] text-[#145C46] px-2 py-0.5 rounded-md">{selectedQuote.state}</span>
            </div>
            <p className="text-2xl font-semibold text-[#20332C] font-nums mt-0.5">
              R$ {selectedQuote.boiGordoVista.toFixed(2)} <span className="text-sm font-normal text-[#64766C] ml-1">/@ (À Vista)</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedRegionId}
              onChange={handleRegionChange}
              className="w-full sm:w-auto bg-[#F6F8F5] border border-[#E3EAE6] text-[#20332C] text-sm font-medium py-2 px-3 rounded-lg outline-none focus:ring-1 focus:ring-[#145C46] cursor-pointer sm:max-w-[210px] truncate"
            >
              {quotes.map(q => (
                <option key={q.id} value={q.id} className="bg-white text-[#20332C]">
                  {q.regionName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleApplyToCalc}
            className="bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            title="Usar esta cotação nas calculadoras de margem e simulador"
          >
            <Calculator size={16} />
            {appliedNotification ? 'Aplicado!' : 'Usar nos Cálculos'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agro-card p-6 sm:p-7 space-y-6 font-sans">
      {/* Top Bar / Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E3EAE6] pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-[#DCEDE4] text-[#145C46] rounded-xl border border-[#DCEDE4] shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-medium text-[#145C46] bg-[#DCEDE4] px-2.5 py-0.5 rounded-md">
                Scot Consultoria & CEPEA
              </span>
              <span className="text-[#64766C] font-normal flex items-center gap-1">
                <MapPin size={13} className="text-[#218568]" /> Praça selecionada
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#20332C] leading-snug mt-1">
              Cotações Regionais da Arroba do Boi
            </h3>
          </div>
        </div>

        {/* Seletor de Região */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#64766C] block">
              Selecione a região
            </label>
            <div className="relative">
              <select
                value={selectedRegionId}
                onChange={handleRegionChange}
                className="w-full sm:w-auto bg-[#F6F8F5] hover:bg-[#E5F2EB] text-[#20332C] text-sm font-medium py-2.5 pl-3.5 pr-9 rounded-lg border border-[#E3EAE6] outline-none focus:ring-2 focus:ring-[#145C46] cursor-pointer transition-all"
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
              className="bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator size={16} />
              {appliedNotification ? (
                <span className="flex items-center gap-1.5">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Boi Gordo À Vista */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#DCEDE4] relative group hover:border-[#218568] transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-[#145C46]">Boi Gordo (À Vista)</p>
            <button 
              onClick={() => {
                setEditingPrice(selectedQuote.boiGordoVista);
                setIsEditing(!isEditing);
              }} 
              className="text-[#64766C] hover:text-[#145C46] transition-colors cursor-pointer"
              title="Ajustar preço negociado localmente"
            >
              <Edit2 size={13} />
            </button>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-medium text-[#145C46]">R$</span>
              <input 
                type="number"
                step="0.5"
                value={editingPrice}
                onChange={e => setEditingPrice(Number(e.target.value))}
                className="w-20 bg-white text-[#20332C] font-semibold text-sm px-2 py-1 rounded-md border border-[#218568] outline-none font-nums"
              />
              <button 
                onClick={handleSaveCustomPrice}
                className="bg-[#145C46] text-white p-1.5 rounded-md hover:bg-[#0E4434] cursor-pointer"
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
                R$ {selectedQuote.boiGordoVista.toFixed(2)}
              </p>
              <p className="text-xs font-normal text-[#64766C] mt-1">por arroba (@)</p>
            </div>
          )}
        </div>

        {/* Boi Gordo 30 Dias */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] hover:border-[#CBD5E1] transition-all">
          <p className="text-xs font-medium text-[#64766C] mb-1.5">Boi Gordo (30 Dias)</p>
          <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
            R$ {selectedQuote.boiGordoPrazo.toFixed(2)}
          </p>
          <p className="text-xs font-normal text-[#64766C] mt-1">por arroba (@)</p>
        </div>

        {/* Vaca Gorda */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] hover:border-[#CBD5E1] transition-all">
          <p className="text-xs font-medium text-[#64766C] mb-1.5">Vaca Gorda</p>
          <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
            R$ {selectedQuote.vacaGorda.toFixed(2)}
          </p>
          <p className="text-xs font-normal text-[#64766C] mt-1">por arroba (@)</p>
        </div>

        {/* Novilha Gorda */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] hover:border-[#CBD5E1] transition-all">
          <p className="text-xs font-medium text-[#64766C] mb-1.5">Novilha Gorda</p>
          <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
            R$ {selectedQuote.novilhaGorda.toFixed(2)}
          </p>
          <p className="text-xs font-normal text-[#64766C] mt-1">por arroba (@)</p>
        </div>

        {/* Bezerro de Reposição */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] hover:border-[#CBD5E1] transition-all">
          <p className="text-xs font-medium text-[#64766C] mb-1.5">Bezerro (Reposição)</p>
          <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
            R$ {selectedQuote.bezerroCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs font-normal text-[#64766C] mt-1">por cabeça (aprox.)</p>
        </div>

        {/* Insumos Grãos */}
        <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] hover:border-[#CBD5E1] transition-all">
          <p className="text-xs font-medium text-[#64766C] mb-1.5">Insumos (Saca 60 kg)</p>
          <div className="space-y-1 font-nums">
            <p className="text-sm font-normal text-[#64766C]">
              Milho: <span className="font-semibold text-[#20332C]">R$ {selectedQuote.milhoSaca.toFixed(2)}</span>
            </p>
            <p className="text-sm font-normal text-[#64766C]">
              Soja: <span className="font-semibold text-[#20332C]">R$ {selectedQuote.sojaSaca.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Observação / Rodapé informativo */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#64766C] gap-3 pt-3 border-t border-[#E3EAE6]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#218568]"></span>
          <span>
            Praça: <strong className="font-semibold text-[#20332C]">{selectedQuote.regionName}</strong> — {selectedQuote.notes || 'Scot Consultoria'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleResetQuotes}
            className="text-xs font-semibold text-[#64766C] hover:text-[#20332C] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sincronizar com valores oficiais da Scot Consultoria"
          >
            <RefreshCcw size={13} /> Atualizar cotações oficiais
          </button>
          <a
            href="https://www.scotconsultoria.com.br/cotacoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#145C46] hover:underline flex items-center gap-1"
          >
            Site Scot Consultoria <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ScotQuoteBar;
