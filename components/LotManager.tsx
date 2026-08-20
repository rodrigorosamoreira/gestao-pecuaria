import React, { useState } from 'react';
import { Lot, Animal, AnimalStatus, LotWeighingRecord } from '../types';
import { 
  Layers, Plus, Edit2, Users, Scale, DollarSign, X, 
  TrendingUp, Sparkles, Calendar, History, CheckCircle2, 
  Info, ArrowRight, ShieldCheck, Tag
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
  onSellLot?: (lotId: string, date: string, totalValue: number) => void;
  onBatchWeighLot?: (lotId: string, date: string, newAvgWeight: number, gmd: number, applyMode: 'uniform' | 'gain_delta') => void;
}

const LotManager: React.FC<LotManagerProps> = ({ 
  lots, 
  animals, 
  onAddLot, 
  onUpdateLot, 
  onSellLot, 
  onBatchWeighLot 
}) => {
  const todayStr = getTodayDateString();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isWeighModalOpen, setIsWeighModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentLot, setCurrentLot] = useState<Lot>({ id: '', name: '', description: '', averageGmd: 0.8 });
  
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
      alert("Este lote não possui animais ativos para pesagem.");
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

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="text-emerald-700" /> Gestão de Lotes de Manejo
          </h2>
          <p className="text-xs text-slate-500">
            Cada lote possui seu próprio <strong>GMD médio guardado separadamente</strong>, projetando o <strong>peso previsto</strong> dos animais em tempo real.
          </p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all font-bold text-xs cursor-pointer border border-emerald-800"
        >
          <Plus size={18} /> Novo Lote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lots.map((lot, idx) => {
          const lotAnimals = animals.filter(a => a.lotId === lot.id && a.status === AnimalStatus.ACTIVE);
          const stats = calculateLotWeighingStats(lotAnimals, todayStr, lot);
          const hasWeighHistory = (lot.history && lot.history.length > 0);
          const daysFromLastWeighing = stats.mostRecentWeighingDate ? getDaysDifference(stats.mostRecentWeighingDate, todayStr) : 0;

          return (
            <div key={`${lot.id}-${idx}`} className="agro-card p-6 flex flex-col justify-between relative group hover:border-emerald-300 transition-all shadow-xs">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{lot.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                        <TrendingUp size={11} className="text-emerald-700" /> GMD Lote: +{stats.avgGmd.toFixed(3)} kg/d
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasWeighHistory && (
                      <button 
                        onClick={() => openHistoryModal(lot)} 
                        className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-xl transition-all" 
                        title="Histórico de Pesagens do Lote"
                      >
                        <History size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => openWeighModal(lot)} 
                      className="text-emerald-700 hover:bg-emerald-50 p-2 rounded-xl transition-all" 
                      title="Pesar Lote Completo"
                    >
                      <Scale size={18} />
                    </button>
                    <button 
                      onClick={() => openModal(lot)} 
                      className="text-slate-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-all"
                      title="Editar Lote e GMD"
                    >
                      <Edit2 size={18} />
                    </button>
                    {stats.headCount > 0 && (
                      <button 
                        onClick={() => openSellModal(lot)} 
                        className="text-slate-400 hover:text-green-600 p-2 rounded-xl hover:bg-green-50 transition-all" 
                        title="Vender Lote Inteiro"
                      >
                        <DollarSign size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">
                  {lot.description || 'Sem observações cadastradas.'}
                </p>

                {/* Métricas do Lote */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cabeças Ativas</p>
                    <p className="text-xl font-black text-slate-900 font-nums mt-0.5">{stats.headCount}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{stats.headCount === 1 ? '1 animal' : `${stats.headCount} animais`}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média na Balança</p>
                    <p className="text-xl font-black text-slate-900 font-nums mt-0.5">
                      {stats.avgRecordedArroba.toFixed(1)} <span className="text-xs font-normal text-slate-400">@</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-nums">{stats.avgRecordedWeightKg.toFixed(1)} kg</p>
                  </div>

                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">GMD Gravado no Lote</p>
                    <p className="text-base font-black text-emerald-900 font-nums mt-0.5">
                      +{stats.avgGmd.toFixed(3)} <span className="text-[10px] font-bold text-emerald-700">kg/d</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {daysFromLastWeighing > 0 ? `${daysFromLastWeighing} dias desde a pesagem` : 'Pesado hoje'}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-200">
                    <p className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-700" /> Peso Previsto Hoje
                    </p>
                    <p className="text-base font-black text-emerald-950 font-nums mt-0.5">
                      {stats.avgPredictedArroba.toFixed(1)} <span className="text-[10px] font-bold text-emerald-800">@</span>
                    </p>
                    <p className="text-[10px] text-emerald-800 font-bold font-nums">
                      {stats.avgPredictedWeightKg.toFixed(1)} kg (+{stats.totalWeightGainKg > 0 ? (stats.totalWeightGainKg / (stats.headCount || 1)).toFixed(1) : '0.0'} kg)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openWeighModal(lot)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Scale size={15} /> Pesar Lote Completo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CONFIGURAÇÃO DO LOTE (Com GMD Próprio) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-7 py-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-base font-black uppercase tracking-tight">
                {currentLot.id ? 'Editar Lote & GMD' : 'Novo Lote de Manejo'}
              </h3>
              <button onClick={closeModal} className="hover:bg-white/10 p-2 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Nome do Lote</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={currentLot.name} 
                  onChange={e => setCurrentLot({...currentLot, name: e.target.value})} 
                  placeholder="Ex: Confinamento Piquete 01" 
                />
              </div>

              {/* Campo de GMD Médio Específico deste Lote */}
              <div className="space-y-1.5 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-700" /> GMD Médio do Lote (kg/cab/dia)
                  </label>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Este GMD é guardado exclusivamente para este lote e adiciona peso diariamente aos animais nele alocados.
                </p>
                <div className="relative mt-2">
                  <input 
                    type="number" 
                    step="0.001"
                    required
                    onFocus={handleFocus}
                    className="w-full border border-emerald-300 rounded-xl px-4 py-2.5 font-black text-emerald-950 bg-white focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-base font-nums"
                    value={currentLot.averageGmd ?? 0.8} 
                    onChange={e => setCurrentLot({...currentLot, averageGmd: Number(e.target.value)})} 
                    placeholder="0.800"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-emerald-700">
                    kg/dia
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Descrição / Observações</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  value={currentLot.description || ''} 
                  onChange={e => setCurrentLot({...currentLot, description: e.target.value})} 
                  rows={3} 
                  placeholder="Ex: Pasto com braquiária, suplementação proteico-energética..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Custo Diário Específico (R$/cab/dia)</label>
                <input 
                  type="number" 
                  step="0.01"
                  onFocus={handleFocus}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-nums"
                  value={currentLot.dailyCost || ''} 
                  onChange={e => setCurrentLot({...currentLot, dailyCost: Number(e.target.value)})} 
                  placeholder="Deixe em branco para usar o padrão da fazenda"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-xl uppercase cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer">Salvar Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE PESAGENS DO LOTE */}
      {isHistoryModalOpen && currentLot.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-7 py-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <History className="text-emerald-400" size={20} />
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Histórico de Pesagens: {currentLot.name}</h3>
                  <p className="text-xs text-slate-300">GMDs médios apurados para este lote</p>
                </div>
              </div>
              <button onClick={closeModal} className="hover:bg-white/10 p-2 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(!currentLot.history || currentLot.history.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhuma pesagem coletiva registrada para este lote ainda.
                </div>
              ) : (
                currentLot.history.slice().reverse().map((rec, idx) => (
                  <div key={rec.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                          +{Number(rec.gmd || 0).toFixed(3)} kg/d
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {rec.headCount} animais · {rec.notes || 'Pesagem de rotina'}
                      </p>
                    </div>
                    <div className="text-right font-nums">
                      <span className="text-base font-black text-slate-900">{rec.avgWeightKg.toFixed(1)} kg</span>
                      <span className="text-xs font-bold text-slate-400 block font-nums">({(rec.avgWeightKg / 30).toFixed(1)} @)</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs uppercase cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 my-8">
              <div className="px-7 py-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300">
                    <Scale size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Pesagem do Lote: {currentLot.name}</h3>
                    <p className="text-xs text-emerald-200 font-medium">{stats.headCount} animais no lote</p>
                  </div>
                </div>
                <button onClick={closeModal} className="hover:bg-white/10 p-2 rounded-full cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleWeighSubmit} className="p-7 space-y-5">
                {/* Resumo Atual */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Anterior</p>
                    <p className="text-base font-black text-slate-800 font-nums mt-0.5">{stats.avgRecordedWeightKg.toFixed(1)} kg</p>
                    <span className="text-xs font-bold text-slate-500 font-nums">({stats.avgRecordedArroba.toFixed(1)} @)</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Data Base</p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {stats.mostRecentWeighingDate ? new Date(stats.mostRecentWeighingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">GMD Anterior Lote</p>
                    <p className="text-sm font-black text-emerald-800 font-nums mt-0.5">+{stats.avgGmd.toFixed(3)} kg/d</p>
                  </div>
                </div>

                {/* Nova Pesagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Data da Pesagem</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                      value={lotWeighDate} 
                      onChange={e => setLotWeighDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Novo Peso Médio</label>
                      <div className="flex bg-slate-200 rounded-lg p-0.5">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (lotWeighUnit === 'arroba') {
                              setLotWeighAvgValue(Number((lotWeighAvgValue * 30).toFixed(1)));
                              setLotWeighUnit('kg');
                            }
                          }} 
                          className={`px-2 py-0.5 text-[9px] font-black rounded cursor-pointer ${lotWeighUnit === 'kg' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                        >
                          KG
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (lotWeighUnit === 'kg') {
                              setLotWeighAvgValue(Number((lotWeighAvgValue / 30).toFixed(2)));
                              setLotWeighUnit('arroba');
                            }
                          }} 
                          className={`px-2 py-0.5 text-[9px] font-black rounded cursor-pointer ${lotWeighUnit === 'arroba' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
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
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-black text-xl text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 pr-12 font-nums" 
                        value={lotWeighAvgValue || ''} 
                        onChange={e => setLotWeighAvgValue(Number(e.target.value))} 
                        required 
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 uppercase font-mono">
                        {lotWeighUnit === 'kg' ? 'KG' : '@'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* GMD Realizado e Projeção */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4.5 rounded-2xl border border-emerald-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">GMD Realizado do Lote</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {autoCalc.days} dias · Variação: {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg/cab
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-900 font-nums">
                        {autoCalc.gmd >= 0 ? `+${autoCalc.gmd.toFixed(3)}` : autoCalc.gmd.toFixed(3)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 block">kg/dia/cab</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        GMD a ser guardado para o lote
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Será armazenado no lote e guiará a projeção diária dos animais
                      </p>
                    </div>
                    <div className="w-32 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-emerald-400 rounded-lg px-2.5 py-1.5 font-black text-sm text-emerald-950 bg-white text-right font-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd}
                        onChange={e => {
                          setIsLotWeighGmdManual(true);
                          setLotWeighGmd(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Modo de Aplicação nos Animais</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('uniform')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          lotWeighApplyMode === 'uniform' 
                            ? 'bg-white border-emerald-500 shadow-xs' 
                            : 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">Peso Uniforme</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Define {inputAvgKg.toFixed(1)} kg para todos</p>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('gain_delta')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          lotWeighApplyMode === 'gain_delta' 
                            ? 'bg-white border-emerald-500 shadow-xs' 
                            : 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">Ganho Proporcional</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Soma {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg ao peso atual</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prévia Peso Previsto */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-emerald-400 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Novo Peso Previsto Médio</p>
                      <p className="text-xs text-slate-300 font-medium">Calculado com o novo GMD do lote</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-black text-white">{futurePredictedAvgKg.toFixed(1)} kg</span>
                    <span className="text-xs font-bold text-emerald-300 block">({(futurePredictedAvgKg / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-xl uppercase cursor-pointer">Cancelar</button>
                  <button type="submit" className="flex-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer">Confirmar Pesagem do Lote</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL LIQUIDAÇÃO / VENDA */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-7 py-5 bg-green-700 text-white flex justify-between items-center">
              <h3 className="text-base font-black uppercase tracking-tight">Liquidação de Lote</h3>
              <button onClick={closeModal} className="hover:bg-white/10 p-2 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSellSubmit} className="p-7 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Data da Venda</label>
                <input 
                  type="date" 
                  required 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold bg-slate-50 focus:bg-white outline-none text-sm"
                  value={sellDate} 
                  onChange={e => setSellDate(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Valor Total Bruto (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700 font-black text-lg">R$</span>
                  <input 
                    type="number" 
                    required 
                    onFocus={handleFocus}
                    className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-black text-2xl text-green-900 bg-slate-50 focus:bg-white outline-none font-nums"
                    value={sellValue || ''} 
                    onChange={e => setSellValue(Number(e.target.value))} 
                    placeholder="0,00" 
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotManager;
