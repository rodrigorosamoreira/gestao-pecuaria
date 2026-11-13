import React, { useState } from 'react';
import { Lot, Animal, AnimalStatus, LotWeighingRecord } from '../types';
import { 
  Layers, Plus, Edit2, Users, Scale, DollarSign, X, 
  TrendingUp, Sparkles, Calendar, History, CheckCircle2, 
  Info, ArrowRight, ShieldCheck, Tag, Trash2, AlertTriangle
} from 'lucide-react';
import { 
  getTodayDateString, 
  calculateLotWeighingStats, 
  calculateGMDFromWeighing,
  getDaysDifference 
} from '../services/weightService';

interface LotManagerProps {
  lots: Lot[];
  animals: Animal[];
  onAddLot: (lot: Lot) => void;
  onUpdateLot: (lot: Lot) => void;
  onDeleteLot?: (lotId: string) => void;
  onSellLot?: (lotId: string, date: string, totalValue: number) => void;
  onBatchWeighLot?: (lotId: string, date: string, newAvgWeight: number, gmd: number, applyMode: 'uniform' | 'gain_delta') => void;
}

const SAMPLE_LOT_NAMES = [
  'Pasto 01 - Recria Nelore',
  'Piquete 02 - Terminação & Cruzamento',
  'Fazenda (Lote Geral)',
  'Fazenda'
];

const isSampleLot = (lot: Lot): boolean =>
  lot.id.startsWith('lot-recria-') ||
  lot.id.startsWith('lot-engorda-') ||
  lot.id.startsWith('lot-fazenda') ||
  SAMPLE_LOT_NAMES.includes(lot.name);

