import React, { useState } from 'react';
import { Animal, AnimalStatus, AnimalGender, Lot } from '../types';
import { 
  Plus, Search, Filter, Edit2, Trash2, Scale, Eye, 
  DollarSign, Skull, X, ChevronDown, ChevronRight, 
  Folder, FolderOpen, TrendingUp, Calendar, Info, 
  Beaker, Baby, AlertCircle, Layers, Users, Sparkles, 
  CheckCircle2, ArrowRight, History
} from 'lucide-react';
import { 
  getTodayDateString, 
  getAnimalLastWeighing, 
  calculatePredictedWeight, 
  calculateGMDFromWeighing, 
  calculateLotWeighingStats,
  getDaysDifference
} from '../services/weightService';

interface AnimalManagerProps {
  animals: Animal[];
  lots: Lot[];
  onAddAnimal: (animal: Animal) => void;
  onAddBatch?: (animals: Animal[], totalCost: number) => void;
  onUpdateAnimal: (animal: Animal) => void;
  onDeleteAnimal: (id: string) => void;
  onSellAnimal: (id: string, date: string, value: number, finalWeight: number) => void;
  onAnimalDeath: (id: string, date: string, cause: string) => void;
  onSellLot?: (lotId: string, date: string, avgWeight: number, priceMode: 'head' | 'arroba', priceValue: number) => void;
  onBatchWeighLot?: (lotId: string, date: string, newAvgWeight: number, gmd: number, applyMode: 'uniform' | 'gain_delta') => void;
  savedDailyCost?: number;
}

