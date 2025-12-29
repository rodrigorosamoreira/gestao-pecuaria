
import React, { useState, useEffect } from 'react';
import { Animal, AnimalStatus, AnimalGender, Lot, HealthSeverity } from '../types';
import { 
  Plus, Search, Filter, Edit2, Trash2, Scale, Eye, 
  DollarSign, Skull, MoreVertical, X, Truck, 
  ChevronDown, ChevronRight, Folder, FolderOpen, 
  TrendingUp, Calculator, Calendar, Info, Beaker
} from 'lucide-react';

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
  savedDailyCost?: number;
}

const getTodayString = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

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
  savedDailyCost = 0 
}) => {
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isModalIndividualOpen, setIsModalIndividualOpen] = useState(false);
  const [isLotSellModalOpen, setIsLotSellModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('available');
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({'all': true});

  // Estados Form Individual (Restaurado conforme imagem)
  const [currentAnimal, setCurrentAnimal] = useState<Partial<Animal>>({});
  const [indPriceMode, setIndPriceMode] = useState<'total' | 'arroba'>('total');
  const [indWeightValue, setIndWeightValue] = useState<number>(0);

  // Estados Cadastro de Carga
  const [batchQty, setBatchQty] = useState<number>(10);
  const [batchBaseTag, setBatchBaseTag] = useState<string>('CRG-');
  const [batchWeightType, setBatchWeightType] = useState<'kg' | 'arroba'>('kg');
  const [batchWeightValue, setBatchWeightValue] = useState<number>(330);
  const [batchPriceMode, setBatchPriceMode] = useState<'head' | 'arroba'>('head');
  const [batchPriceValue, setBatchPriceValue] = useState<number>(0);
  const [batchLotId, setBatchLotId] = useState<string>('');
  const [batchBreed, setBatchBreed] = useState<string>('Nelore');
  const [batchDate, setBatchDate] = useState(getTodayString());

  // Estados Venda de Lote (Carga)
  const [targetLotId, setTargetLotId] = useState<string>('');
  const [lotSellDate, setLotSellDate] = useState(getTodayString());
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

  const groupedAnimals = filteredAnimals.reduce((acc, animal) => {
    const lotId = animal.lotId || 'sem_lote';
    if (!acc[lotId]) acc[lotId] = [];
    acc[lotId].push(animal);
    return acc;
  }, {} as Record<string, Animal[]>);

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchQty <= 0) return;

    const avgWeightKg = batchWeightType === 'kg' ? batchWeightValue : batchWeightValue * 30;
    const unitPrice = batchPriceMode === 'head' ? batchPriceValue : (avgWeightKg / 30) * batchPriceValue;
    const totalCost = unitPrice * batchQty;

    const newAnimals: Animal[] = Array.from({ length: batchQty }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      earTag: `${batchBaseTag}${String(i + 1).padStart(3, '0')}`,
      breed: batchBreed,
      gender: AnimalGender.MALE,
      birthDate: '',
      entryDate: batchDate,
      weightKg: avgWeightKg,
      status: AnimalStatus.ACTIVE,
      purchaseValue: unitPrice,
      lotId: batchLotId,
      history: [{ date: batchDate, weightKg: avgWeightKg, gmd: 0 }]
    }));

    if (onAddBatch) onAddBatch(newAnimals, totalCost);
    setIsBatchModalOpen(false);
  };

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWeight = indWeightValue;
    const finalPurchaseValue = indPriceMode === 'total' 
      ? (currentAnimal.purchaseValue || 0) 
      : ((finalWeight / 30) * (currentAnimal.purchaseValue || 0));

    const animal: Animal = {
      ...(currentAnimal as Animal),
      id: currentAnimal.id || Date.now().toString(),
      weightKg: finalWeight,
      purchaseValue: finalPurchaseValue,
      history: currentAnimal.id ? (currentAnimal.history || []) : [{ date: currentAnimal.entryDate || getTodayString(), weightKg: finalWeight, gmd: 0 }]
    };

    if (currentAnimal.id) onUpdateAnimal(animal);
    else onAddAnimal(animal);
    setIsModalIndividualOpen(false);
  };

  const calculateLotPreview = () => {
    const animalsInLot = animals.filter(a => a.lotId === targetLotId && a.status === AnimalStatus.ACTIVE);
    const count = animalsInLot.length;
    if (lotSellPriceMode === 'head') return count * lotSellPriceValue;
    return count * (lotSellAvgWeight / 30) * lotSellPriceValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Gestão de Rebanho</h2>
          <p className="text-gray-500 text-sm italic">Organize seus animais em lotes e acompanhe o desempenho</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-100 transition-all font-black text-xs uppercase tracking-widest"
          >
            <Truck size={18} /> Cadastrar Carga
          </button>
          <button 
            onClick={() => { 
              setCurrentAnimal({ 
                entryDate: getTodayString(), 
                breed: 'Nelore', 
                gender: AnimalGender.MALE, 
                status: AnimalStatus.ACTIVE,
                purchaseValue: 0,
                notes: ''
              }); 
              setIndWeightValue(0);
              setIsModalIndividualOpen(true); 
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-100 transition-all font-black text-xs uppercase tracking-widest"
          >
            <Plus size={18} /> Cadastrar Animal
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por brinco, raça ou lote..." 
            className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            className="border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 font-bold text-gray-700 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="available">No Pasto (Ativos)</option>
            <option value="all_history">Histórico Completo</option>
            {Object.values(AnimalStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {(Object.entries(groupedAnimals) as [string, Animal[]][]).map(([lotId, animalsInLot]) => {
          const lot = lots.find(l => l.id === lotId);
          const lotName = lot?.name || (lotId === 'sem_lote' ? 'Nenhum (Pasto Geral)' : 'Lote Desconhecido');
          const isOpen = expandedLots[lotId] ?? false;
          const lotHeadcount = animalsInLot.length;
          const avgWeightKg = animalsInLot.reduce((acc, a) => acc + a.weightKg, 0) / (lotHeadcount || 1);

          return (
            <div key={lotId} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div 
                onClick={() => toggleLot(lotId)}
                className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOpen ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isOpen ? <FolderOpen size={24} /> : <Folder size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">{lotName}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      <span>{lotHeadcount} Animais</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>Média: {(avgWeightKg/30).toFixed(1)} @</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {lotId !== 'sem_lote' && lotHeadcount > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTargetLotId(lotId); setIsLotSellModalOpen(true); }}
                      className="bg-white border border-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      Vender Carga
                    </button>
                  )}
                  {isOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                </div>
              </div>

              {isOpen && (
                <div className="overflow-x-auto border-t border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificação</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Raça / Sexo</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Peso Atual</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {animalsInLot.map(animal => (
                        <tr key={animal.id} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="px-8 py-4">
                            <span className="text-base font-black text-gray-800 tracking-tight">{animal.earTag}</span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700">{animal.breed}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{animal.gender}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black text-emerald-700">{(animal.weightKg / 30).toFixed(1)}</span>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">@</span>
                              <span className="ml-2 text-[10px] text-gray-400 font-medium">({animal.weightKg}kg)</span>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              animal.status === AnimalStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              animal.status === AnimalStatus.SOLD ? 'bg-gray-100 text-gray-600 border-gray-200' :
                              'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {animal.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => { setCurrentAnimal(animal); setIndWeightValue(animal.weightKg); setIsModalIndividualOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                                <button onClick={() => { if(confirm('Excluir animal?')) onDeleteAnimal(animal.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL INDIVIDUAL - RESTAURADO CONFORME IMAGEM */}
      {isModalIndividualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden scale-in max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Novo Cadastro</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase">Preencha as informações iniciais do animal</p>
               </div>
               <button onClick={() => setIsModalIndividualOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleIndividualSubmit} className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brinco (ID)</label>
                    <input type="text" className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500" value={currentAnimal.earTag || ''} onChange={e => setCurrentAnimal({...currentAnimal, earTag: e.target.value})} placeholder="Ex: NEL-123" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Entrada/Nasc.</label>
                    <input type="date" className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50" value={currentAnimal.entryDate || ''} onChange={e => setCurrentAnimal({...currentAnimal, entryDate: e.target.value})} required />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Raça</label>
                    <select className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50 cursor-pointer" value={currentAnimal.breed || ''} onChange={e => setCurrentAnimal({...currentAnimal, breed: e.target.value})}>
                       <option value="Nelore">Nelore</option>
                       <option value="Angus">Angus</option>
                       <option value="Cruzado">Cruzado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Peso Inicial (kg)</label>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50" value={indWeightValue || ''} onChange={e => setIndWeightValue(Number(e.target.value))} required />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gênero</label>
                    <select className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50 cursor-pointer" value={currentAnimal.gender || ''} onChange={e => setCurrentAnimal({...currentAnimal, gender: e.target.value as AnimalGender})}>
                       <option value={AnimalGender.MALE}>Macho</option>
                       <option value={AnimalGender.FEMALE}>Fêmea</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lote de Manejo</label>
                    <select className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50 cursor-pointer" value={currentAnimal.lotId || ''} onChange={e => setCurrentAnimal({...currentAnimal, lotId: e.target.value})}>
                       <option value="">Nenhum (Pasto Geral)</option>
                       {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
               </div>

               {/* GENEALOGIA */}
               <div className="border-2 border-blue-50 bg-blue-50/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Beaker size={16} className="text-blue-600" />
                     <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Genealogia (Opcional)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Mãe (Matriz)</label>
                        <select className="w-full border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold bg-white" value={currentAnimal.motherId || ''} onChange={e => setCurrentAnimal({...currentAnimal, motherId: e.target.value})}>
                           <option value="">Origem Externa</option>
                           {animals.filter(a => a.gender === AnimalGender.FEMALE && a.id !== currentAnimal.id).map(a => <option key={a.id} value={a.id}>{a.earTag}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pai (Reprodutor)</label>
                        <select className="w-full border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold bg-white" value={currentAnimal.fatherId || ''} onChange={e => setCurrentAnimal({...currentAnimal, fatherId: e.target.value})}>
                           <option value="">Origem Externa</option>
                           {animals.filter(a => a.gender === AnimalGender.MALE && a.id !== currentAnimal.id).map(a => <option key={a.id} value={a.id}>{a.earTag}</option>)}
                        </select>
                     </div>
                  </div>
               </div>

               {/* INVESTIMENTO */}
               <div className="border-2 border-emerald-50 bg-emerald-50/10 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Investimento / Aquisição</h4>
                     <div className="flex bg-white rounded-lg p-0.5 border border-emerald-100 shadow-sm">
                        <button type="button" onClick={() => setIndPriceMode('total')} className={`px-3 py-1 text-[9px] font-black rounded ${indPriceMode === 'total' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>VALOR TOTAL</button>
                        <button type="button" onClick={() => setIndPriceMode('arroba')} className={`px-3 py-1 text-[9px] font-black rounded ${indPriceMode === 'arroba' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>VALOR P/ @</button>
                     </div>
                  </div>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">R$</span>
                     <input type="number" onFocus={handleFocus} className="w-full border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-black text-2xl text-emerald-900 bg-white" value={currentAnimal.purchaseValue || ''} onChange={e => setCurrentAnimal({...currentAnimal, purchaseValue: Number(e.target.value)})} placeholder="0,00" />
                     <p className="mt-2 text-[10px] text-gray-400 font-medium italic text-center">Gera lançamento financeiro automático. Use 0 para nascimentos na fazenda.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Saúde</label>
                    <select className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold bg-gray-50" value={currentAnimal.status || ''} onChange={e => setCurrentAnimal({...currentAnimal, status: e.target.value as AnimalStatus})}>
                       {Object.values(AnimalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações</label>
                    <textarea rows={2} className="w-full border border-gray-100 rounded-xl px-4 py-3 font-medium bg-gray-50 focus:bg-white outline-none" value={currentAnimal.notes || ''} onChange={e => setCurrentAnimal({...currentAnimal, notes: e.target.value})} placeholder="Ex: Vacinação em dia, pedigree..." />
                  </div>
               </div>

               <div className="flex gap-4 pt-4 shrink-0">
                  <button type="button" onClick={() => setIsModalIndividualOpen(false)} className="flex-1 px-8 py-4 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95">Salvar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGA - MANTIDO */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border-4 border-blue-50">
            <div className="px-8 py-6 bg-blue-600 text-white flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Cadastrar Nova Carga</h3>
                  <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Entrada de lote fechado</p>
               </div>
               <button onClick={() => setIsBatchModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Prefixo Brincos</label>
                    <input type="text" className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={batchBaseTag} onChange={e => setBatchBaseTag(e.target.value)} placeholder="Ex: CARGA-" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Quantidade</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-black text-blue-600 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Peso Médio</label>
                      <div className="flex bg-gray-200 rounded-lg p-1">
                        <button type="button" onClick={() => setBatchWeightType('kg')} className={`px-2 py-0.5 text-[8px] font-black rounded ${batchWeightType === 'kg' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>KG</button>
                        <button type="button" onClick={() => setBatchWeightType('arroba')} className={`px-2 py-0.5 text-[8px] font-black rounded ${batchWeightType === 'arroba' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>@</button>
                      </div>
                    </div>
                    <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={batchWeightValue} onChange={e => setBatchWeightValue(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data Entrada</label>
                    <input type="date" className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
                  </div>
               </div>

               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                  <div className="flex justify-between items-center">
                     <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Valor de Compra</h4>
                     <div className="flex bg-white rounded-lg p-1 border border-blue-100 shadow-inner">
                        <button type="button" onClick={() => setBatchPriceMode('head')} className={`px-3 py-1 text-[9px] font-black rounded ${batchPriceMode === 'head' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>P/ CABEÇA</button>
                        <button type="button" onClick={() => setBatchPriceMode('arroba')} className={`px-3 py-1 text-[9px] font-black rounded ${batchPriceMode === 'arroba' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>P/ ARROBA (@)</button>
                     </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 font-black text-xl">R$</span>
                    <input type="number" onFocus={handleFocus} className="w-full border border-blue-100 rounded-[1.5rem] pl-16 pr-6 py-4 font-black text-2xl text-blue-900 bg-white" value={batchPriceValue || ''} onChange={e => setBatchPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
                  <div className="flex justify-between items-center px-4">
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Investimento Total:</p>
                     <p className="text-xl font-black text-blue-900 tracking-tighter">
                        R$ {(batchQty * (batchPriceMode === 'head' ? batchPriceValue : (batchWeightType === 'kg' ? batchWeightValue : batchWeightValue * 30) / 30 * batchPriceValue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lote de Destino</label>
                    <select className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none" value={batchLotId} onChange={e => setBatchLotId(e.target.value)} required>
                       <option value="">Selecione um lote...</option>
                       {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Raça</label>
                    <select className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50" value={batchBreed} onChange={e => setBatchBreed(e.target.value)}>
                       <option value="Nelore">Nelore</option>
                       <option value="Angus">Angus</option>
                       <option value="Cruzado">Cruzado</option>
                    </select>
                  </div>
               </div>

               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-95">Salvar Carga no Sistema</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venda de Lote - MANTIDO */}
      {isLotSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-emerald-50">
            <div className="px-8 py-6 bg-emerald-700 text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight">Liquidação de Lote</h3>
               <button onClick={() => setIsLotSellModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if(onSellLot) onSellLot(targetLotId, lotSellDate, lotSellAvgWeight, lotSellPriceMode, lotSellPriceValue); 
              setIsLotSellModalOpen(false); 
            }} className="p-10 space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data da Venda</label>
                  <input type="date" className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" value={lotSellDate} onChange={e => setLotSellDate(e.target.value)} required />
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Peso Médio Final (kg)</label>
                  <div className="relative">
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-100 rounded-2xl px-5 py-3 font-black text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500" value={lotSellAvgWeight} onChange={e => setLotSellAvgWeight(Number(e.target.value))} required />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xs text-gray-400 uppercase">KG</span>
                  </div>
               </div>

               <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Modo de Venda</label>
                    <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
                        <button type="button" onClick={() => setLotSellPriceMode('head')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${lotSellPriceMode === 'head' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400'}`}>P/ CABEÇA</button>
                        <button type="button" onClick={() => setLotSellPriceMode('arroba')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${lotSellPriceMode === 'arroba' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400'}`}>P/ ARROBA (@)</button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-2xl">R$</span>
                    <input type="number" onFocus={handleFocus} required className="w-full border border-gray-100 rounded-[2rem] pl-16 pr-6 py-4 font-black text-3xl text-emerald-900 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none" value={lotSellPriceValue || ''} onChange={e => setLotSellPriceValue(Number(e.target.value))} placeholder="0,00" />
                  </div>
               </div>

               <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Receita Bruta Estimada</span>
                    <span className="text-2xl font-black text-emerald-900 tracking-tighter">R$ {calculateLotPreview().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest text-center leading-relaxed">
                    O lucro líquido será registrado subtraindo o custo de compra e a estadia (diárias) de cada animal.
                  </p>
               </div>
               
               <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 transition-all active:scale-95">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalManager;