const LotManager: React.FC<LotManagerProps> = ({ 
  lots, 
  animals, 
  onAddLot, 
  onUpdateLot, 
  onDeleteLot,
  onSellLot, 
  onBatchWeighLot 
}) => {
  const todayStr = getTodayDateString();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isWeighModalOpen, setIsWeighModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [isClearSamplesModalOpen, setIsClearSamplesModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [currentLot, setCurrentLot] = useState<Lot>({ id: '', name: '', description: '', averageGmd: 0.8 });

  const sampleLots = lots.filter(isSampleLot);

  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };
  
  const [sellDate, setSellDate] = useState(todayStr);
  const [sellValue, setSellValue] = useState<number>(0);

  // Estados de Pesagem do Lote
  const [lotWeighDate, setLotWeighDate] = useState(todayStr);
  const [lotWeighAvgValue, setLotWeighAvgValue] = useState<number>(350);
  const [lotWeighUnit, setLotWeighUnit] = useState<'kg' | 'arroba'>('kg');
  const [lotWeighGmd, setLotWeighGmd] = useState<number>(0.8);
  const [isLotWeighGmdManual, setIsLotWeighGmdManual] = useState(false);
  const [lotWeighApplyMode, setLotWeighApplyMode] = useState<'uniform' | 'gain_delta'>('uniform');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gmdValue = typeof currentLot.averageGmd === 'number' && !isNaN(currentLot.averageGmd) 
      ? Number(currentLot.averageGmd) 
      : 0.8;
      
    const lotToSave: Lot = {
      ...currentLot,
      averageGmd: gmdValue
    };

    if (currentLot.id) {
      onUpdateLot(lotToSave);
    } else {
      onAddLot({ 
        ...lotToSave, 
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        history: []
      });
    }
    closeModal();
  };

  const openModal = (lot?: Lot) => {
    setCurrentLot(lot ? { ...lot, averageGmd: lot.averageGmd ?? 0.8 } : { id: '', name: '', description: '', averageGmd: 0.8 });
    setIsModalOpen(true);
  };

  const openSellModal = (lot: Lot) => {
    setCurrentLot(lot);
    setSellValue(0);
    setIsSellModalOpen(true);
  };

  const openWeighModal = (lot: Lot) => {
    setCurrentLot(lot);
    const lotAnimals = animals.filter(a => a.lotId === lot.id && a.status === AnimalStatus.ACTIVE);
    const stats = calculateLotWeighingStats(lotAnimals, todayStr, lot);
    setLotWeighDate(todayStr);
    setLotWeighAvgValue(stats.avgRecordedWeightKg || 350);
    setLotWeighUnit('kg');
    setLotWeighGmd(lot.averageGmd ?? stats.avgGmd ?? 0.8);
    setIsLotWeighGmdManual(false);
    setLotWeighApplyMode('uniform');
    setIsWeighModalOpen(true);
  };

  const openHistoryModal = (lot: Lot) => {
    setCurrentLot(lot);
    setIsHistoryModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSellModalOpen(false);
    setIsWeighModalOpen(false);
    setIsHistoryModalOpen(false);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSellLot && currentLot.id) {
      onSellLot(currentLot.id, sellDate, sellValue);
      setIsSellModalOpen(false);
    }
  };

  const handleWeighSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLot.id) return;

    const lotAnimals = animals.filter(a => a.lotId === currentLot.id && a.status === AnimalStatus.ACTIVE);
    if (lotAnimals.length === 0) {
      showToast('Este piquete não possui animais ativos para pesagem.', 'warning');
      return;
    }

    const finalAvgWeightKg = lotWeighUnit === 'kg' ? lotWeighAvgValue : lotWeighAvgValue * 30;
    const stats = calculateLotWeighingStats(lotAnimals, todayStr, currentLot);
    const autoGmd = calculateGMDFromWeighing(stats.avgRecordedWeightKg, finalAvgWeightKg, stats.mostRecentWeighingDate, lotWeighDate).gmd;
    const finalGmd = isLotWeighGmdManual ? lotWeighGmd : autoGmd;

    if (onBatchWeighLot) {
      onBatchWeighLot(currentLot.id, lotWeighDate, finalAvgWeightKg, finalGmd, lotWeighApplyMode);
    }
    setIsWeighModalOpen(false);
  };

  const handleConfirmDeleteLot = () => {
    if (!lotToDelete || !onDeleteLot) return;
    const deletedName = lotToDelete.name;
    onDeleteLot(lotToDelete.id);
    setLotToDelete(null);
    setIsModalOpen(false);
    showToast(`Piquete "${deletedName}" excluído com sucesso!`);
  };

  const handleConfirmClearSampleLots = () => {
    if (!onDeleteLot || sampleLots.length === 0) return;
    const count = sampleLots.length;
    sampleLots.forEach(lot => onDeleteLot(lot.id));
    setIsClearSamplesModalOpen(false);
    showToast(`${count} ${count === 1 ? 'piquete de amostra excluído' : 'piquetes de amostra excluídos'} com sucesso!`);
  };

  return (
    <div className="space-y-6 font-sans">
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl border flex items-start gap-3 max-w-md animate-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === 'warning'
            ? 'bg-amber-950/95 text-amber-100 border-amber-500/40'
            : 'bg-[#145C46] text-white border-[#0E4434]'
        }`}>
          <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
            {toastMsg.type === 'warning' ? <AlertTriangle size={18} className="text-amber-300" /> : <CheckCircle2 size={18} className="text-[#DCEDE4]" />}
          </div>
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {toastMsg.text}
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/70 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug flex items-center gap-2.5">
            <Layers className="text-[#145C46]" size={24} /> Gestão de Piquetes
          </h2>
          <p className="text-[13px] text-[#64766C] leading-normal mt-1">
            Cada piquete possui seu próprio <strong className="font-semibold text-[#20332C]">GMD médio guardado separadamente</strong>, projetando o <strong className="font-semibold text-[#20332C]">peso previsto</strong> dos animais em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onDeleteLot && sampleLots.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearSamplesModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm leading-snug cursor-pointer"
              title="Remover todos os piquetes pré-cadastrados como demonstração"
            >
              <Trash2 size={16} />
              <span>Excluir Amostras ({sampleLots.length})</span>
            </button>
          )}
          <button 
            onClick={() => openModal()}
            className="bg-[#145C46] hover:bg-[#0E4434] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-all font-semibold text-sm leading-snug cursor-pointer"
          >
            <Plus size={18} /> Novo Piquete
          </button>
        </div>
      </div>

      {lots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E3EAE6] p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F6F8F5] text-[#64766C] flex items-center justify-center mx-auto">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Nenhum piquete cadastrado</h3>
          <p className="text-[13px] font-normal text-[#64766C] leading-relaxed">
            Cadastre seus piquetes de pastagem ou confinamento para controlar lotação, pesagens coletivas e o GMD diário do rebanho.
          </p>
          <button 
            onClick={() => openModal()}
            className="bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm leading-snug px-5 py-2.5 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Cadastrar Primeiro Piquete
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lots.map((lot, idx) => {
          const lotAnimals = animals.filter(a => a.lotId === lot.id && a.status === AnimalStatus.ACTIVE);
          const stats = calculateLotWeighingStats(lotAnimals, todayStr, lot);
          const hasWeighHistory = (lot.history && lot.history.length > 0);
          const daysFromLastWeighing = stats.mostRecentWeighingDate ? getDaysDifference(stats.mostRecentWeighingDate, todayStr) : 0;
          const isSample = isSampleLot(lot);

          return (
            <div key={`${lot.id}-${idx}`} className="agro-card p-6 flex flex-col justify-between relative group hover:border-[#218568] transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#20332C] leading-snug">{lot.name}</h3>
                      {isSample && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                          Amostra
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#DCEDE4] text-[#145C46] text-xs font-medium font-nums">
                        <TrendingUp size={13} className="text-[#145C46]" /> GMD: +{stats.avgGmd.toFixed(3)} kg/d
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasWeighHistory && (
                      <button 
                        onClick={() => openHistoryModal(lot)} 
                        className="text-[#64766C] hover:text-[#145C46] hover:bg-[#E5F2EB] p-2 rounded-lg transition-all cursor-pointer" 
                        title="Histórico de Pesagens do Piquete"
                      >
                        <History size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => openWeighModal(lot)} 
                      className="text-[#145C46] hover:bg-[#E5F2EB] p-2 rounded-lg transition-all cursor-pointer" 
                      title="Pesar Piquete Completo"
                    >
                      <Scale size={18} />
                    </button>
                    <button 
                      onClick={() => openModal(lot)} 
                      className="text-[#64766C] hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                      title="Editar Piquete e GMD"
                    >
                      <Edit2 size={18} />
                    </button>
                    {stats.headCount > 0 && (
                      <button 
                        onClick={() => openSellModal(lot)} 
                        className="text-[#64766C] hover:text-[#145C46] p-2 rounded-lg hover:bg-[#E5F2EB] transition-all cursor-pointer" 
                        title="Vender Animais do Piquete"
                      >
                        <DollarSign size={18} />
                      </button>
                    )}
                    {onDeleteLot && (
                      <button
                        type="button"
                        onClick={() => setLotToDelete(lot)}
                        className="text-[#64766C] hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all cursor-pointer"
                        title="Excluir Piquete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[13px] text-[#64766C] font-normal leading-normal mb-4 line-clamp-2">
                  {lot.description || 'Sem observações cadastradas.'}
                </p>

                {/* Métricas do Lote */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E3EAE6]">
                  <div className="p-3.5 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                    <p className="text-xs font-medium text-[#64766C] leading-snug">Cabeças ativas</p>
                    <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums mt-1">{stats.headCount}</p>
                    <p className="text-xs text-[#64766C] font-normal mt-1">{stats.headCount === 1 ? '1 animal' : `${stats.headCount} animais`}</p>
                  </div>

                  <div className="p-3.5 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                    <p className="text-xs font-medium text-[#64766C] leading-snug">Média na balança</p>
                    <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums mt-1">
                      {stats.avgRecordedArroba.toFixed(1)}<span className="text-sm font-normal text-[#64766C] ml-1">@</span>
                    </p>
                    <p className="text-xs text-[#64766C] font-normal font-nums mt-1">{stats.avgRecordedWeightKg.toFixed(1)} kg</p>
                  </div>

                  <div className="p-3.5 bg-[#F6F8F5] rounded-xl border border-[#DCEDE4]">
                    <p className="text-xs font-medium text-[#145C46] leading-snug">GMD gravado no lote</p>
                    <p className="text-xl font-semibold text-[#145C46] leading-tight font-nums mt-1">
                      +{stats.avgGmd.toFixed(3)}<span className="text-xs font-normal text-[#64766C] ml-1">kg/d</span>
                    </p>
                    <p className="text-xs text-[#64766C] font-normal mt-1">
                      {daysFromLastWeighing > 0 ? `${daysFromLastWeighing} dias desde a pesagem` : 'Pesado hoje'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#DCEDE4]/70 rounded-xl border border-[#DCEDE4]">
                    <p className="text-xs font-medium text-[#145C46] leading-snug flex items-center gap-1">
                      <Sparkles size={12} className="text-[#145C46]" /> Peso previsto hoje
                    </p>
                    <p className="text-xl font-semibold text-[#20332C] leading-tight font-nums mt-1">
                      {stats.avgPredictedArroba.toFixed(1)}<span className="text-xs font-normal text-[#145C46] ml-1">@</span>
                    </p>
                    <p className="text-xs text-[#145C46] font-medium font-nums mt-1">
                      {stats.avgPredictedWeightKg.toFixed(1)} kg (+{stats.totalWeightGainKg > 0 ? (stats.totalWeightGainKg / (stats.headCount || 1)).toFixed(1) : '0.0'} kg)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E3EAE6] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openWeighModal(lot)}
                  className="flex-1 bg-[#145C46] hover:bg-[#0E4434] text-white py-2.5 px-4 rounded-lg font-semibold text-sm leading-snug flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Scale size={16} /> Pesar Piquete
                </button>
                {onDeleteLot && (
                  <button
                    type="button"
                    onClick={() => setLotToDelete(lot)}
                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-sm leading-snug flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Excluir este piquete"
                  >
                    <Trash2 size={15} />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* MODAL CONFIGURAÇÃO DO PIQUETE (Com GMD Próprio) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-4 bg-[#145C46] text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-snug">
                {currentLot.id ? 'Editar Piquete & GMD' : 'Novo Piquete'}
              </h3>
              <button onClick={closeModal} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Nome do piquete</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] text-sm"
                  value={currentLot.name} 
                  onChange={e => setCurrentLot({...currentLot, name: e.target.value})} 
                  placeholder="Ex: Piquete 01 - Mombaça" 
                />
              </div>

              {/* Campo de GMD Médio Específico deste Lote */}
              <div className="space-y-1.5 bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#DCEDE4]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#145C46] flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#145C46]" /> GMD médio do lote (kg/cab/dia)
                  </label>
                </div>
                <p className="text-xs text-[#64766C] font-normal leading-relaxed">
                  Este GMD é guardado exclusivamente para este lote e adiciona peso diariamente aos animais nele alocados.
                </p>
                <div className="relative mt-2">
                  <input 
                    type="number" 
                    step="0.001"
                    required
                    onFocus={handleFocus}
                    className="w-full border border-[#218568]/40 rounded-lg px-3.5 py-2.5 font-semibold text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] text-base font-nums"
                    value={currentLot.averageGmd ?? 0.8} 
                    onChange={e => setCurrentLot({...currentLot, averageGmd: Number(e.target.value)})} 
                    placeholder="0.800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-medium text-xs text-[#145C46]">
                    kg/dia
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Descrição / observações</label>
                <textarea 
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] text-sm leading-relaxed"
                  value={currentLot.description || ''} 
                  onChange={e => setCurrentLot({...currentLot, description: e.target.value})} 
                  rows={3} 
                  placeholder="Ex: Pasto com braquiária, suplementação proteico-energética..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Custo diário específico (R$/cab/dia)</label>
                <input 
                  type="number" 
                  step="0.01"
                  onFocus={handleFocus}
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] text-sm font-nums"
                  value={currentLot.dailyCost || ''} 
                  onChange={e => setCurrentLot({...currentLot, dailyCost: Number(e.target.value)})} 
                  placeholder="Deixe em branco para usar o padrão da fazenda"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                {currentLot.id && onDeleteLot && (
                  <button
                    type="button"
                    onClick={() => setLotToDelete(currentLot)}
                    className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 size={15} />
                    <span>Excluir</span>
                  </button>
                )}
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-[#64766C] font-semibold text-sm hover:bg-[#F6F8F5] rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-2 py-2.5 px-5 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg font-semibold text-sm shadow-xs cursor-pointer">Salvar Piquete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE PESAGENS DO LOTE */}
      {isHistoryModalOpen && currentLot.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-4 bg-[#145C46] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <History className="text-[#DCEDE4]" size={20} />
                <div>
                  <h3 className="text-lg font-semibold leading-snug">Histórico de Pesagens: {currentLot.name}</h3>
                  <p className="text-xs text-[#DCEDE4] font-normal">GMDs médios apurados para este lote</p>
                </div>
              </div>
              <button onClick={closeModal} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(!currentLot.history || currentLot.history.length === 0) ? (
                <div className="text-center py-8 text-[#64766C] text-sm">
                  Nenhuma pesagem coletiva registrada para este lote ainda.
                </div>
              ) : (
                currentLot.history.slice().reverse().map((rec, idx) => (
                  <div key={rec.id || idx} className="p-4 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#20332C] font-nums">
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#DCEDE4] text-[#145C46] font-semibold font-nums">
                          +{Number(rec.gmd || 0).toFixed(3)} kg/d
                        </span>
                      </div>
                      <p className="text-xs text-[#64766C] font-normal mt-1">
                        {rec.headCount} animais · {rec.notes || 'Pesagem de rotina'}
                      </p>
                    </div>
                    <div className="text-right font-nums">
                      <span className="text-base font-semibold text-[#20332C]">{rec.avgWeightKg.toFixed(1)} kg</span>
                      <span className="text-xs font-normal text-[#64766C] block font-nums">({(rec.avgWeightKg / 30).toFixed(1)} @)</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#F6F8F5] border-t border-[#E3EAE6] flex justify-end">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2 bg-white hover:bg-[#E5F2EB] border border-[#E3EAE6] text-[#20332C] rounded-lg font-semibold text-sm cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PESAGEM DO LOTE */}
      {isWeighModalOpen && currentLot.id && (() => {
        const lotAnimals = animals.filter(a => a.lotId === currentLot.id && a.status === AnimalStatus.ACTIVE);
        const stats = calculateLotWeighingStats(lotAnimals, todayStr, currentLot);
        const inputAvgKg = lotWeighUnit === 'kg' ? Number(lotWeighAvgValue || 0) : Number(lotWeighAvgValue || 0) * 30;
        const autoCalc = calculateGMDFromWeighing(stats.avgRecordedWeightKg, inputAvgKg, stats.mostRecentWeighingDate, lotWeighDate);
        const activeGmd = isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd;
        const daysFromWeighingToToday = Math.max(0, getDaysDifference(lotWeighDate, todayStr));
        const futurePredictedAvgKg = inputAvgKg + (daysFromWeighingToToday * activeGmd);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAE6] my-8">
              <div className="px-6 py-4 bg-[#145C46] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-white">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-snug">Pesagem do Lote: {currentLot.name}</h3>
                    <p className="text-xs text-[#DCEDE4] font-normal">{stats.headCount} animais no lote</p>
                  </div>
                </div>
                <button onClick={closeModal} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleWeighSubmit} className="p-6 space-y-5">
                {/* Resumo Atual */}
                <div className="p-4 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6] grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#64766C]">Média anterior</p>
                    <p className="text-base font-semibold text-[#20332C] font-nums mt-0.5">{stats.avgRecordedWeightKg.toFixed(1)} kg</p>
                    <span className="text-xs font-normal text-[#64766C] font-nums">({stats.avgRecordedArroba.toFixed(1)} @)</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#64766C]">Última data base</p>
                    <p className="text-sm font-semibold text-[#20332C] mt-1 font-nums">
                      {stats.mostRecentWeighingDate ? new Date(stats.mostRecentWeighingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#145C46]">GMD anterior lote</p>
                    <p className="text-base font-semibold text-[#145C46] font-nums mt-0.5">+{stats.avgGmd.toFixed(3)} kg/d</p>
                  </div>
                </div>

                {/* Nova Pesagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#64766C] block">Data da pesagem</label>
                    <input 
                      type="date" 
                      className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] text-sm" 
                      value={lotWeighDate} 
                      onChange={e => setLotWeighDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-[#64766C]">Novo peso médio</label>
                      <div className="flex bg-[#E3EAE6] rounded-md p-0.5">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (lotWeighUnit === 'arroba') {
                              setLotWeighAvgValue(Number((lotWeighAvgValue * 30).toFixed(1)));
                              setLotWeighUnit('kg');
                            }
                          }} 
                          className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${lotWeighUnit === 'kg' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
                        >
                          kg
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (lotWeighUnit === 'kg') {
                              setLotWeighAvgValue(Number((lotWeighAvgValue / 30).toFixed(2)));
                              setLotWeighUnit('arroba');
                            }
                          }} 
                          className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${lotWeighUnit === 'arroba' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
                        >
                          @
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1" 
                        onFocus={handleFocus} 
                        className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2 font-semibold text-lg text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] pr-12 font-nums" 
                        value={lotWeighAvgValue || ''} 
                        onChange={e => setLotWeighAvgValue(Number(e.target.value))} 
                        required 
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-medium text-xs text-[#64766C]">
                        {lotWeighUnit === 'kg' ? 'kg' : '@'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* GMD Realizado e Projeção */}
                <div className="bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#DCEDE4] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#145C46]">GMD realizado do lote</p>
                      <p className="text-xs text-[#64766C] font-normal mt-0.5">
                        {autoCalc.days} dias · Variação: {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg/cab
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-semibold text-[#145C46] font-nums">
                        {autoCalc.gmd >= 0 ? `+${autoCalc.gmd.toFixed(3)}` : autoCalc.gmd.toFixed(3)}
                      </span>
                      <span className="text-xs font-normal text-[#64766C] block">kg/dia/cab</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#DCEDE4] flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#20332C] block">
                        GMD a ser guardado para o lote
                      </label>
                      <p className="text-xs text-[#64766C] font-normal">
                        Será armazenado no lote e guiará a projeção diária dos animais
                      </p>
                    </div>
                    <div className="w-32 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-[#218568]/50 rounded-lg px-2.5 py-1.5 font-semibold text-sm text-[#20332C] bg-white text-right font-nums focus:ring-2 focus:ring-[#145C46] outline-none"
                        value={isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd}
                        onChange={e => {
                          setIsLotWeighGmdManual(true);
                          setLotWeighGmd(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#DCEDE4] space-y-2">
                    <label className="text-xs font-medium text-[#20332C] block">Modo de aplicação nos animais</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('uniform')}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          lotWeighApplyMode === 'uniform' 
                            ? 'bg-white border-[#145C46] shadow-2xs' 
                            : 'bg-white/60 border-[#E3EAE6] text-[#64766C]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#20332C]">Peso Uniforme</p>
                        <p className="text-xs text-[#64766C] leading-snug mt-0.5">Define {inputAvgKg.toFixed(1)} kg para todos</p>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('gain_delta')}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          lotWeighApplyMode === 'gain_delta' 
                            ? 'bg-white border-[#145C46] shadow-2xs' 
                            : 'bg-white/60 border-[#E3EAE6] text-[#64766C]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#20332C]">Ganho Proporcional</p>
                        <p className="text-xs text-[#64766C] leading-snug mt-0.5">Soma {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg ao peso atual</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prévia Peso Previsto */}
                <div className="p-4 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-[#145C46] shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-medium text-[#145C46]">Novo peso previsto médio</p>
                      <p className="text-xs text-[#64766C] font-normal">Calculado com o novo GMD do lote</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-semibold text-[#20332C]">{futurePredictedAvgKg.toFixed(1)} kg</span>
                    <span className="text-xs font-normal text-[#64766C] block">({(futurePredictedAvgKg / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-[#64766C] font-semibold text-sm hover:bg-[#F6F8F5] rounded-lg cursor-pointer">Cancelar</button>
                  <button type="submit" className="flex-2 py-2.5 px-5 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg font-semibold text-sm shadow-xs cursor-pointer">Confirmar Pesagem do Lote</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL LIQUIDAÇÃO / VENDA */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-4 bg-[#145C46] text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-snug">Liquidação de Lote</h3>
              <button onClick={closeModal} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSellSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Data da venda</label>
                <input 
                  type="date" 
                  required 
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none text-sm"
                  value={sellDate} 
                  onChange={e => setSellDate(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Valor total bruto (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-semibold text-base">R$</span>
                  <input 
                    type="number" 
                    required 
                    onFocus={handleFocus}
                    className="w-full border border-[#E3EAE6] rounded-lg pl-12 pr-4 py-2.5 font-semibold text-2xl text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none font-nums"
                    value={sellValue || ''} 
                    onChange={e => setSellValue(Number(e.target.value))} 
                    placeholder="0,00" 
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-lg font-semibold text-sm shadow-xs cursor-pointer">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO DE PIQUETE INDIVIDUAL */}
      {lotToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Trash2 size={18} />
                <h3 className="text-lg font-semibold leading-snug">Excluir Piquete</h3>
              </div>
              <button onClick={() => setLotToDelete(null)} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-normal leading-relaxed text-[#20332C]">
                Deseja realmente excluir o piquete <strong className="font-semibold text-[#20332C]">"{lotToDelete.name}"</strong>?
              </p>
              {animals.some(a => a.lotId === lotToDelete.id && a.status === AnimalStatus.ACTIVE) && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Os animais atualmente alocados neste piquete não serão apagados — eles passarão para o Pasto Geral (sem piquete vinculado).</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLotToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E3EAE6] text-[#64766C] font-semibold text-sm hover:bg-[#F6F8F5] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLot}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO EM LOTE DOS PIQUETES DE AMOSTRA */}
      {isClearSamplesModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Trash2 size={18} />
                <h3 className="text-lg font-semibold leading-snug">Excluir Piquetes de Amostra</h3>
              </div>
              <button onClick={() => setIsClearSamplesModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-normal leading-relaxed text-[#20332C]">
                Serão removidos <strong className="font-semibold text-[#20332C]">{sampleLots.length} {sampleLots.length === 1 ? 'piquete cadastrado' : 'piquetes cadastrados'} como amostra</strong>:
              </p>
              <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6] space-y-1.5 max-h-40 overflow-y-auto">
                {sampleLots.map(l => (
                  <div key={l.id} className="text-xs font-medium text-[#20332C] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{l.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#64766C] leading-relaxed">
                Nenhum animal será excluído (eventuais animais vinculados ficarão no Pasto Geral).
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearSamplesModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E3EAE6] text-[#64766C] font-semibold text-sm hover:bg-[#F6F8F5] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearSampleLots}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>Excluir Amostras</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotManager;