const AnimalManager: React.FC<AnimalManagerProps> = ({ 
  animals, 
  lots, 
  onAddAnimal, 
  onAddBatch,
  onUpdateAnimal, 
  onDeleteAnimal, 
  onSellAnimal, 
  onAnimalDeath,
  onSellLot,
  onBatchWeighLot,
  savedDailyCost = 0 
}) => {
  const todayStr = getTodayDateString();

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isModalIndividualOpen, setIsModalIndividualOpen] = useState(false);
  const [isLotSellModalOpen, setIsLotSellModalOpen] = useState(false);
  const [isWeighModalOpen, setIsWeighModalOpen] = useState(false);
  const [isLotWeighModalOpen, setIsLotWeighModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('available');
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({'all': true});

  // Estados Form Individual
  const [currentAnimal, setCurrentAnimal] = useState<Partial<Animal>>({});
  const [indPriceMode, setIndPriceMode] = useState<'total' | 'arroba'>('total');
  const [indWeightValue, setIndWeightValue] = useState<number>(0);
  const [indInitialGmd, setIndInitialGmd] = useState<number>(0.8);

  // Estados Pesagem Individual
  const [weighDate, setWeighDate] = useState(todayStr);
  const [weighValue, setWeighValue] = useState<number>(0);
  const [weighUnit, setWeighUnit] = useState<'kg' | 'arroba'>('kg');
  const [customGmd, setCustomGmd] = useState<number>(0);
  const [isCustomGmdManual, setIsCustomGmdManual] = useState(false);

  // Estados Pesagem Coletiva de Lote
  const [lotWeighLotId, setLotWeighLotId] = useState<string>('');
  const [lotWeighDate, setLotWeighDate] = useState(todayStr);
  const [lotWeighAvgValue, setLotWeighAvgValue] = useState<number>(0);
  const [lotWeighUnit, setLotWeighUnit] = useState<'kg' | 'arroba'>('kg');
  const [lotWeighGmd, setLotWeighGmd] = useState<number>(0);
  const [isLotWeighGmdManual, setIsLotWeighGmdManual] = useState(false);
  const [lotWeighApplyMode, setLotWeighApplyMode] = useState<'uniform' | 'gain_delta'>('uniform');

  // Estados Ações Gerais
  const [actionDate, setActionDate] = useState(todayStr);
  const [deathCause, setDeathCause] = useState('');

  // Estados Venda Individual
  const [sellWeightValue, setSellWeightValue] = useState<number>(0);
  const [sellWeightType, setSellWeightType] = useState<'kg' | 'arroba'>('kg');
  const [sellPriceValue, setSellPriceValue] = useState<number>(0);
  const [sellPriceMode, setSellPriceMode] = useState<'head' | 'arroba'>('arroba');

  // Estados Cadastro de Lote (Batch)
  const [batchQty, setBatchQty] = useState<number>(10);
  const [batchBaseTag, setBatchBaseTag] = useState<string>('LT-');
  const [batchWeightType, setBatchWeightType] = useState<'kg' | 'arroba'>('kg');
  const [batchWeightValue, setBatchWeightValue] = useState<number>(330);
  const [batchPriceMode, setBatchPriceMode] = useState<'head' | 'arroba'>('head');
  const [batchPriceValue, setBatchPriceValue] = useState<number>(0);
  const [batchLotId, setBatchLotId] = useState<string>('');
  const [batchBreed, setBatchBreed] = useState<string>('Nelore');
  const [batchDate, setBatchDate] = useState(todayStr);
  const [batchInitialGmd, setBatchInitialGmd] = useState<number>(0.8);

  // Estados Venda de Lote
  const [targetLotId, setTargetLotId] = useState<string>('');
  const [lotSellDate, setLotSellDate] = useState(todayStr);
  const [lotSellAvgWeight, setLotSellAvgWeight] = useState<number>(540);
  const [lotSellPriceMode, setLotSellPriceMode] = useState<'head' | 'arroba'>('arroba');
  const [lotSellPriceValue, setLotSellPriceValue] = useState<number>(240);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select();

  const toggleLot = (id: string) => {
    setExpandedLots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = filterStatus === 'all_history' ? true : 
                        filterStatus === 'available' ? (animal.status !== AnimalStatus.SOLD && animal.status !== AnimalStatus.DEAD) :
                        animal.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const avulsoAnimals = filteredAnimals.filter(a => !a.lotId || a.lotId === '');
  const animalsInLots = filteredAnimals.filter(a => a.lotId && a.lotId !== '');

  const groupedLots = animalsInLots.reduce((acc, animal) => {
    const lotId = animal.lotId!;
    if (!acc[lotId]) acc[lotId] = [];
    acc[lotId].push(animal);
    return acc;
  }, {} as Record<string, Animal[]>);

  // Cadastro de Animais em Lote
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchQty <= 0 || !batchLotId) {
      alert("Selecione um lote de destino para cadastrar o lote de animais.");
      return;
    }
    const avgWeightKg = batchWeightType === 'kg' ? batchWeightValue : batchWeightValue * 30;
    const unitPrice = batchPriceMode === 'head' ? batchPriceValue : (avgWeightKg / 30) * batchPriceValue;
    const totalCost = unitPrice * batchQty;
    const initialGmd = Number(batchInitialGmd) || 0;

    const newAnimals: Animal[] = Array.from({ length: batchQty }, (_, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      earTag: `${batchBaseTag}${String(i + 1).padStart(3, '0')}`,
      breed: batchBreed,
      gender: AnimalGender.MALE,
      birthDate: '',
      entryDate: batchDate,
      lastWeighingDate: batchDate,
      weightKg: avgWeightKg,
      gmd: initialGmd,
      status: AnimalStatus.ACTIVE,
      purchaseValue: unitPrice,
      lotId: batchLotId,
      history: [{ date: batchDate, weightKg: avgWeightKg, gmd: initialGmd }]
    }));

    if (onAddBatch) onAddBatch(newAnimals, totalCost);
    setIsBatchModalOpen(false);
  };

  // Cadastro Individual
  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWeight = indWeightValue;
    const finalPurchaseValue = indPriceMode === 'total' 
      ? (currentAnimal.purchaseValue || 0) 
      : ((finalWeight / 30) * (currentAnimal.purchaseValue || 0));
    
    const initialGmd = Number(indInitialGmd) || 0;
    const entryDate = currentAnimal.entryDate || todayStr;

    const animal: Animal = {
      ...(currentAnimal as Animal),
      id: currentAnimal.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      weightKg: finalWeight,
      gmd: currentAnimal.id ? (currentAnimal.gmd ?? initialGmd) : initialGmd,
      lastWeighingDate: currentAnimal.id ? (currentAnimal.lastWeighingDate || entryDate) : entryDate,
      purchaseValue: finalPurchaseValue,
      history: currentAnimal.id 
        ? (currentAnimal.history || []) 
        : [{ date: entryDate, weightKg: finalWeight, gmd: initialGmd }]
    };

    if (currentAnimal.id) onUpdateAnimal(animal);
    else onAddAnimal(animal);
    setIsModalIndividualOpen(false);
  };

  // Abrir Modal de Pesagem Individual
  const openWeighModal = (animal: Animal) => {
    setCurrentAnimal(animal);
    const last = getAnimalLastWeighing(animal);
    setWeighDate(todayStr);
    setWeighValue(last.weightKg);
    setWeighUnit('kg');
    setCustomGmd(last.gmd || 0);
    setIsCustomGmdManual(false);
    setIsWeighModalOpen(true);
  };

  // Salvar Pesagem Individual
  const handleWeighingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnimal.id) return;

    const last = getAnimalLastWeighing(currentAnimal as Animal);
    const finalWeightKg = weighUnit === 'kg' ? weighValue : weighValue * 30;
    
    // Cálculo do GMD
    const autoCalc = calculateGMDFromWeighing(last.weightKg, finalWeightKg, last.date, weighDate);
    const finalGmd = isCustomGmdManual ? customGmd : (autoCalc.days > 0 ? autoCalc.gmd : (last.gmd || 0));

    const newHistoryRecord = {
      date: weighDate,
      weightKg: finalWeightKg,
      gmd: finalGmd
    };

    const updatedAnimal: Animal = {
      ...(currentAnimal as Animal),
      weightKg: finalWeightKg,
      gmd: finalGmd,
      lastWeighingDate: weighDate,
      history: [...(currentAnimal.history || []), newHistoryRecord]
    };

    onUpdateAnimal(updatedAnimal);
    setIsWeighModalOpen(false);
  };

  // Abrir Modal de Pesagem de Lote
  const openLotWeighModal = (lotId: string) => {
    setLotWeighLotId(lotId);
    const lot = lots.find(l => l.id === lotId);
    const lotAnimals = animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
    const stats = calculateLotWeighingStats(lotAnimals, todayStr, lot);
    setLotWeighDate(todayStr);
    setLotWeighAvgValue(stats.avgRecordedWeightKg || 350);
    setLotWeighUnit('kg');
    setLotWeighGmd(lot?.averageGmd ?? stats.avgGmd ?? 0.8);
    setIsLotWeighGmdManual(false);
    setLotWeighApplyMode('uniform');
    setIsLotWeighModalOpen(true);
  };

  // Salvar Pesagem Coletiva de Lote
  const handleLotWeighSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotWeighLotId) return;

    const lot = lots.find(l => l.id === lotWeighLotId);
    const lotAnimals = animals.filter(a => a.lotId === lotWeighLotId && a.status === AnimalStatus.ACTIVE);
    if (lotAnimals.length === 0) {
      alert("Este lote não possui animais ativos no pasto para pesagem.");
      return;
    }

    const finalAvgWeightKg = lotWeighUnit === 'kg' ? lotWeighAvgValue : lotWeighAvgValue * 30;
    const stats = calculateLotWeighingStats(lotAnimals, todayStr, lot);
    const autoGmd = calculateGMDFromWeighing(stats.avgRecordedWeightKg, finalAvgWeightKg, stats.mostRecentWeighingDate, lotWeighDate).gmd;
    const finalGmd = isLotWeighGmdManual ? lotWeighGmd : autoGmd;

    if (onBatchWeighLot) {
      onBatchWeighLot(lotWeighLotId, lotWeighDate, finalAvgWeightKg, finalGmd, lotWeighApplyMode);
    } else {
      // Fallback: atualizar cada animal
      const prevAvg = stats.avgRecordedWeightKg;
      const deltaGain = finalAvgWeightKg - prevAvg;

      lotAnimals.forEach(a => {
        const animalNewWeight = lotWeighApplyMode === 'gain_delta'
          ? Math.max(1, Number(((a.weightKg || 0) + deltaGain).toFixed(2)))
          : finalAvgWeightKg;
        const newHistory = [...(a.history || []), { date: lotWeighDate, weightKg: animalNewWeight, gmd: finalGmd }];
        onUpdateAnimal({
          ...a,
          weightKg: animalNewWeight,
          gmd: finalGmd,
          lastWeighingDate: lotWeighDate,
          history: newHistory
        });
      });
    }

    setIsLotWeighModalOpen(false);
  };

  const handleIndividualSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnimal.id) return;
    const finalWeightKg = sellWeightType === 'kg' ? sellWeightValue : sellWeightValue * 30;
    const totalSaleValue = sellPriceMode === 'head' ? sellPriceValue : (finalWeightKg / 30) * sellPriceValue;
    onSellAnimal(currentAnimal.id, actionDate, totalSaleValue, finalWeightKg);
    setIsSellModalOpen(false);
  };

  // Renderizador de Linha de Animal com Peso Registrado, GMD e Peso Previsto
  const renderAnimalRow = (animal: Animal) => {
    const lastWeigh = getAnimalLastWeighing(animal);
    const pred = calculatePredictedWeight(animal, todayStr, lots);

    return (
      <tr key={animal.id} className="hover:bg-emerald-50/20 transition-colors border-b border-slate-100/80">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-800 tracking-tight font-mono">{animal.earTag}</span>
            {animal.lotId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {lots.find(l => l.id === animal.lotId)?.name || 'Lote'}
              </span>
            )}
          </div>
        </td>
        
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">{animal.breed}</span>
            <span className={`text-[10px] font-extrabold uppercase ${animal.gender === AnimalGender.FEMALE ? 'text-rose-500' : 'text-sky-600'}`}>
              {animal.gender}
            </span>
          </div>
        </td>

        {/* Peso Balança (Última Pesagem) */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-800 font-nums">{lastWeigh.weightKg.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-slate-400">kg</span>
              <span className="text-xs font-bold text-slate-500 font-nums ml-1">({(lastWeigh.weightKg / 30).toFixed(1)} @)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Balança: {lastWeigh.date ? new Date(lastWeigh.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
            </span>
          </div>
        </td>

        {/* GMD Diário (Lote ou Individual) */}
        <td className="px-6 py-4">
          <div className="inline-flex flex-col gap-0.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800">
              <TrendingUp size={12} className="text-emerald-600" />
              <span className="text-xs font-black font-nums">
                {pred.gmd > 0 ? `+${pred.gmd.toFixed(3)}` : pred.gmd.toFixed(3)}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase">kg/d</span>
            </div>
            {pred.gmdSource === 'lot' && (
              <span className="text-[9px] font-bold text-emerald-700 px-1">
                Lote: {pred.lotName || 'Atribuído'}
              </span>
            )}
          </div>
        </td>

        {/* Peso Previsto Atualizado Diariamente */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-700 font-nums">{pred.predictedWeightKg.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">kg</span>
              <span className="text-xs font-black text-emerald-800 font-nums ml-1.5">
                ({pred.predictedArroba.toFixed(1)} @)
              </span>
            </div>
            {pred.daysElapsed > 0 ? (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <Sparkles size={10} />
                +{pred.weightGainKg.toFixed(1)} kg em {pred.daysElapsed}d
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">Pesado hoje</span>
            )}
          </div>
        </td>

        {/* Ações */}
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-1.5">
            {animal.gender === AnimalGender.FEMALE && (
              <button 
                onClick={() => { 
                  setCurrentAnimal({ entryDate: todayStr, breed: animal.breed, motherId: animal.id, status: AnimalStatus.ACTIVE }); 
                  setIndWeightValue(0); 
                  setIsModalIndividualOpen(true); 
                }} 
                className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all cursor-pointer" 
                title="Registrar Cria (Bezerro)"
              >
                <Baby size={17} />
              </button>
            )}
            <button 
              onClick={() => openWeighModal(animal)} 
              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/60 rounded-xl transition-all shadow-xs cursor-pointer" 
              title="Registrar Nova Pesagem e GMD"
            >
              <Scale size={17} />
            </button>
            <button 
              onClick={() => { setCurrentAnimal(animal); setSellWeightValue(animal.weightKg); setSellPriceValue(0); setIsSellModalOpen(true); }} 
              className="p-2 text-green-700 hover:bg-green-50 rounded-xl transition-all cursor-pointer" 
              title="Vender Animal"
            >
              <DollarSign size={17} />
            </button>
            <button 
              onClick={() => { setCurrentAnimal(animal); setDeathCause(''); setIsDeathModalOpen(true); }} 
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer" 
              title="Informar Óbito"
            >
              <Skull size={17} />
            </button>
            <button 
              onClick={() => { setCurrentAnimal(animal); setIndWeightValue(animal.weightKg); setIndInitialGmd(animal.gmd || 0.8); setIsModalIndividualOpen(true); }} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" 
              title="Editar Cadastro"
            >
              <Edit2 size={17} />
            </button>
            <button 
              onClick={() => { if(confirm(`Excluir o animal ${animal.earTag}?`)) onDeleteAnimal(animal.id); }} 
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer" 
              title="Excluir Animal"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const activeAnimals = animals.filter(a => a.status === AnimalStatus.ACTIVE);
  const totalActive = activeAnimals.length;
  const males = activeAnimals.filter(a => a.gender === AnimalGender.MALE).length;
  const females = activeAnimals.filter(a => a.gender === AnimalGender.FEMALE).length;
  
  // Consolidação Global de Pesagem e Previsão
  const herdStats = calculateLotWeighingStats(activeAnimals, todayStr);

  return (
    <div className="space-y-6 font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestão do Rebanho</h2>
          <p className="text-slate-500 text-xs">Pesagens individuais e por lote, Ganho Médio Diário (GMD) e Peso Previsto atualizado</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setIsBatchModalOpen(true)} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs cursor-pointer border border-slate-800 shadow-sm"
          >
            <Layers size={16} /> Cadastrar Lote
          </button>
          <button 
            onClick={() => { 
              setCurrentAnimal({ entryDate: todayStr, breed: 'Nelore', gender: AnimalGender.MALE, status: AnimalStatus.ACTIVE, purchaseValue: 0, notes: '', gmd: 0.8 }); 
              setIndWeightValue(0); 
              setIndInitialGmd(0.8);
              setIsModalIndividualOpen(true); 
            }} 
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs cursor-pointer shadow-sm border border-emerald-800"
          >
            <Plus size={16} /> Novo Animal
          </button>
        </div>
      </div>

      {/* Cards de Resumo com Peso Balança, GMD e Peso Previsto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="agro-card p-4.5 flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200/60">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ativo</p>
            <h4 className="text-xl font-black text-slate-900 font-nums">{totalActive} <span className="text-xs font-normal text-slate-400">cab.</span></h4>
            <p className="text-[10px] text-slate-400 font-medium">{males}M / {females}F</p>
          </div>
        </div>

        <div className="agro-card p-4.5 flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200/60">
            <Scale size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Balança</p>
            <h4 className="text-xl font-black text-slate-900 font-nums">{herdStats.avgRecordedArroba.toFixed(1)} <span className="text-xs font-normal text-slate-400">@</span></h4>
            <p className="text-[10px] text-slate-400 font-medium font-nums">{herdStats.avgRecordedWeightKg.toFixed(1)} kg/cab</p>
          </div>
        </div>

        <div className="agro-card p-4.5 flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">GMD Médio</p>
            <h4 className="text-xl font-black text-emerald-700 font-nums">+{herdStats.avgGmd.toFixed(3)} <span className="text-xs font-normal text-emerald-600">kg/d</span></h4>
            <p className="text-[10px] text-emerald-600 font-medium">Ganho Médio Diário</p>
          </div>
        </div>

        <div className="agro-card p-4.5 flex items-center gap-3.5 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200/70">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Peso Previsto Hoje</p>
            <h4 className="text-xl font-black text-emerald-900 font-nums">{herdStats.avgPredictedArroba.toFixed(1)} <span className="text-xs font-bold text-emerald-700">@</span></h4>
            <p className="text-[10px] text-emerald-700 font-bold font-nums">{herdStats.avgPredictedWeightKg.toFixed(1)} kg projetados</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="agro-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por brinco, raça ou lote..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition-all text-xs font-medium text-slate-800" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            className="border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 text-xs font-bold text-slate-700 cursor-pointer" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="available">No Pasto (Ativos)</option>
            <option value="all_history">Histórico Completo</option>
            {Object.values(AnimalStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Lista de Pasto Geral e Lotes */}
      <div className="space-y-6 pb-20">
        {/* Animais Avulsos */}
        {avulsoAnimals.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-800 text-white shadow-sm">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Rebanho Geral (Animais Avulsos)</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{avulsoAnimals.length} animais sem lote específico</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Identificação</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Raça / Sexo</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Última Balança</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">GMD Base</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Peso Previsto Hoje</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {avulsoAnimals.map(animal => renderAnimalRow(animal))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lotes Agrupados */}
        {(Object.entries(groupedLots) as [string, Animal[]][]).map(([lotId, animalsInLot]) => {
          const lot = lots.find(l => l.id === lotId);
          const lotName = lot?.name || 'Lote Desconhecido';
          const isOpen = expandedLots[lotId] ?? false;
          
          const lotStats = calculateLotWeighingStats(animalsInLot, todayStr, lot);

          return (
            <div key={lotId} className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div 
                onClick={() => toggleLot(lotId)} 
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${isOpen ? 'bg-slate-50/90' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOpen ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
                    {isOpen ? <FolderOpen size={22} /> : <Folder size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{lotName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {lotStats.headCount} Cab.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                      <span className="font-nums text-slate-700">
                        Balança: <strong className="text-slate-900">{lotStats.avgRecordedArroba.toFixed(1)} @</strong> ({lotStats.avgRecordedWeightKg.toFixed(1)} kg)
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-emerald-700 font-nums">
                        GMD: <strong className="text-emerald-800">+{lotStats.avgGmd.toFixed(3)} kg/d</strong>
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-emerald-900 font-nums bg-emerald-100/70 px-2 py-0.5 rounded-md font-black flex items-center gap-1">
                        <Sparkles size={11} className="text-emerald-600" />
                        Previsto: {lotStats.avgPredictedArroba.toFixed(1)} @ ({lotStats.avgPredictedWeightKg.toFixed(1)} kg)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center" onClick={e => e.stopPropagation()}>
                  {/* Botão de Pesagem do Lote Completo */}
                  <button 
                    type="button"
                    onClick={() => openLotWeighModal(lotId)} 
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs border border-emerald-800"
                    title="Realizar nova pesagem média do lote completo"
                  >
                    <Scale size={15} />
                    <span>Pesar Lote Completo</span>
                  </button>

                  {/* Vender Lote */}
                  <button 
                    type="button"
                    onClick={() => { setTargetLotId(lotId); setIsLotSellModalOpen(true); }} 
                    className="bg-white border border-slate-200 hover:border-blue-400 text-blue-700 hover:bg-blue-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    Vender Lote
                  </button>

                  <button 
                    type="button"
                    onClick={() => toggleLot(lotId)}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="overflow-x-auto border-t border-slate-200/80">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/60 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Identificação</th>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Raça / Sexo</th>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Última Balança</th>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">GMD Base</th>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Peso Previsto Hoje</th>
                        <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {animalsInLot.map(animal => renderAnimalRow(animal))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL PESAGEM INDIVIDUAL (Com GMD e Peso Previsto em Tempo Real) */}
      {isWeighModalOpen && currentAnimal.id && (() => {
        const last = getAnimalLastWeighing(currentAnimal as Animal);
        const inputWeightKg = weighUnit === 'kg' ? Number(weighValue || 0) : Number(weighValue || 0) * 30;
        const autoCalc = calculateGMDFromWeighing(last.weightKg, inputWeightKg, last.date, weighDate);
        const activeGmd = isCustomGmdManual ? customGmd : (autoCalc.days > 0 ? autoCalc.gmd : (last.gmd || 0));
        const daysFromWeighingToToday = Math.max(0, getDaysDifference(weighDate, todayStr));
        const futurePredicted = inputWeightKg + (daysFromWeighingToToday * activeGmd);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
              <div className="px-7 py-5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-emerald-200">
                    <Scale size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Nova Pesagem: {currentAnimal.earTag}</h3>
                    <p className="text-xs text-emerald-200 font-medium">{currentAnimal.breed} · {currentAnimal.gender}</p>
                  </div>
                </div>
                <button onClick={() => setIsWeighModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full text-white/80 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleWeighingSubmit} className="p-7 space-y-5">
                {/* Resumo da Pesagem Anterior */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Pesagem Registrada</p>
                    <p className="text-base font-black text-slate-800 font-nums mt-0.5">
                      {last.weightKg.toFixed(1)} kg <span className="text-xs font-bold text-slate-500">({(last.weightKg / 30).toFixed(1)} @)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Data: {new Date(last.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">GMD Anterior</span>
                    <span className="text-sm font-black text-emerald-800 font-nums">
                      {last.gmd ? `+${last.gmd.toFixed(3)} kg/d` : '0.000 kg/d'}
                    </span>
                  </div>
                </div>

                {/* Campos da Nova Pesagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Data da Nova Pesagem</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                      value={weighDate} 
                      onChange={e => setWeighDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Novo Peso</label>
                      <div className="flex bg-slate-200 rounded-lg p-0.5">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (weighUnit === 'arroba') {
                              setWeighValue(Number((weighValue * 30).toFixed(1)));
                              setWeighUnit('kg');
                            }
                          }} 
                          className={`px-2 py-0.5 text-[9px] font-black rounded ${weighUnit === 'kg' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                        >
                          KG
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (weighUnit === 'kg') {
                              setWeighValue(Number((weighValue / 30).toFixed(2)));
                              setWeighUnit('arroba');
                            }
                          }} 
                          className={`px-2 py-0.5 text-[9px] font-black rounded ${weighUnit === 'arroba' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
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
                        value={weighValue || ''} 
                        onChange={e => setWeighValue(Number(e.target.value))} 
                        required 
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 uppercase font-mono">
                        {weighUnit === 'kg' ? 'KG' : '@'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cálculo do GMD Obtido e Configuração */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4.5 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">GMD Realizado no Período</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {autoCalc.days} dias corridos ({autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-900 font-nums">
                        {autoCalc.gmd >= 0 ? `+${autoCalc.gmd.toFixed(3)}` : autoCalc.gmd.toFixed(3)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 block">kg/dia</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">GMD Base Para Projeção Diária</label>
                      <p className="text-[10px] text-slate-500">Adicionado diariamente no "Peso Previsto"</p>
                    </div>
                    <div className="w-28 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 font-black text-sm text-emerald-950 bg-white text-right font-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={isCustomGmdManual ? customGmd : (autoCalc.days > 0 ? autoCalc.gmd : last.gmd || 0.8)}
                        onChange={e => {
                          setIsCustomGmdManual(true);
                          setCustomGmd(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Prévia do Peso Previsto */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-emerald-400 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Novo Peso Previsto Hoje</p>
                      <p className="text-xs text-slate-300 font-medium">Projeção diária com base no novo GMD</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-black text-white">{futurePredicted.toFixed(1)} kg</span>
                    <span className="text-xs font-bold text-emerald-300 block">({(futurePredicted / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsWeighModalOpen(false)} 
                    className="flex-1 py-3 px-4 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/20 transition-all active:scale-98"
                  >
                    Salvar Pesagem
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL PESAGEM DO LOTE COMPLETO */}
      {isLotWeighModalOpen && (() => {
        const lot = lots.find(l => l.id === lotWeighLotId);
        const lotAnimals = animals.filter(a => a.lotId === lotWeighLotId && a.status === AnimalStatus.ACTIVE);
        const stats = calculateLotWeighingStats(lotAnimals, todayStr);
        const inputAvgKg = lotWeighUnit === 'kg' ? Number(lotWeighAvgValue || 0) : Number(lotWeighAvgValue || 0) * 30;
        const autoCalc = calculateGMDFromWeighing(stats.avgRecordedWeightKg, inputAvgKg, stats.mostRecentWeighingDate, lotWeighDate);
        const activeGmd = isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd;
        const daysFromWeighingToToday = Math.max(0, getDaysDifference(lotWeighDate, todayStr));
        const futurePredictedAvgKg = inputAvgKg + (daysFromWeighingToToday * activeGmd);
        const totalLotGainKg = (inputAvgKg - stats.avgRecordedWeightKg) * stats.headCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 my-8">
              <div className="px-7 py-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300">
                    <Scale size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Pesagem do Lote: {lot?.name}</h3>
                    <p className="text-xs text-emerald-200 font-medium">{stats.headCount} animais ativos no pasto</p>
                  </div>
                </div>
                <button onClick={() => setIsLotWeighModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full text-white/80 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleLotWeighSubmit} className="p-7 space-y-5">
                {/* Resumo da Última Média do Lote */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Anterior</p>
                    <p className="text-base font-black text-slate-800 font-nums mt-0.5">
                      {stats.avgRecordedWeightKg.toFixed(1)} kg
                    </p>
                    <span className="text-xs font-bold text-slate-500 font-nums">({stats.avgRecordedArroba.toFixed(1)} @)</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Data Base</p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {stats.mostRecentWeighingDate ? new Date(stats.mostRecentWeighingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">GMD Anterior</p>
                    <p className="text-sm font-black text-emerald-800 font-nums mt-0.5">
                      +{stats.avgGmd.toFixed(3)} kg/d
                    </p>
                  </div>
                </div>

                {/* Entradas da Nova Pesagem do Lote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Data da Pesagem Coletiva</label>
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
                          className={`px-2 py-0.5 text-[9px] font-black rounded ${lotWeighUnit === 'kg' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
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
                          className={`px-2 py-0.5 text-[9px] font-black rounded ${lotWeighUnit === 'arroba' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
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

                {/* GMD Realizado e Modo de Distribuição */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4.5 rounded-2xl border border-emerald-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">GMD Médio Calculado do Lote</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {autoCalc.days} dias de intervalo · Ganho total do lote: {totalLotGainKg >= 0 ? `+${totalLotGainKg.toFixed(0)}` : totalLotGainKg.toFixed(0)} kg
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
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">GMD Base Para o Lote</label>
                      <p className="text-[10px] text-slate-500">Usado no cálculo diário do "Peso Previsto" dos animais</p>
                    </div>
                    <div className="w-28 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 font-black text-sm text-emerald-950 bg-white text-right font-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd}
                        onChange={e => {
                          setIsLotWeighGmdManual(true);
                          setLotWeighGmd(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>

                  {/* Modo de aplicação */}
                  <div className="pt-2 border-t border-emerald-200/60 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Modo de Aplicação nos Animais</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('uniform')}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          lotWeighApplyMode === 'uniform' 
                            ? 'bg-white border-emerald-500 shadow-xs' 
                            : 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">Peso Uniforme</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Todos os animais recebem {inputAvgKg.toFixed(1)} kg</p>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('gain_delta')}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          lotWeighApplyMode === 'gain_delta' 
                            ? 'bg-white border-emerald-500 shadow-xs' 
                            : 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">Ganho Proporcional</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Soma {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg no peso individual</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prévia do Peso Previsto do Lote */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-emerald-400 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Novo Peso Previsto Médio</p>
                      <p className="text-xs text-slate-300 font-medium">Projeção diária por cabeça no lote</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-black text-white">{futurePredictedAvgKg.toFixed(1)} kg</span>
                    <span className="text-xs font-bold text-emerald-300 block">({(futurePredictedAvgKg / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsLotWeighModalOpen(false)} 
                    className="flex-1 py-3 px-4 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/20 transition-all active:scale-98"
                  >
                    Confirmar Pesagem do Lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL NOVO CADASTRO INDIVIDUAL */}
      {isModalIndividualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden scale-in max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Novo Cadastro</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">Preencha as informações iniciais do animal</p>
               </div>
               <button onClick={() => setIsModalIndividualOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleIndividualSubmit} className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BRINCO (ID)</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500" value={currentAnimal.earTag || ''} onChange={e => setCurrentAnimal({...currentAnimal, earTag: e.target.value})} placeholder="Ex: NEL-123" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATA ENTRADA/NASC.</label>
                    <input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 cursor-pointer" value={currentAnimal.entryDate || ''} onChange={e => setCurrentAnimal({...currentAnimal, entryDate: e.target.value})} required />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RAÇA</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 cursor-pointer appearance-none" value={currentAnimal.breed || ''} onChange={e => setCurrentAnimal({...currentAnimal, breed: e.target.value})}>
                       <option value="Nelore">Nelore</option>
                       <option value="Angus">Angus</option>
                       <option value="Cruzado">Cruzado</option>
                       <option value="Senepol">Senepol</option>
                       <option value="Brahman">Brahman</option>
                       <option value="Brangus">Brangus</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PESO INICIAL (KG)</label>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 font-nums" value={indWeightValue || ''} onChange={e => setIndWeightValue(Number(e.target.value))} required />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GÊNERO</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 cursor-pointer appearance-none" value={currentAnimal.gender || AnimalGender.MALE} onChange={e => setCurrentAnimal({...currentAnimal, gender: e.target.value as AnimalGender})}>
                       <option value={AnimalGender.MALE}>Macho</option>
                       <option value={AnimalGender.FEMALE}>Fêmea</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LOTE DE MANEJO</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50 cursor-pointer appearance-none" value={currentAnimal.lotId || ''} onChange={e => setCurrentAnimal({...currentAnimal, lotId: e.target.value})}>
                       <option value="">Nenhum (Pasto Geral)</option>
                       {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
               </div>

               {/* GMD Inicial Esperado */}
               <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
                  <div>
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">GMD Inicial Esperado (kg/dia)</label>
                    <p className="text-[10px] text-emerald-600">Alimenta o cálculo diário do "Peso Previsto" até a próxima pesagem</p>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      step="0.001" 
                      onFocus={handleFocus}
                      className="w-full border border-emerald-300 rounded-xl px-3 py-2 font-black text-base text-emerald-950 bg-white text-right font-nums focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={indInitialGmd} 
                      onChange={e => setIndInitialGmd(Number(e.target.value))} 
                    />
                  </div>
               </div>

               {/* SEÇÃO INVESTIMENTO */}
               <div className="border-2 border-emerald-50 bg-emerald-50/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">INVESTIMENTO / AQUISIÇÃO</h4>
                     <div className="flex bg-white rounded-lg p-0.5 border border-emerald-100 shadow-2xs">
                        <button type="button" onClick={() => setIndPriceMode('total')} className={`px-4 py-2 text-[9px] font-black rounded-md transition-all ${indPriceMode === 'total' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}>VALOR TOTAL</button>
                        <button type="button" onClick={() => setIndPriceMode('arroba')} className={`px-4 py-2 text-[9px] font-black rounded-md transition-all ${indPriceMode === 'arroba' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}>VALOR P/ @</button>
                     </div>
                  </div>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">R$</span>
                     <input type="number" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl pl-16 pr-6 py-4 font-black text-2xl text-emerald-900 bg-white outline-none focus:ring-4 focus:ring-emerald-50 font-nums" value={currentAnimal.purchaseValue || ''} onChange={e => setCurrentAnimal({...currentAnimal, purchaseValue: Number(e.target.value)})} placeholder="0,00" />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium text-center uppercase tracking-wider">Gera lançamento financeiro automático. Use 0 para nascimentos na fazenda.</p>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ESTADO DE SAÚDE</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-slate-50" value={currentAnimal.status || AnimalStatus.ACTIVE} onChange={e => setCurrentAnimal({...currentAnimal, status: e.target.value as AnimalStatus})}>
                       {Object.values(AnimalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OBSERVAÇÕES</label>
                    <textarea rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium bg-slate-50 focus:bg-white outline-none" value={currentAnimal.notes || ''} onChange={e => setCurrentAnimal({...currentAnimal, notes: e.target.value})} placeholder="Ex: Vacinação em dia, pedigree..." />
                  </div>
               </div>

               <div className="flex gap-4 pt-4 shrink-0">
                  <button type="button" onClick={() => setIsModalIndividualOpen(false)} className="flex-1 px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">CANCELAR</button>
                  <button type="submit" className="flex-2 px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95">SALVAR</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOTE (BATCH ENTRY) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Cadastrar Novo Lote de Animais</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Entrada coletiva por lote</p>
               </div>
               <button onClick={() => setIsBatchModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lote de Destino (Obrigatório)</label>
                    <select 
                      className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={batchLotId} 
                      onChange={e => {
                        const newLotId = e.target.value;
                        setBatchLotId(newLotId);
                        const selectedLot = lots.find(l => l.id === newLotId);
                        if (selectedLot && typeof selectedLot.averageGmd === 'number') {
                          setBatchInitialGmd(selectedLot.averageGmd);
                        }
                      }} 
                      required
                    >
                       <option value="">Selecione um lote...</option>
                       {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Quantidade Total</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-900 bg-slate-50 outline-none font-nums" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Peso Médio Inicial</label>
                      <div className="flex bg-slate-200 rounded-lg p-1">
                        <button type="button" onClick={() => setBatchWeightType('kg')} className={`px-2 py-0.5 text-[8px] font-black rounded ${batchWeightType === 'kg' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}>KG</button>
                        <button type="button" onClick={() => setBatchWeightType('arroba')} className={`px-2 py-0.5 text-[8px] font-black rounded ${batchWeightType === 'arroba' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}>@</button>
                      </div>
                    </div>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50 outline-none font-nums" value={batchWeightValue} onChange={e => setBatchWeightValue(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data Entrada</label>
                    <input type="date" className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
                  </div>
               </div>

               {/* GMD Inicial Esperado do Lote */}
               <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
                  <div>
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">GMD Inicial Esperado (kg/dia)</label>
                    <p className="text-[10px] text-emerald-600">Será aplicado no "Peso Previsto" diário de todos os animais do lote</p>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      step="0.001" 
                      onFocus={handleFocus}
                      className="w-full border border-emerald-300 rounded-xl px-3 py-2 font-black text-base text-emerald-950 bg-white text-right font-nums focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={batchInitialGmd} 
                      onChange={e => setBatchInitialGmd(Number(e.target.value))} 
                    />
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                     <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Valor de Compra</h4>
                     <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-2xs">
                        <button type="button" onClick={() => setBatchPriceMode('head')} className={`px-3 py-1 text-[9px] font-black rounded ${batchPriceMode === 'head' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400'}`}>P/ CABEÇA</button>
                        <button type="button" onClick={() => setBatchPriceMode('arroba')} className={`px-3 py-1 text-[9px] font-black rounded ${batchPriceMode === 'arroba' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400'}`}>P/ ARROBA (@)</button>
                     </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xl">R$</span>
                    <input type="number" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl pl-16 pr-6 py-4 font-black text-2xl text-slate-900 bg-white font-nums" value={batchPriceValue || ''} onChange={e => setBatchPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>

               <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all">Salvar Lote de Animais</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VENDA INDIVIDUAL */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-in">
            <div className="px-8 py-6 bg-green-700 text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight">Liquidar Animal: {currentAnimal.earTag}</h3>
               <button onClick={() => setIsSellModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleIndividualSale} className="p-8 space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data da Venda</label>
                  <input type="date" className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50" value={actionDate} onChange={e => setActionDate(e.target.value)} required />
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Peso Final</label>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button type="button" onClick={() => setSellWeightType('kg')} className={`px-2 py-0.5 text-[8px] font-black rounded ${sellWeightType === 'kg' ? 'bg-green-600 text-white shadow-2xs' : 'text-slate-400'}`}>KG</button>
                      <button type="button" onClick={() => setSellWeightType('arroba')} className={`px-2 py-0.5 text-[8px] font-black rounded ${sellWeightType === 'arroba' ? 'bg-green-600 text-white shadow-2xs' : 'text-slate-400'}`}>@</button>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-black text-xl text-green-900 bg-slate-50 outline-none font-nums" value={sellWeightValue || ''} onChange={e => setSellWeightValue(Number(e.target.value))} required />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 uppercase">{sellWeightType === 'kg' ? 'KG' : '@'}</span>
                  </div>
               </div>
               <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Modo de Venda</label>
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button type="button" onClick={() => setSellPriceMode('head')} className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${sellPriceMode === 'head' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-400'}`}>P/ CABEÇA</button>
                        <button type="button" onClick={() => setSellPriceMode('arroba')} className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${sellPriceMode === 'arroba' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-400'}`}>P/ @</button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-green-600 font-black text-2xl">R$</span>
                    <input type="number" step="0.01" onFocus={handleFocus} required className="w-full border border-slate-200 rounded-2xl pl-16 pr-6 py-4 font-black text-3xl text-green-900 bg-slate-50 outline-none font-nums" value={sellPriceValue || ''} onChange={e => setSellPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>
               <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÓBITO */}
      {isDeathModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-in">
            <div className="px-8 py-6 bg-red-600 text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight">Informar Óbito: {currentAnimal.earTag}</h3>
               <button onClick={() => setIsDeathModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAnimalDeath(currentAnimal.id!, actionDate, deathCause); setIsDeathModalOpen(false); }} className="p-8 space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data do Ocorrido</label>
                  <input type="date" className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50" value={actionDate} onChange={e => setActionDate(e.target.value)} required />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Causa Estimada</label>
                  <input type="text" className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50 focus:bg-white outline-none" value={deathCause} onChange={e => setDeathCause(e.target.value)} placeholder="Ex: Doença, Acidente, etc." required />
               </div>
               <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="text-red-600 shrink-0" size={24} />
                  <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider leading-relaxed">Atenção: Esta ação removerá o animal do rebanho ativo.</p>
               </div>
               <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl">Confirmar Óbito</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venda de Lote */}
      {isLotSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-in">
            <div className="px-8 py-6 bg-emerald-700 text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight">Venda de Lote</h3>
               <button onClick={() => setIsLotSellModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(onSellLot) onSellLot(targetLotId, lotSellDate, lotSellAvgWeight, lotSellPriceMode, lotSellPriceValue); setIsLotSellModalOpen(false); }} className="p-8 space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data da Venda</label>
                  <input type="date" className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-bold bg-slate-50 outline-none" value={lotSellDate} onChange={e => setLotSellDate(e.target.value)} required />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Peso Médio Final (kg)</label>
                  <div className="relative">
                    <input type="number" onFocus={handleFocus} className="w-full border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-800 bg-slate-50 focus:bg-white outline-none font-nums" value={lotSellAvgWeight} onChange={e => setLotSellAvgWeight(Number(e.target.value))} required />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 uppercase">KG</span>
                  </div>
               </div>
               <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Modo de Venda</label>
                    <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200">
                        <button type="button" onClick={() => setLotSellPriceMode('head')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${lotSellPriceMode === 'head' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}>P/ CABEÇA</button>
                        <button type="button" onClick={() => setLotSellPriceMode('arroba')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${lotSellPriceMode === 'arroba' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'}`}>P/ ARROBA (@)</button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-2xl">R$</span>
                    <input type="number" onFocus={handleFocus} required className="w-full border border-slate-200 rounded-2xl pl-16 pr-6 py-4 font-black text-3xl text-emerald-900 bg-slate-50 focus:bg-white outline-none font-nums" value={lotSellPriceValue || ''} onChange={e => setLotSellPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>
               <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all">Confirmar Venda do Lote</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalManager;
