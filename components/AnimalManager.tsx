
import React, { useState, useEffect, useRef } from 'react';
import { Animal, AnimalStatus, AnimalGender, Lot } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, Scale, Eye, History, DollarSign, Skull, MoreVertical, X, Baby, GitFork, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface AnimalManagerProps {
  animals: Animal[];
  lots: Lot[];
  onAddAnimal: (animal: Animal) => void;
  onUpdateAnimal: (animal: Animal) => void;
  onDeleteAnimal: (id: string) => void;
  onSellAnimal: (id: string, date: string, value: number, finalWeight: number) => void;
  onAnimalDeath: (id: string, date: string, cause: string) => void;
  savedDailyCost?: number;
}

// Helper to get local date string YYYY-MM-DD
const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to display date string DD/MM/YYYY without timezone shift
const formatDateDisplay = (dateString: string | undefined) => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

const AnimalManager: React.FC<AnimalManagerProps> = ({ animals, lots, onAddAnimal, onUpdateAnimal, onDeleteAnimal, onSellAnimal, onAnimalDeath, savedDailyCost = 0 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWeighModalOpen, setIsWeighModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  
  // Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('available');
  
  const [priceMode, setPriceMode] = useState<'total' | 'arroba'>('total');
  const [pricePerArroba, setPricePerArroba] = useState<string>('');

  const [saleDate, setSaleDate] = useState(getTodayString());
  const [salePriceMode, setSalePriceMode] = useState<'total' | 'arroba'>('total');
  const [salePrice, setSalePrice] = useState<number | ''>(''); 
  const [salePriceArroba, setSalePriceArroba] = useState<string>(''); 
  const [saleWeight, setSaleWeight] = useState<number>(0); 

  const [deathDate, setDeathDate] = useState(getTodayString());
  const [deathCause, setDeathCause] = useState('');

  const initialFormState: Animal = {
    id: '',
    earTag: '',
    breed: 'Nelore',
    gender: AnimalGender.MALE,
    birthDate: '',
    entryDate: getTodayString(),
    weightKg: 0,
    status: AnimalStatus.ACTIVE,
    notes: '',
    purchaseValue: 0,
    lotId: '',
    history: [],
    motherId: '',
    fatherId: ''
  };
  
  const [currentAnimal, setCurrentAnimal] = useState<Animal>(initialFormState);
  const [newWeight, setNewWeight] = useState<number>(0);
  const [newWeightDate, setNewWeightDate] = useState<string>(getTodayString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const handleDeleteClick = (e: React.MouseEvent, animal: Animal) => {
    e.stopPropagation();
    if (window.confirm(`ATENÇÃO: Deseja realmente EXCLUIR o animal ${animal.earTag}? \n\nIsso removerá permanentemente o animal e todos os seus registros de saúde do sistema.`)) {
      onDeleteAnimal(animal.id);
      setOpenMenuId(null);
    }
  };

  useEffect(() => {
    if (priceMode === 'arroba' && currentAnimal.weightKg > 0 && pricePerArroba) {
      const weight = currentAnimal.weightKg;
      const price = parseFloat(pricePerArroba);
      if (!isNaN(price)) {
        const arrobas = weight / 30;
        const total = arrobas * price;
        setCurrentAnimal(prev => ({ ...prev, purchaseValue: parseFloat(total.toFixed(2)) }));
      }
    }
  }, [pricePerArroba, currentAnimal.weightKg, priceMode]);

  useEffect(() => {
    if (isSellModalOpen && salePriceMode === 'arroba' && saleWeight > 0 && salePriceArroba) {
        const price = parseFloat(salePriceArroba);
        if (!isNaN(price)) {
            const arrobas = saleWeight / 30;
            const total = arrobas * price;
            setSalePrice(parseFloat(total.toFixed(2)));
        }
    }
  }, [salePriceMode, salePriceArroba, saleWeight, isSellModalOpen]);

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = false;
    if (filterStatus === 'all_history') {
        matchesFilter = true;
    } else if (filterStatus === 'available') {
        matchesFilter = animal.status !== AnimalStatus.SOLD && animal.status !== AnimalStatus.DEAD;
    } else {
        matchesFilter = animal.status === filterStatus;
    }
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateAnimal(currentAnimal);
    } else {
      const entryDate = currentAnimal.entryDate || getTodayString();
      const animalWithHistory = {
          ...currentAnimal,
          entryDate: entryDate,
          history: [{ date: entryDate, weightKg: currentAnimal.weightKg, gmd: 0 }]
      };
      onAddAnimal({ ...animalWithHistory, id: Date.now().toString() });
    }
    closeModal();
  };

  const handleWeighSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnimal) return;

    const lastHistory = currentAnimal.history[currentAnimal.history.length - 1];
    let gmd = 0;
    
    if (lastHistory) {
        const d1 = new Date(lastHistory.date);
        const d2 = new Date(newWeightDate);
        d1.setUTCHours(0,0,0,0);
        d2.setUTCHours(0,0,0,0);
        const daysDiff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
        if (daysDiff > 0) {
            gmd = (newWeight - lastHistory.weightKg) / daysDiff;
        }
    }

    const updatedAnimal = {
      ...currentAnimal,
      weightKg: newWeight,
      history: [
        ...currentAnimal.history,
        { date: newWeightDate, weightKg: newWeight, gmd }
      ]
    };
    onUpdateAnimal(updatedAnimal);
    setIsWeighModalOpen(false);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (typeof salePrice === 'number' && saleWeight > 0) {
        onSellAnimal(currentAnimal.id, saleDate, salePrice, saleWeight);
        setIsSellModalOpen(false);
      }
  };

  const handleDeathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deathCause.trim()) {
        onAnimalDeath(currentAnimal.id, deathDate, deathCause);
        setIsDeathModalOpen(false);
    }
  };

  const openModal = (animal?: Animal) => {
    if (animal) {
      setCurrentAnimal(animal);
      setIsEditing(true);
      setPriceMode('total');
      setPricePerArroba('');
    } else {
      setCurrentAnimal({ ...initialFormState, entryDate: getTodayString() });
      setIsEditing(false);
      setPriceMode('total');
      setPricePerArroba('');
    }
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const openRegisterOffspring = (mother: Animal) => {
      setCurrentAnimal({
          ...initialFormState,
          entryDate: getTodayString(),
          birthDate: getTodayString(),
          motherId: mother.id,
          breed: mother.breed
      });
      setIsEditing(false);
      setPriceMode('total');
      setPricePerArroba('');
      setIsModalOpen(true);
      setOpenMenuId(null);
  };

  const openWeighModal = (animal: Animal) => {
    setCurrentAnimal(animal);
    setNewWeight(animal.weightKg);
    setNewWeightDate(getTodayString());
    setIsWeighModalOpen(true);
    setOpenMenuId(null);
  };

  const openDetailsModal = (animal: Animal) => {
      setCurrentAnimal(animal);
      setIsDetailsModalOpen(true);
      setOpenMenuId(null);
  }

  const openSellModal = (animal: Animal) => {
      setCurrentAnimal(animal);
      setSaleDate(getTodayString());
      setSaleWeight(animal.weightKg);
      setSalePriceMode('total');
      setSalePrice('');
      setSalePriceArroba('');
      setIsSellModalOpen(true);
      setOpenMenuId(null);
  }

  const openDeathModal = (animal: Animal) => {
      setCurrentAnimal(animal);
      setDeathDate(getTodayString());
      setDeathCause('');
      setIsDeathModalOpen(true);
      setOpenMenuId(null);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setIsWeighModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsSellModalOpen(false);
    setIsDeathModalOpen(false);
    setCurrentAnimal(initialFormState);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAnimal(prev => ({
      ...prev,
      [name]: (name === 'weightKg' || name === 'purchaseValue') ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const potentialMothers = animals.filter(a => a.gender === AnimalGender.FEMALE && a.id !== currentAnimal.id);
  const potentialFathers = animals.filter(a => a.gender === AnimalGender.MALE && a.id !== currentAnimal.id);

  const calculateProjectedProfit = () => {
      if (!currentAnimal || typeof salePrice !== 'number' || salePrice <= 0) return null;
      
      // Busca diária específica do lote se houver
      const lot = lots.find(l => l.id === currentAnimal.lotId);
      const dailyCost = lot?.dailyCost || savedDailyCost;

      const entryDate = currentAnimal.entryDate ? new Date(currentAnimal.entryDate) : new Date();
      const sDate = new Date(saleDate);
      entryDate.setUTCHours(0,0,0,0);
      sDate.setUTCHours(0,0,0,0);
      const timeDiff = sDate.getTime() - entryDate.getTime();
      const days = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      const prodCost = days * dailyCost;
      const purchase = currentAnimal.purchaseValue || 0;
      const profit = salePrice - purchase - prodCost;
      
      return { days, prodCost, profit, dailyCostUsed: dailyCost };
  };

  const projection = calculateProjectedProfit();

  // Helper to get last GMD
  const getLastGmd = (animal: Animal) => {
    if (animal.history && animal.history.length > 0) {
      const last = animal.history[animal.history.length - 1];
      return last.gmd;
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestão de Rebanho</h2>
          <p className="text-gray-500 text-sm">Controle produtivo e zootécnico individualizado</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95 font-semibold"
        >
          <Plus size={20} /> Cadastrar Animal
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por brinco, raça ou lote..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 hover:bg-white transition-all cursor-pointer font-medium text-gray-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="available">No Pasto (Ativos)</option>
            <option value="all_history">Histórico Completo</option>
            <optgroup label="Filtrar por Status">
                {Object.values(AnimalStatus).map(status => (
                <option key={status} value={status}>{status}</option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Animal</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lote / Raça</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Peso Atual</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">GMD (Desempenho)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAnimals.length > 0 ? (
                filteredAnimals.map((animal) => {
                    const lotName = lots.find(l => l.id === animal.lotId)?.name || 'Sem Lote';
                    const isActive = animal.status !== AnimalStatus.SOLD && animal.status !== AnimalStatus.DEAD;
                    const isFemale = animal.gender === AnimalGender.FEMALE;
                    const gmd = getLastGmd(animal);
                    
                    return (
                  <tr key={animal.id} className="hover:bg-green-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">{animal.earTag}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{animal.gender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-700">{lotName}</span>
                        <span className="text-xs text-gray-400">{animal.breed}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-gray-800">{animal.weightKg}</span>
                          <span className="text-xs font-medium text-gray-500">kg</span>
                        </div>
                        <span className="text-xs text-green-600 font-semibold">{(animal.weightKg/30).toFixed(1)} @</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {gmd !== undefined ? (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${gmd > 0.8 ? 'bg-green-100 text-green-700' : gmd > 0.4 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {gmd > 0 ? <TrendingUp size={14} /> : gmd < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                          <span className="font-bold text-sm">{gmd.toFixed(3)} <span className="text-[10px] font-medium opacity-80">kg/dia</span></span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Sem dados</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm
                        ${animal.status === AnimalStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200' : 
                          animal.status === AnimalStatus.SICK ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 
                          animal.status === AnimalStatus.SOLD ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          animal.status === AnimalStatus.DEAD ? 'bg-gray-900 text-white border-black' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {animal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 relative">
                        <button 
                            onClick={() => openDetailsModal(animal)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Ver Detalhes"
                        >
                            <Eye size={20} />
                        </button>
                        
                        <button 
                            onClick={() => openWeighModal(animal)}
                            className={`p-2 rounded-xl transition-all ${isActive ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-200 cursor-not-allowed'}`}
                            title="Nova Pesagem"
                            disabled={!isActive}
                        >
                            <Scale size={20} />
                        </button>

                        <button 
                            onClick={(e) => toggleMenu(e, animal.id)}
                            className={`p-2 rounded-xl transition-all ${openMenuId === animal.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {openMenuId === animal.id && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 text-left overflow-hidden animate-in fade-in slide-in-from-top-1">
                                <div className="py-2">
                                    <button 
                                        onClick={() => openModal(animal)}
                                        className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Edit2 size={16} className="text-blue-500" /> 
                                        <span className="font-medium">Editar Cadastro</span>
                                    </button>
                                    
                                    {isActive && (
                                        <>
                                            {isFemale && (
                                              <button 
                                                  onClick={() => openRegisterOffspring(animal)}
                                                  className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                              >
                                                  <Baby size={16} className="text-blue-600" /> 
                                                  <span className="font-medium">Registrar Cria</span>
                                              </button>
                                            )}
                                            <button 
                                                onClick={() => openSellModal(animal)}
                                                className="w-full px-4 py-3 text-sm text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                                            >
                                                <DollarSign size={16} className="text-green-600" /> 
                                                <span className="font-medium">Vender Animal</span>
                                            </button>
                                            <button 
                                                onClick={() => openDeathModal(animal)}
                                                className="w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                            >
                                                <Skull size={16} className="text-red-500" /> 
                                                <span className="font-medium">Registrar Óbito</span>
                                            </button>
                                        </>
                                    )}

                                    <div className="border-t border-gray-50 my-1"></div>
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, animal)}
                                        className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-600" /> 
                                        <span className="font-bold">Excluir Animal</span>
                                    </button>
                                </div>
                            </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Search size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">Nenhum animal cadastrado</p>
                      <p className="text-sm">Inicie seu rebanho clicando no botão acima.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col scale-in">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Registro' : 'Novo Cadastro'}</h3>
                <p className="text-xs text-gray-500 mt-1">{isEditing ? 'Atualize os dados técnicos do animal' : 'Preencha as informações iniciais do animal'}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Brinco (ID)</label>
                  <input type="text" name="earTag" required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all" value={currentAnimal.earTag} onChange={handleInputChange} placeholder="Ex: NEL-123" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data Entrada/Nasc.</label>
                  <input type="date" name="entryDate" required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all" value={currentAnimal.entryDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Raça</label>
                  <select name="breed" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all cursor-pointer" value={currentAnimal.breed} onChange={handleInputChange}>
                    <option value="Nelore">Nelore</option>
                    <option value="Angus">Angus</option>
                    <option value="Brahman">Brahman</option>
                    <option value="Holandês">Holandês</option>
                    <option value="Girolando">Girolando</option>
                    <option value="Senepol">Senepol</option>
                    <option value="Cruzado">Cruzado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Peso Inicial (kg)</label>
                  <input type="number" onFocus={handleFocus} name="weightKg" required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all" value={currentAnimal.weightKg || ''} onChange={handleInputChange} disabled={isEditing} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Gênero</label>
                  <select name="gender" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all cursor-pointer" value={currentAnimal.gender} onChange={handleInputChange}>
                    {Object.values(AnimalGender).map(g => ( <option key={g} value={g}>{g}</option> ))}
                  </select>
                </div>
                <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lote de Manejo</label>
                    <select name="lotId" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all cursor-pointer" value={currentAnimal.lotId || ''} onChange={handleInputChange}>
                        <option value="">Nenhum (Pasto Geral)</option>
                        {lots.map(lot => ( <option key={lot.id} value={lot.id}>{lot.name}</option> ))}
                    </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2"><GitFork size={14}/> Genealogia (Opcional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mãe (Matriz)</label>
                          <select name="motherId" className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 bg-white" value={currentAnimal.motherId || ''} onChange={handleInputChange}>
                              <option value="">Origem Externa</option>
                              {potentialMothers.map(m => (
                                  <option key={m.id} value={m.id}>{m.earTag} ({m.breed})</option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Pai (Reprodutor)</label>
                          <select name="fatherId" className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 bg-white" value={currentAnimal.fatherId || ''} onChange={handleInputChange}>
                              <option value="">Origem Externa</option>
                              {potentialFathers.map(f => (
                                  <option key={f.id} value={f.id}>{f.earTag} ({f.breed})</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>

              <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-green-800 uppercase tracking-widest">Investimento / Aquisição</label>
                    {!isEditing && (
                        <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-green-100">
                            <button 
                                type="button" 
                                onClick={() => setPriceMode('total')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${priceMode === 'total' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-green-700'}`}
                            >VALOR TOTAL</button>
                            <button 
                                type="button" 
                                onClick={() => setPriceMode('arroba')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${priceMode === 'arroba' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-green-700'}`}
                            >VALOR P/ @</button>
                        </div>
                    )}
                </div>
                
                {priceMode === 'total' || isEditing ? (
                    <div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                          <input type="number" onFocus={handleFocus} name="purchaseValue" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-white" value={currentAnimal.purchaseValue || ''} onChange={handleInputChange} disabled={isEditing} placeholder="0,00" />
                        </div>
                        {!isEditing && <p className="text-[10px] text-gray-400 mt-2 font-medium px-1">Gera lançamento financeiro automático. Use 0 para nascimentos na fazenda.</p>}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                            <input 
                                type="number" 
                                onFocus={handleFocus}
                                placeholder="0,00" 
                                className="w-full border border-gray-200 rounded-xl pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold" 
                                value={pricePerArroba} 
                                onChange={(e) => setPricePerArroba(e.target.value)} 
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">/ @</div>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Custo Calculado:</span>
                            <span className="font-bold text-green-700">R$ {currentAnimal.purchaseValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                        </div>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Estado de Saúde</label>
                  <select name="status" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all cursor-pointer" value={currentAnimal.status} onChange={handleInputChange}>
                    {Object.values(AnimalStatus).map(s => ( <option key={s} value={s}>{s}</option> ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Observações</label>
                  <textarea name="notes" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all min-h-[48px]" rows={1} value={currentAnimal.notes} onChange={handleInputChange} placeholder="Ex: Vacinação em dia, pedigree..."></textarea>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="px-10 py-3 text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-xl shadow-green-100 font-bold transition-all hover:scale-[1.02] active:scale-95 uppercase text-xs tracking-widest">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weighing Modal */}
      {isWeighModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-in">
                <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Coleta de Peso</h3>
                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Animal: {currentAnimal.earTag}</p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                         <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleWeighSubmit} className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data da Pesagem</label>
                        <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white" value={newWeightDate} onChange={e => setNewWeightDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Novo Peso (kg)</label>
                        <div className="relative">
                          <input type="number" onFocus={handleFocus} step="0.1" required className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white text-3xl font-bold text-center" value={newWeight || ''} onChange={e => setNewWeight(e.target.value === '' ? 0 : Number(e.target.value))} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">kg</span>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 transition-all active:scale-95 uppercase text-sm tracking-widest">
                      Atualizar Rebanho
                    </button>
                </form>
            </div>
          </div>
      )}

      {/* Sell Modal */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-in">
                <div className="px-8 py-6 border-b border-gray-100 bg-green-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-green-900">Efetivar Venda</h3>
                        <p className="text-xs text-green-700 font-bold uppercase tracking-wider">{currentAnimal.earTag} ({currentAnimal.breed})</p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSellSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data</label>
                          <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Peso Saída (kg)</label>
                           <input type="number" onFocus={handleFocus} step="0.1" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50" 
                                  value={saleWeight || ''} onChange={e => setSaleWeight(e.target.value === '' ? 0 : Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                         <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Valor de Venda</label>
                            <div className="flex bg-white rounded-lg p-0.5 border border-gray-100 shadow-sm">
                                <button 
                                    type="button" 
                                    onClick={() => setSalePriceMode('total')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${salePriceMode === 'total' ? 'bg-green-600 text-white shadow' : 'text-gray-400'}`}
                                >BRUTO</button>
                                <button 
                                    type="button" 
                                    onClick={() => setSalePriceMode('arroba')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${salePriceMode === 'arroba' ? 'bg-green-600 text-white shadow' : 'text-gray-400'}`}
                                >P/ @</button>
                            </div>
                        </div>

                        {salePriceMode === 'total' ? (
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold text-xl" 
                                value={salePrice || ''} onChange={(e) => setSalePrice(e.target.value === '' ? 0 : Number(e.target.value))} required />
                             </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        onFocus={handleFocus}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold" 
                                        value={salePriceArroba} 
                                        onChange={(e) => setSalePriceArroba(e.target.value)} 
                                        placeholder="Preço da Arroba"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">/ @</div>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total ({(saleWeight/30).toFixed(1)} @):</span>
                                    <span className="font-bold text-green-700">R$ {(typeof salePrice === 'number' ? salePrice : 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {projection && (
                        <div className={`p-5 rounded-2xl border ${projection.profit >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'} text-xs space-y-2`}>
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Ciclo de engorda:</span>
                                <span className="font-bold text-gray-700">{projection.days} dias</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Custo Operacional (R$ {projection.dailyCostUsed.toFixed(2)}/dia):</span>
                                <span className="text-red-500 font-bold">- R$ {projection.prodCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Investimento Inicial:</span>
                                <span className="text-red-500 font-bold">- R$ {(currentAnimal.purchaseValue || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">Lucro Líquido Final:</span>
                                <span className={`text-xl font-black ${projection.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    R$ {projection.profit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </span>
                             </div>
                             <p className="text-[9px] text-gray-400 mt-2 text-center italic">Calculado com base na diária do Lote: {lots.find(l => l.id === currentAnimal.lotId)?.name || 'Geral'}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest">
                            <DollarSign size={20} /> Confirmar Recebimento
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Death Modal */}
      {isDeathModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-in">
                <div className="px-8 py-6 border-b border-gray-100 bg-red-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-red-900">Registrar Baixa (Óbito)</h3>
                        <p className="text-xs text-red-700 font-bold uppercase tracking-wider">{currentAnimal.earTag} ({currentAnimal.breed})</p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleDeathSubmit} className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data da Ocorrência</label>
                        <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" value={deathDate} onChange={e => setDeathDate(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Causa Provável</label>
                        <input type="text" placeholder="Ex: Doença, Acidente, Picada..." className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" 
                               value={deathCause} onChange={e => setDeathCause(e.target.value)} required />
                    </div>

                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest">
                        <Skull size={20} /> Confirmar Baixa
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col scale-in">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Ficha Técnica: {currentAnimal.earTag}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${currentAnimal.status === AnimalStatus.ACTIVE ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>{currentAnimal.status}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{currentAnimal.breed} • {currentAnimal.gender}</p>
                        {currentAnimal.entryDate && <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Entrada na fazenda: {formatDateDisplay(currentAnimal.entryDate)}</p>}
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                         <X size={24} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Top Stats in Details */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Peso Atual</p>
                        <p className="text-xl font-black text-gray-800">{currentAnimal.weightKg} kg</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">GMD Última</p>
                        <p className="text-xl font-black text-green-600">{getLastGmd(currentAnimal)?.toFixed(3) || '0.000'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lote</p>
                        <p className="text-xl font-black text-blue-600 truncate px-1">{lots.find(l => l.id === currentAnimal.lotId)?.name || '-'}</p>
                      </div>
                    </div>

                    {/* Alerts if Dead/Sold */}
                    {currentAnimal.status === AnimalStatus.DEAD && (
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <p className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
                                <Skull size={16}/> OCORRÊNCIA DE ÓBITO
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-red-400 font-bold uppercase">Data:</span>
                                <p className="text-red-800 font-semibold">{formatDateDisplay(currentAnimal.deathDate)}</p>
                              </div>
                              <div>
                                <span className="text-red-400 font-bold uppercase">Causa relatada:</span>
                                <p className="text-red-800 font-semibold">{currentAnimal.deathCause}</p>
                              </div>
                            </div>
                        </div>
                    )}

                    {/* Genealogy Section */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-xs"><GitFork size={18} className="text-blue-600"/> Árvore Genealógica</h4>
                        <div className="grid grid-cols-2 gap-6 text-sm mb-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Matriz (Mãe)</span>
                                {(() => {
                                    const mom = animals.find(a => a.id === currentAnimal.motherId);
                                    return mom ? (
                                        <p className="font-bold text-gray-800">{mom.earTag} <span className="text-[10px] text-gray-400 font-normal">({mom.breed})</span></p>
                                    ) : <p className="text-gray-400 italic text-xs">Não cadastrada</p>
                                })()}
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Reprodutor (Pai)</span>
                                {(() => {
                                    const dad = animals.find(a => a.id === currentAnimal.fatherId);
                                    return dad ? (
                                        <p className="font-bold text-gray-800">{dad.earTag} <span className="text-[10px] text-gray-400 font-normal">({dad.breed})</span></p>
                                    ) : <p className="text-gray-400 italic text-xs">Não cadastrado</p>
                                })()}
                            </div>
                        </div>
                        {/* Offspring List */}
                        {(() => {
                            const offspring = animals.filter(a => a.motherId === currentAnimal.id || a.fatherId === currentAnimal.id);
                            if (offspring.length > 0) {
                                return (
                                    <div className="mt-4 pt-4 border-t border-blue-100">
                                        <p className="text-[10px] font-bold text-blue-800 mb-3 uppercase tracking-widest">Descendência Direta ({offspring.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {offspring.map(child => (
                                                <span key={child.id} className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                                                    <Baby size={12} className="text-pink-500" /> {child.earTag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }
                            return null;
                        })()}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-widest text-xs"><History size={18} className="text-green-600"/> Histórico de Evolução Ponderal</h4>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">ORDEM CRONOLÓGICA REVERSA</span>
                      </div>
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100/50">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Data Pesagem</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Peso (kg)</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">GMD (Var.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentAnimal.history?.slice().reverse().map((h, i) => (
                                    <tr key={i} className="hover:bg-white transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-600">{formatDateDisplay(h.date)}</td>
                                        <td className="px-6 py-4 font-black text-gray-800">{h.weightKg} kg</td>
                                        <td className="px-6 py-4">
                                          {h.gmd ? (
                                            <div className={`flex items-center gap-1 font-bold ${h.gmd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              {h.gmd > 0 ? '+' : ''}{h.gmd.toFixed(3)}
                                            </div>
                                          ) : <span className="text-gray-300">-</span>}
                                        </td>
                                    </tr>
                                ))}
                                {(!currentAnimal.history || currentAnimal.history.length === 0) && <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">Nenhum histórico registrado</td></tr>}
                            </tbody>
                        </table>
                      </div>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default AnimalManager;
