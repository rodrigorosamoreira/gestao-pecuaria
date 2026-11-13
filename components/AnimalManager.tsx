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
      <tr key={animal.id} className="hover:bg-[#F6F8F5] transition-colors border-b border-[#E3EAE6]">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#20332C] font-nums">{animal.earTag}</span>
            {animal.lotId && (
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-[#F6F8F5] text-[#64766C] border border-[#E3EAE6]">
                {lots.find(l => l.id === animal.lotId)?.name || 'Lote'}
              </span>
            )}
          </div>
        </td>
        
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#20332C]">{animal.breed}</span>
            <span className={`text-xs font-normal ${animal.gender === AnimalGender.FEMALE ? 'text-rose-600' : 'text-[#536579]'}`}>
              {animal.gender}
            </span>
          </div>
        </td>

        {/* Peso Balança (Última Pesagem) */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-[#20332C] font-nums">{lastWeigh.weightKg.toFixed(1)}</span>
              <span className="text-xs font-normal text-[#64766C]">kg</span>
              <span className="text-xs font-normal text-[#64766C] font-nums ml-1">({(lastWeigh.weightKg / 30).toFixed(1)} @)</span>
            </div>
            <span className="text-xs text-[#64766C] font-normal">
              Balança: {lastWeigh.date ? new Date(lastWeigh.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
            </span>
          </div>
        </td>

        {/* GMD Diário (Lote ou Individual) */}
        <td className="px-6 py-4">
          <div className="inline-flex flex-col gap-0.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DCEDE4] border border-[#145C46]/20 text-[#145C46]">
              <TrendingUp size={13} className="text-[#145C46]" />
              <span className="text-xs font-semibold font-nums">
                {pred.gmd > 0 ? `+${pred.gmd.toFixed(3)}` : pred.gmd.toFixed(3)}
              </span>
              <span className="text-xs font-normal text-[#145C46] ml-0.5">kg/d</span>
            </div>
            {pred.gmdSource === 'lot' && (
              <span className="text-xs font-normal text-[#64766C] px-1">
                Lote: {pred.lotName || 'Atribuído'}
              </span>
            )}
          </div>
        </td>

        {/* Peso Previsto Atualizado Diariamente */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-[#145C46] font-nums">{pred.predictedWeightKg.toFixed(1)}</span>
              <span className="text-xs font-normal text-[#145C46]">kg</span>
              <span className="text-xs font-semibold text-[#145C46] font-nums ml-1.5">
                ({pred.predictedArroba.toFixed(1)} @)
              </span>
            </div>
            {pred.daysElapsed > 0 ? (
              <span className="text-xs font-medium text-[#145C46] flex items-center gap-1">
                <Sparkles size={11} />
                +{pred.weightGainKg.toFixed(1)} kg em {pred.daysElapsed}d
              </span>
            ) : (
              <span className="text-xs font-normal text-[#64766C]">Pesado hoje</span>
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
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug">Gestão do Rebanho</h2>
          <p className="text-sm text-[#64766C] font-normal mt-0.5">Pesagens individuais e por lote, Ganho Médio Diário (GMD) e Peso Previsto atualizado</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setIsBatchModalOpen(true)} 
            className="bg-white hover:bg-[#F6F8F5] text-[#20332C] px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm cursor-pointer border border-[#E3EAE6] shadow-2xs"
          >
            <Layers size={16} className="text-[#145C46]" /> Cadastrar Lote
          </button>
          <button 
            onClick={() => { 
              setCurrentAnimal({ entryDate: todayStr, breed: 'Nelore', gender: AnimalGender.MALE, status: AnimalStatus.ACTIVE, purchaseValue: 0, notes: '', gmd: 0.8 }); 
              setIndWeightValue(0); 
              setIndInitialGmd(0.8);
              setIsModalIndividualOpen(true); 
            }} 
            className="bg-[#145C46] hover:bg-[#0E4434] text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm cursor-pointer shadow-sm"
          >
            <Plus size={16} /> Novo Animal
          </button>
        </div>
      </div>

      {/* Cards de Resumo com Peso Balança, GMD e Peso Previsto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="agro-card p-5 flex items-center gap-3.5">
          <div className="p-3 bg-[#F6F8F5] text-[#145C46] rounded-xl border border-[#E3EAE6]">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64766C]">Total Ativo</p>
            <h4 className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">
              {totalActive} <span className="text-sm font-normal text-[#64766C] ml-1">cab.</span>
            </h4>
            <p className="text-xs text-[#64766C] font-normal mt-0.5">{males}M / {females}F</p>
          </div>
        </div>

        <div className="agro-card p-5 flex items-center gap-3.5">
          <div className="p-3 bg-[#F6F8F5] text-[#145C46] rounded-xl border border-[#E3EAE6]">
            <Scale size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64766C]">Média Balança</p>
            <h4 className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">
              {herdStats.avgRecordedArroba.toFixed(1)} <span className="text-sm font-normal text-[#64766C] ml-1">@</span>
            </h4>
            <p className="text-xs text-[#64766C] font-normal font-nums mt-0.5">{herdStats.avgRecordedWeightKg.toFixed(1)} kg/cab</p>
          </div>
        </div>

        <div className="agro-card p-5 flex items-center gap-3.5">
          <div className="p-3 bg-[#DCEDE4] text-[#145C46] rounded-xl border border-[#145C46]/20">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#145C46]">GMD Médio</p>
            <h4 className="text-2xl font-semibold text-[#145C46] font-nums leading-tight mt-0.5">
              +{herdStats.avgGmd.toFixed(3)} <span className="text-sm font-normal text-[#218568] ml-1">kg/d</span>
            </h4>
            <p className="text-xs text-[#64766C] font-normal mt-0.5">Ganho Médio Diário</p>
          </div>
        </div>

        <div className="agro-card p-5 flex items-center gap-3.5 bg-gradient-to-br from-[#DCEDE4]/30 to-white border-[#E3EAE6]">
          <div className="p-3 bg-[#145C46] text-white rounded-xl shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#145C46]">Peso Previsto Hoje</p>
            <h4 className="text-2xl font-semibold text-[#20332C] font-nums leading-tight mt-0.5">
              {herdStats.avgPredictedArroba.toFixed(1)} <span className="text-sm font-medium text-[#145C46] ml-1">@</span>
            </h4>
            <p className="text-xs text-[#218568] font-normal font-nums mt-0.5">{herdStats.avgPredictedWeightKg.toFixed(1)} kg projetados</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="agro-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por brinco, raça ou lote..." 
            className="w-full pl-10 pr-4 py-2.5 border border-[#E3EAE6] rounded-xl outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal text-[#20332C]" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-[#64766C]" size={18} />
          <select 
            className="border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] text-sm font-medium text-[#20332C] cursor-pointer" 
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
          <div className="bg-white rounded-2xl shadow-xs border border-[#E3EAE6] overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#145C46] text-white shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#20332C]">Rebanho Geral (Animais Avulsos)</h3>
                  <p className="text-xs font-normal text-[#64766C] mt-0.5">{avulsoAnimals.length} animais sem lote específico</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F6F8F5] border-b border-[#E3EAE6]">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Identificação</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Raça / Sexo</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Última Balança</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">GMD Base</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Peso Previsto Hoje</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-[#64766C] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAE6]">
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
            <div key={lotId} className="bg-white rounded-2xl shadow-xs border border-[#E3EAE6] overflow-hidden">
              <div 
                onClick={() => toggleLot(lotId)} 
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${isOpen ? 'bg-[#F6F8F5]' : 'hover:bg-[#F6F8F5]/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isOpen ? 'bg-[#145C46] text-white shadow-xs' : 'bg-[#F6F8F5] text-[#145C46] border border-[#E3EAE6]'}`}>
                    {isOpen ? <FolderOpen size={20} /> : <Folder size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-[#20332C]">{lotName}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#DCEDE4] text-[#145C46]">
                        {lotStats.headCount} Cab.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-normal text-[#64766C] mt-1">
                      <span className="font-nums text-[#20332C]">
                        Balança: <strong className="font-semibold text-[#20332C]">{lotStats.avgRecordedArroba.toFixed(1)} @</strong> ({lotStats.avgRecordedWeightKg.toFixed(1)} kg)
                      </span>
                      <span className="w-1 h-1 bg-[#64766C]/40 rounded-full"></span>
                      <span className="text-[#145C46] font-nums">
                        GMD: <strong className="font-semibold text-[#145C46]">+{lotStats.avgGmd.toFixed(3)} kg/d</strong>
                      </span>
                      <span className="w-1 h-1 bg-[#64766C]/40 rounded-full"></span>
                      <span className="text-[#145C46] font-nums bg-[#DCEDE4]/70 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <Sparkles size={11} className="text-[#145C46]" />
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
                    className="bg-[#145C46] hover:bg-[#0E4434] text-white px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    title="Realizar nova pesagem média do lote completo"
                  >
                    <Scale size={15} />
                    <span>Pesar Lote Completo</span>
                  </button>

                  {/* Vender Lote */}
                  <button 
                    type="button"
                    onClick={() => { setTargetLotId(lotId); setIsLotSellModalOpen(true); }} 
                    className="bg-white border border-[#E3EAE6] hover:border-[#145C46] text-[#20332C] hover:bg-[#F6F8F5] px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shadow-2xs"
                  >
                    Vender Lote
                  </button>

                  <button 
                    type="button"
                    onClick={() => toggleLot(lotId)}
                    className="p-2 text-[#64766C] hover:text-[#20332C]"
                  >
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="overflow-x-auto border-t border-[#E3EAE6]">
                  <table className="w-full text-left">
                    <thead className="bg-[#F6F8F5] border-b border-[#E3EAE6]">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Identificação</th>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Raça / Sexo</th>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Última Balança</th>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">GMD Base</th>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Peso Previsto Hoje</th>
                        <th className="px-6 py-3.5 text-xs font-medium text-[#64766C] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3EAE6]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E3EAE6] my-8">
              <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#DCEDE4] text-[#145C46]">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Nova Pesagem: {currentAnimal.earTag}</h3>
                    <p className="text-[13px] font-normal leading-normal text-[#64766C]">{currentAnimal.breed} · {currentAnimal.gender}</p>
                  </div>
                </div>
                <button onClick={() => setIsWeighModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-[#64766C] hover:text-[#20332C] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleWeighingSubmit} className="p-6 space-y-5">
                {/* Resumo da Pesagem Anterior */}
                <div className="p-4 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium leading-snug text-[#64766C]">Última Pesagem Registrada</p>
                    <p className="text-base font-semibold text-[#20332C] font-nums mt-0.5">
                      {last.weightKg.toFixed(1)}<span className="ml-1 text-xs font-normal text-[#64766C]">kg</span>
                      <span className="ml-1.5 text-xs font-normal text-[#64766C]">({(last.weightKg / 30).toFixed(1)} @)</span>
                    </p>
                    <p className="text-xs font-normal text-[#64766C] mt-0.5">
                      Data: {new Date(last.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium leading-snug text-[#145C46] block">GMD Anterior</span>
                    <span className="text-sm font-semibold text-[#145C46] font-nums">
                      {last.gmd ? `+${last.gmd.toFixed(3)} kg/d` : '0.000 kg/d'}
                    </span>
                  </div>
                </div>

                {/* Campos da Nova Pesagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Data da Nova Pesagem</label>
                    <input 
                      type="date" 
                      className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" 
                      value={weighDate} 
                      onChange={e => setWeighDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-medium leading-snug text-[#64766C]">Novo Peso</label>
                      <div className="flex bg-[#F6F8F5] border border-[#E3EAE6] rounded-lg p-0.5">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (weighUnit === 'arroba') {
                              setWeighValue(Number((weighValue * 30).toFixed(1)));
                              setWeighUnit('kg');
                            }
                          }} 
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${weighUnit === 'kg' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
                        >
                          kg
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (weighUnit === 'kg') {
                              setWeighValue(Number((weighValue / 30).toFixed(2)));
                              setWeighUnit('arroba');
                            }
                          }} 
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${weighUnit === 'arroba' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
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
                        className="w-full border border-[#E3EAE6] rounded-xl px-4 py-2 text-lg font-semibold text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] pr-12 font-nums" 
                        value={weighValue || ''} 
                        onChange={e => setWeighValue(Number(e.target.value))} 
                        required 
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-medium text-xs text-[#64766C]">
                        {weighUnit === 'kg' ? 'kg' : '@'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cálculo do GMD Obtido e Configuração */}
                <div className="bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#145C46]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium leading-snug text-[#145C46]">GMD Realizado no Período</p>
                      <p className="text-xs font-normal text-[#64766C] mt-0.5">
                        {autoCalc.days} dias corridos ({autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-semibold text-[#145C46] font-nums">
                        {autoCalc.gmd >= 0 ? `+${autoCalc.gmd.toFixed(3)}` : autoCalc.gmd.toFixed(3)}
                      </span>
                      <span className="text-xs font-normal text-[#64766C] block">kg/dia</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#145C46]/15 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#20332C] block">GMD Base para Projeção Diária</label>
                      <p className="text-xs font-normal text-[#64766C]">Adicionado diariamente no "Peso Previsto"</p>
                    </div>
                    <div className="w-28 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-[#145C46]/30 rounded-xl px-3 py-1.5 font-semibold text-sm text-[#145C46] bg-white text-right font-nums focus:ring-2 focus:ring-[#145C46]/20 outline-none"
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
                <div className="p-4 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-[#145C46] shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-medium text-[#145C46]">Novo Peso Previsto Hoje</p>
                      <p className="text-xs font-normal text-[#64766C]">Projeção diária com base no novo GMD</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-semibold text-[#20332C]">{futurePredicted.toFixed(1)}<span className="ml-1 text-xs font-normal text-[#64766C]">kg</span></span>
                    <span className="text-xs font-medium text-[#145C46] block">({(futurePredicted / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsWeighModalOpen(false)} 
                    className="flex-1 py-2.5 px-4 rounded-xl text-[#64766C] border border-[#E3EAE6] font-semibold text-sm leading-snug hover:bg-[#F6F8F5] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-2.5 px-6 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all active:scale-98"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAE6] my-8">
              <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#DCEDE4] text-[#145C46]">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Pesagem do Lote: {lot?.name}</h3>
                    <p className="text-[13px] font-normal leading-normal text-[#64766C]">{stats.headCount} animais ativos no pasto</p>
                  </div>
                </div>
                <button onClick={() => setIsLotWeighModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-[#64766C] hover:text-[#20332C] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleLotWeighSubmit} className="p-6 space-y-5">
                {/* Resumo da Última Média do Lote */}
                <div className="p-4 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6] grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-medium leading-snug text-[#64766C]">Média Anterior</p>
                    <p className="text-base font-semibold text-[#20332C] font-nums mt-0.5">
                      {stats.avgRecordedWeightKg.toFixed(1)}<span className="ml-1 text-xs font-normal text-[#64766C]">kg</span>
                    </p>
                    <span className="text-xs font-normal text-[#64766C] font-nums">({stats.avgRecordedArroba.toFixed(1)} @)</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-snug text-[#64766C]">Última Data Base</p>
                    <p className="text-sm font-semibold text-[#20332C] mt-0.5">
                      {stats.mostRecentWeighingDate ? new Date(stats.mostRecentWeighingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Entrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-snug text-[#145C46]">GMD Anterior</p>
                    <p className="text-sm font-semibold text-[#145C46] font-nums mt-0.5">
                      +{stats.avgGmd.toFixed(3)} kg/d
                    </p>
                  </div>
                </div>

                {/* Entradas da Nova Pesagem do Lote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Data da Pesagem Coletiva</label>
                    <input 
                      type="date" 
                      className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" 
                      value={lotWeighDate} 
                      onChange={e => setLotWeighDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-medium leading-snug text-[#64766C]">Novo Peso Médio</label>
                      <div className="flex bg-[#F6F8F5] border border-[#E3EAE6] rounded-lg p-0.5">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (lotWeighUnit === 'arroba') {
                              setLotWeighAvgValue(Number((lotWeighAvgValue * 30).toFixed(1)));
                              setLotWeighUnit('kg');
                            }
                          }} 
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${lotWeighUnit === 'kg' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
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
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${lotWeighUnit === 'arroba' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}
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
                        className="w-full border border-[#E3EAE6] rounded-xl px-4 py-2 text-lg font-semibold text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] pr-12 font-nums" 
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

                {/* GMD Realizado e Modo de Distribuição */}
                <div className="bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#145C46]/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium leading-snug text-[#145C46]">GMD Médio Calculado do Lote</p>
                      <p className="text-xs font-normal text-[#64766C] mt-0.5">
                        {autoCalc.days} dias de intervalo · Ganho total do lote: {totalLotGainKg >= 0 ? `+${totalLotGainKg.toFixed(0)}` : totalLotGainKg.toFixed(0)} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-semibold text-[#145C46] font-nums">
                        {autoCalc.gmd >= 0 ? `+${autoCalc.gmd.toFixed(3)}` : autoCalc.gmd.toFixed(3)}
                      </span>
                      <span className="text-xs font-normal text-[#64766C] block">kg/dia/cab</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#145C46]/15 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[#20332C] block">GMD Base para o Lote</label>
                      <p className="text-xs font-normal text-[#64766C]">Usado no cálculo diário do "Peso Previsto" dos animais</p>
                    </div>
                    <div className="w-28 relative">
                      <input 
                        type="number" 
                        step="0.001" 
                        onFocus={handleFocus}
                        className="w-full border border-[#145C46]/30 rounded-xl px-3 py-1.5 font-semibold text-sm text-[#145C46] bg-white text-right font-nums focus:ring-2 focus:ring-[#145C46]/20 outline-none"
                        value={isLotWeighGmdManual ? lotWeighGmd : autoCalc.gmd}
                        onChange={e => {
                          setIsLotWeighGmdManual(true);
                          setLotWeighGmd(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>

                  {/* Modo de aplicação */}
                  <div className="pt-2.5 border-t border-[#145C46]/15 space-y-2">
                    <label className="text-xs font-medium text-[#20332C] block">Modo de Aplicação nos Animais</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('uniform')}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          lotWeighApplyMode === 'uniform' 
                            ? 'bg-white border-[#145C46] shadow-2xs' 
                            : 'bg-white/60 border-[#E3EAE6] text-[#64766C]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#20332C] leading-snug">Peso Uniforme</p>
                        <p className="text-xs font-normal text-[#64766C] leading-snug mt-0.5">Todos os animais recebem {inputAvgKg.toFixed(1)} kg</p>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setLotWeighApplyMode('gain_delta')}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          lotWeighApplyMode === 'gain_delta' 
                            ? 'bg-white border-[#145C46] shadow-2xs' 
                            : 'bg-white/60 border-[#E3EAE6] text-[#64766C]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#20332C] leading-snug">Ganho Proporcional</p>
                        <p className="text-xs font-normal text-[#64766C] leading-snug mt-0.5">Soma {autoCalc.weightDiffKg >= 0 ? `+${autoCalc.weightDiffKg.toFixed(1)}` : autoCalc.weightDiffKg.toFixed(1)} kg no peso individual</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prévia do Peso Previsto do Lote */}
                <div className="p-4 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-[#145C46] shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-medium text-[#145C46]">Novo Peso Previsto Médio</p>
                      <p className="text-xs font-normal text-[#64766C]">Projeção diária por cabeça no lote</p>
                    </div>
                  </div>
                  <div className="text-right font-nums">
                    <span className="text-lg font-semibold text-[#20332C]">{futurePredictedAvgKg.toFixed(1)}<span className="ml-1 text-xs font-normal text-[#64766C]">kg</span></span>
                    <span className="text-xs font-medium text-[#145C46] block">({(futurePredictedAvgKg / 30).toFixed(1)} @)</span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsLotWeighModalOpen(false)} 
                    className="flex-1 py-2.5 px-4 rounded-xl text-[#64766C] border border-[#E3EAE6] font-semibold text-sm leading-snug hover:bg-[#F6F8F5] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-2.5 px-6 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all active:scale-98"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-[#E3EAE6] max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Novo Cadastro de Animal</h3>
                  <p className="text-[13px] font-normal leading-normal text-[#64766C]">Preencha as informações iniciais do animal</p>
               </div>
               <button onClick={() => setIsModalIndividualOpen(false)} className="text-[#64766C] hover:text-[#20332C] hover:bg-white rounded-xl p-2 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleIndividualSubmit} className="p-6 space-y-5 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Brinco (ID) *</label>
                    <input type="text" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={currentAnimal.earTag || ''} onChange={e => setCurrentAnimal({...currentAnimal, earTag: e.target.value})} placeholder="Ex: NEL-123" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Data de Entrada / Nascimento *</label>
                    <input type="date" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] cursor-pointer" value={currentAnimal.entryDate || ''} onChange={e => setCurrentAnimal({...currentAnimal, entryDate: e.target.value})} required />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Raça</label>
                    <select className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] cursor-pointer" value={currentAnimal.breed || ''} onChange={e => setCurrentAnimal({...currentAnimal, breed: e.target.value})}>
                       <option value="Nelore">Nelore</option>
                       <option value="Angus">Angus</option>
                       <option value="Cruzado">Cruzado</option>
                       <option value="Senepol">Senepol</option>
                       <option value="Brahman">Brahman</option>
                       <option value="Brangus">Brangus</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Peso Inicial (kg) *</label>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-semibold leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={indWeightValue || ''} onChange={e => setIndWeightValue(Number(e.target.value))} required />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Gênero</label>
                    <select className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] cursor-pointer" value={currentAnimal.gender || AnimalGender.MALE} onChange={e => setCurrentAnimal({...currentAnimal, gender: e.target.value as AnimalGender})}>
                       <option value={AnimalGender.MALE}>Macho</option>
                       <option value={AnimalGender.FEMALE}>Fêmea</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Lote de Manejo</label>
                    <select className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] cursor-pointer" value={currentAnimal.lotId || ''} onChange={e => setCurrentAnimal({...currentAnimal, lotId: e.target.value})}>
                       <option value="">Nenhum (Pasto Geral)</option>
                       {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
               </div>

               {/* GMD Inicial Esperado */}
               <div className="p-4 bg-[#DCEDE4]/50 rounded-xl border border-[#145C46]/20 flex items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#145C46] block">GMD Inicial Esperado (kg/dia)</label>
                    <p className="text-xs font-normal text-[#64766C] mt-0.5">Alimenta o cálculo diário do "Peso Previsto" até a próxima pesagem</p>
                  </div>
                  <div className="w-32 shrink-0">
                    <input 
                      type="number" 
                      step="0.001" 
                      onFocus={handleFocus}
                      className="w-full border border-[#145C46]/30 rounded-xl px-3 py-2 font-semibold text-sm text-[#145C46] bg-white text-right font-nums focus:ring-2 focus:ring-[#145C46]/20 outline-none" 
                      value={indInitialGmd} 
                      onChange={e => setIndInitialGmd(Number(e.target.value))} 
                    />
                  </div>
               </div>

               {/* SEÇÃO INVESTIMENTO */}
               <div className="border border-[#E3EAE6] bg-[#F6F8F5] rounded-xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                     <h4 className="text-xs font-semibold text-[#145C46]">Investimento / Aquisição</h4>
                     <div className="flex bg-white rounded-lg p-0.5 border border-[#E3EAE6]">
                        <button type="button" onClick={() => setIndPriceMode('total')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${indPriceMode === 'total' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>Valor Total</button>
                        <button type="button" onClick={() => setIndPriceMode('arroba')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${indPriceMode === 'arroba' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>Valor p/ @</button>
                     </div>
                  </div>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-semibold text-base">R$</span>
                     <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl pl-12 pr-4 py-3 font-semibold text-xl text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={currentAnimal.purchaseValue || ''} onChange={e => setCurrentAnimal({...currentAnimal, purchaseValue: Number(e.target.value)})} placeholder="0,00" />
                  </div>
                  <p className="text-xs text-[#64766C] font-normal">Gera lançamento financeiro automático. Use 0 para nascimentos na fazenda.</p>
               </div>

               <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Estado de Saúde / Status</label>
                    <select className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={currentAnimal.status || AnimalStatus.ACTIVE} onChange={e => setCurrentAnimal({...currentAnimal, status: e.target.value as AnimalStatus})}>
                       {Object.values(AnimalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Observações</label>
                    <textarea rows={2} className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={currentAnimal.notes || ''} onChange={e => setCurrentAnimal({...currentAnimal, notes: e.target.value})} placeholder="Ex: Vacinação em dia, pedigree..." />
                  </div>
               </div>

               <div className="flex gap-3 pt-3 border-t border-[#E3EAE6] shrink-0">
                  <button type="button" onClick={() => setIsModalIndividualOpen(false)} className="flex-1 px-5 py-2.5 text-[#64766C] border border-[#E3EAE6] font-semibold text-sm leading-snug hover:bg-[#F6F8F5] rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-2 px-6 py-2.5 bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm leading-snug rounded-xl shadow-xs transition-all active:scale-95">Salvar Animal</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOTE (BATCH ENTRY) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-[#E3EAE6] my-8">
            <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Cadastrar Novo Lote de Animais</h3>
                  <p className="text-[13px] font-normal leading-normal text-[#64766C]">Entrada coletiva por lote</p>
               </div>
               <button onClick={() => setIsBatchModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-[#64766C] hover:text-[#20332C] transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-6 space-y-5">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Lote de Destino (Obrigatório) *</label>
                    <select 
                      className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" 
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
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Quantidade Total</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-semibold leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))} />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-medium leading-snug text-[#64766C]">Peso Médio Inicial</label>
                      <div className="flex bg-[#F6F8F5] border border-[#E3EAE6] rounded-lg p-0.5">
                        <button type="button" onClick={() => setBatchWeightType('kg')} className={`px-2 py-0.5 text-xs font-semibold rounded-md ${batchWeightType === 'kg' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}>kg</button>
                        <button type="button" onClick={() => setBatchWeightType('arroba')} className={`px-2 py-0.5 text-xs font-semibold rounded-md ${batchWeightType === 'arroba' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}>@</button>
                      </div>
                    </div>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-semibold leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={batchWeightValue} onChange={e => setBatchWeightValue(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Data de Entrada</label>
                    <input type="date" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
                  </div>
               </div>

               {/* GMD Inicial Esperado do Lote */}
               <div className="p-4 bg-[#DCEDE4]/50 rounded-xl border border-[#145C46]/20 flex items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#145C46] block">GMD Inicial Esperado (kg/dia)</label>
                    <p className="text-xs font-normal text-[#64766C] mt-0.5">Será aplicado no "Peso Previsto" diário de todos os animais do lote</p>
                  </div>
                  <div className="w-32 shrink-0">
                    <input 
                      type="number" 
                      step="0.001" 
                      onFocus={handleFocus}
                      className="w-full border border-[#145C46]/30 rounded-xl px-3 py-2 font-semibold text-sm text-[#145C46] bg-white text-right font-nums focus:ring-2 focus:ring-[#145C46]/20 outline-none" 
                      value={batchInitialGmd} 
                      onChange={e => setBatchInitialGmd(Number(e.target.value))} 
                    />
                  </div>
               </div>

               <div className="bg-[#F6F8F5] p-5 rounded-xl border border-[#E3EAE6] space-y-3.5">
                  <div className="flex justify-between items-center gap-2">
                     <h4 className="text-xs font-semibold text-[#20332C]">Valor de Compra</h4>
                     <div className="flex bg-white rounded-lg p-0.5 border border-[#E3EAE6]">
                        <button type="button" onClick={() => setBatchPriceMode('head')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${batchPriceMode === 'head' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ Cabeça</button>
                        <button type="button" onClick={() => setBatchPriceMode('arroba')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${batchPriceMode === 'arroba' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ Arroba (@)</button>
                     </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-semibold text-base">R$</span>
                    <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl pl-12 pr-4 py-3 font-semibold text-xl text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={batchPriceValue || ''} onChange={e => setBatchPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>

               <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all">Salvar Lote de Animais</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VENDA INDIVIDUAL */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
               <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Liquidar Animal: {currentAnimal.earTag}</h3>
               <button onClick={() => setIsSellModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-[#64766C] hover:text-[#20332C] transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleIndividualSale} className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Data da Venda *</label>
                  <input type="date" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={actionDate} onChange={e => setActionDate(e.target.value)} required />
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Peso Final *</label>
                    <div className="flex bg-[#F6F8F5] border border-[#E3EAE6] rounded-lg p-0.5">
                      <button type="button" onClick={() => setSellWeightType('kg')} className={`px-2 py-0.5 text-xs font-semibold rounded-md ${sellWeightType === 'kg' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}>kg</button>
                      <button type="button" onClick={() => setSellWeightType('arroba')} className={`px-2 py-0.5 text-xs font-semibold rounded-md ${sellWeightType === 'arroba' ? 'bg-white text-[#145C46] shadow-2xs' : 'text-[#64766C]'}`}>@</button>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl px-4 py-2.5 pr-12 font-semibold text-lg text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={sellWeightValue || ''} onChange={e => setSellWeightValue(Number(e.target.value))} required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-xs text-[#64766C]">{sellWeightType === 'kg' ? 'kg' : '@'}</span>
                  </div>
               </div>
               <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center gap-2">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Modo de Venda</label>
                    <div className="flex bg-[#F6F8F5] rounded-lg p-0.5 border border-[#E3EAE6]">
                        <button type="button" onClick={() => setSellPriceMode('head')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sellPriceMode === 'head' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ Cabeça</button>
                        <button type="button" onClick={() => setSellPriceMode('arroba')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sellPriceMode === 'arroba' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ @</button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-semibold text-lg">R$</span>
                    <input type="number" step="0.01" onFocus={handleFocus} required className="w-full border border-[#E3EAE6] rounded-xl pl-12 pr-4 py-3 font-semibold text-2xl text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={sellPriceValue || ''} onChange={e => setSellPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>
               <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÓBITO */}
      {isDeathModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-5 bg-red-50 border-b border-red-100 flex justify-between items-center">
               <h3 className="text-lg font-semibold leading-snug text-red-800">Informar Óbito: {currentAnimal.earTag}</h3>
               <button onClick={() => setIsDeathModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-red-700 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAnimalDeath(currentAnimal.id!, actionDate, deathCause); setIsDeathModalOpen(false); }} className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Data do Ocorrido *</label>
                  <input type="date" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" value={actionDate} onChange={e => setActionDate(e.target.value)} required />
               </div>
               <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Causa Estimada *</label>
                  <input type="text" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" value={deathCause} onChange={e => setDeathCause(e.target.value)} placeholder="Ex: Doença, Acidente, etc." required />
               </div>
               <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center gap-3">
                  <AlertCircle className="text-red-600 shrink-0" size={20} />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">Atenção: Esta ação removerá o animal do rebanho ativo.</p>
               </div>
               <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all">Confirmar Óbito</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venda de Lote */}
      {isLotSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAE6]">
            <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
               <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Venda de Lote</h3>
               <button onClick={() => setIsLotSellModalOpen(false)} className="hover:bg-white p-2 rounded-xl text-[#64766C] hover:text-[#20332C] transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(onSellLot) onSellLot(targetLotId, lotSellDate, lotSellAvgWeight, lotSellPriceMode, lotSellPriceValue); setIsLotSellModalOpen(false); }} className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Data da Venda *</label>
                  <input type="date" className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46]" value={lotSellDate} onChange={e => setLotSellDate(e.target.value)} required />
               </div>
               <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Peso Médio Final (kg) *</label>
                  <div className="relative">
                    <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-xl px-4 py-2.5 pr-12 font-semibold text-lg text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={lotSellAvgWeight} onChange={e => setLotSellAvgWeight(Number(e.target.value))} required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-xs text-[#64766C]">kg</span>
                  </div>
               </div>
               <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center gap-2">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Modo de Venda</label>
                    <div className="flex bg-[#F6F8F5] rounded-lg p-0.5 border border-[#E3EAE6]">
                        <button type="button" onClick={() => setLotSellPriceMode('head')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${lotSellPriceMode === 'head' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ Cabeça</button>
                        <button type="button" onClick={() => setLotSellPriceMode('arroba')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${lotSellPriceMode === 'arroba' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C]'}`}>p/ Arroba (@)</button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-semibold text-lg">R$</span>
                    <input type="number" onFocus={handleFocus} required className="w-full border border-[#E3EAE6] rounded-xl pl-12 pr-4 py-3 font-semibold text-2xl text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] font-nums" value={lotSellPriceValue || ''} onChange={e => setLotSellPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>
               <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl font-semibold text-sm leading-snug shadow-xs transition-all">Confirmar Venda do Lote</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalManager;
