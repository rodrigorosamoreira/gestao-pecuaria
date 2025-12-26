
import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Scale, 
  Save, 
  CheckCircle,
  AlertCircle,
  Target,
  Coins,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  Weight,
  Layers as LayersIcon,
  DollarSign,
  ArrowDownToLine,
  Info,
  ChevronRight,
  Zap,
  Activity
} from 'lucide-react';
import { Lot, AnimalStatus } from '../types';

interface ToolsCalculatorProps {
    onSaveDailyCost?: (cost: number, lotId?: string) => void;
    lots?: Lot[];
    initialTab?: 'prediction' | 'diet' | 'daily_value';
}

interface Ingredient {
    id: string;
    name: string;
    percent: number;
    priceKg: number;
}

const ToolsCalculator: React.FC<ToolsCalculatorProps> = ({ onSaveDailyCost, lots = [], initialTab = 'prediction' }) => {
  const [activeTab, setActiveTab] = useState<'prediction' | 'diet' | 'daily_value'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // --- Estados do Simulador Preditivo ---
  const [predQty, setPredQty] = useState<number>(50);
  const [predEntryWeight, setPredEntryWeight] = useState<number>(330);
  const [predBuyPrice, setPredBuyPrice] = useState<number>(250); 
  const [predTargetMode, setPredTargetMode] = useState<'final_weight' | 'gmd' | 'days'>('final_weight');
  const [predExitWeight, setPredExitWeight] = useState<number>(537);
  const [predCarcassYield, setPredCarcassYield] = useState<number>(52);
  const [predSellPrice, setPredSellPrice] = useState<number>(240);
  const [predSuppCostDaily, setPredSuppCostDaily] = useState<number>(6.732);
  const [predOpCostDaily, setPredOpCostDaily] = useState<number>(1.80);
  const [predGmd, setPredGmd] = useState<number>(1.15);
  const [predDays, setPredDays] = useState<number>(180);

  // --- Estados do Valor Diário ---
  const [rentCost, setRentCost] = useState<number>(3000);
  const [suppCostMonthly, setSuppCostMonthly] = useState<number>(2000); 
  const [extraCostMonthly, setExtraCostMonthly] = useState<number>(500);
  const [totalAnimalsDaily, setTotalAnimalsDaily] = useState<number>(50);
  const [gmdDailyVal, setGmdDailyVal] = useState<number>(0.8);
  const [targetLotId, setTargetLotId] = useState<string>(''); 
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // --- Estados da Suplementação ---
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Farelo de Milho', percent: 65, priceKg: 1.00 },
    { id: '2', name: 'Farelo de Soja', percent: 21, priceKg: 3.00 },
    { id: '3', name: 'Núcleo', percent: 11, priceKg: 5.00 },
    { id: '4', name: 'Ureia', percent: 3, priceKg: 7.00 },
  ]);
  const [avgLotWeight, setAvgLotWeight] = useState<number>(330);
  const [numAnimals, setNumAnimals] = useState<number>(50);
  const [pvPercent, setPvPercent] = useState<number>(0.1); 

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select();

  // --- Cálculos Suplementação ---
  const totalPercent = ingredients.reduce((acc, i) => acc + i.percent, 0);
  const costPerKgSupplement = ingredients.reduce((acc, i) => acc + (i.percent / 100) * i.priceKg, 0);
  const consumptionPerAnimalKg = (avgLotWeight * (pvPercent / 100));
  const totalBatchConsumption = consumptionPerAnimalKg * numAnimals;
  const totalDailyCostSupp = totalBatchConsumption * costPerKgSupplement;
  const totalMonthlyCostSupp = totalDailyCostSupp * 30;
  const totalMonthlyConsumptionKg = totalBatchConsumption * 30;

  // --- Cálculos Valor Diário ---
  const totalMonthlyFinance = rentCost + suppCostMonthly + extraCostMonthly;
  const monthlyCostPerAnimal = totalAnimalsDaily > 0 ? totalMonthlyFinance / totalAnimalsDaily : 0;
  const dailyCostPerAnimal = monthlyCostPerAnimal / 30;
  const daysPerArroba = gmdDailyVal > 0 ? 30 / gmdDailyVal : 0;
  const costPerArrobaProduced = dailyCostPerAnimal * daysPerArroba;

  // --- Cálculos Simulador Preditivo ---
  const calculatedDays = predTargetMode === 'days' 
    ? (predGmd > 0 ? (predExitWeight - predEntryWeight) / predGmd : 0)
    : predDays;
  const calculatedGmd = predTargetMode === 'gmd'
    ? (predDays > 0 ? (predExitWeight - predEntryWeight) / predDays : 0)
    : predGmd;
  const calculatedFinalWeight = predTargetMode === 'final_weight'
    ? predEntryWeight + (predGmd * predDays)
    : predExitWeight;

  const costAnimalUnit = (predEntryWeight / 30) * predBuyPrice;
  const costNutritionUnit = predSuppCostDaily * calculatedDays;
  const costOperationUnit = predOpCostDaily * calculatedDays;
  const desembolsoTotalUnit = costAnimalUnit + costNutritionUnit + costOperationUnit;
  
  const carcassKgUnit = calculatedFinalWeight * (predCarcassYield / 100);
  const arrobasUnit = carcassKgUnit / 15;
  const receitaBrutaUnit = arrobasUnit * predSellPrice;
  
  const netProfitUnit = receitaBrutaUnit - desembolsoTotalUnit;
  const netProfitTotal = netProfitUnit * predQty;
  const roiTotal = desembolsoTotalUnit > 0 ? (netProfitUnit / desembolsoTotalUnit) * 100 : 0;
  const monthlyRoi = calculatedDays > 0 ? (roiTotal / (calculatedDays / 30)) : 0;
  const breakEven = arrobasUnit > 0 ? desembolsoTotalUnit / arrobasUnit : 0;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', percent: 0, priceKg: 0 }]);
  };
  const removeIngredient = (id: string) => setIngredients(ingredients.filter(i => i.id !== id));
  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSaveDailyConfig = () => {
    if (onSaveDailyCost) {
      onSaveDailyCost(dailyCostPerAnimal, targetLotId || undefined);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  const handleSaveSupplementation = () => {
    if (totalPercent > 100) return;
    setSuppCostMonthly(totalMonthlyCostSupp);
    setTotalAnimalsDaily(numAnimals);
    const individualDailyCost = consumptionPerAnimalKg * costPerKgSupplement;
    if (onSaveDailyCost) {
      onSaveDailyCost(individualDailyCost, targetLotId || undefined);
    }
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter flex items-center gap-2 uppercase">
            {activeTab === 'daily_value' && 'Valor Diário'}
            {activeTab === 'diet' && 'Suplementação'}
            {activeTab === 'prediction' && 'Simulador de Lucro'}
          </h2>
          <p className="text-gray-500 text-sm italic">
            {activeTab === 'daily_value' && 'Calcule o custo diário por animal'}
            {activeTab === 'diet' && 'Manejo nutricional e composição de mistura'}
            {activeTab === 'prediction' && 'Projeção de rentabilidade do ciclo'}
          </p>
        </div>
        
        <div className="flex bg-gray-200 rounded-2xl p-1 shadow-inner border border-gray-300">
          <button onClick={() => setActiveTab('daily_value')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'daily_value' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>Valor Diário</button>
          <button onClick={() => setActiveTab('diet')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'diet' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>Suplementação</button>
          <button onClick={() => setActiveTab('prediction')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'prediction' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>Simulador</button>
        </div>
      </div>

      {activeTab === 'daily_value' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-8">
               <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <DollarSign size={20} className="text-emerald-600" /> Custos Mensais
               </h3>
               <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Arrendamento (R$/mês)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={rentCost} onChange={e => setRentCost(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Suplementação (R$/mês)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={suppCostMonthly} onChange={e => setSuppCostMonthly(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Extras (R$/mês)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={extraCostMonthly} onChange={e => setExtraCostMonthly(Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Total de Animais</label>
                        <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={totalAnimalsDaily} onChange={e => setTotalAnimalsDaily(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">GMD (kg/animal)</label>
                        <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={gmdDailyVal} onChange={e => setGmdDailyVal(Number(e.target.value))} />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <LayersIcon size={16} className="text-emerald-600" /> Onde deseja salvar este custo?
                    </label>
                    <select 
                        className="w-full border border-gray-200 rounded-xl px-5 py-3 font-bold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                        value={targetLotId}
                        onChange={(e) => setTargetLotId(e.target.value)}
                    >
                        <option value="">Geral (Toda a Fazenda)</option>
                        {lots.map(lot => (
                            <option key={lot.id} value={lot.id}>Aplicar apenas no Lote: {lot.name}</option>
                        ))}
                    </select>
                  </div>

                  <button onClick={handleSaveDailyConfig} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3">
                    <Save size={20} /> Salvar Configuração
                  </button>
               </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 space-y-6 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900"><Scale size={150} /></div>
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 relative z-10"><Target size={18} /> Resultados</h4>
                <div className="space-y-4 relative z-10">
                   <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Custo Total Mensal</p>
                      <p className="text-3xl font-black text-gray-800 tracking-tighter">R$ {totalMonthlyFinance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Custo Mensal/Animal</p>
                      <p className="text-3xl font-black text-emerald-600 tracking-tighter">R$ {monthlyCostPerAnimal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Custo Diário/Animal</p>
                      <p className="text-3xl font-black text-blue-600 tracking-tighter">R$ {dailyCostPerAnimal.toLocaleString('pt-BR', {minimumFractionDigits: 3})}</p>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Arroba Produzida</p>
                      <p className="text-3xl font-black text-emerald-700 tracking-tighter">R$ {costPerArrobaProduced.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                </div>
                {showSaveSuccess && <div className="bg-emerald-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 animate-bounce relative z-20"><CheckCircle size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span></div>}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'diet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><PieChartIcon className="text-emerald-600" size={18} /> Composição da Mistura (100kg)</h3>
                    {totalPercent > 100 && <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg animate-bounce flex items-center gap-1"><AlertCircle size={12} /> EXCESSO {totalPercent}%</div>}
                  </div>
                  <div className="p-8 space-y-4">
                    {ingredients.map(ing => (
                      <div key={ing.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group">
                          <div className="flex justify-between items-center mb-4">
                              <input type="text" className="bg-transparent border-none p-0 text-sm font-black text-gray-700 outline-none focus:ring-0 w-1/2" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} placeholder="Ingrediente..." />
                              <button onClick={() => removeIngredient(ing.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                          </div>
                          <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Percentual (%)</label>
                                  <input type="number" onFocus={handleFocus} className="w-full border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold bg-gray-50/50" value={ing.percent || ''} onChange={e => updateIngredient(ing.id, 'percent', Number(e.target.value))} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor/Kg (R$)</label>
                                  <input type="number" step="0.01" onFocus={handleFocus} className="w-full border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold bg-gray-50/50" value={ing.priceKg || ''} onChange={e => updateIngredient(ing.id, 'priceKg', Number(e.target.value))} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custo Mistura</label>
                                  <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-400">R$ {((ing.percent / 100) * ing.priceKg).toFixed(2)}</div>
                              </div>
                          </div>
                      </div>
                    ))}
                    <button onClick={handleAddIngredient} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"><Plus size={18} /> Adicionar Ingrediente</button>
                    <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Custo do Kg Pronto</p>
                            <p className="text-4xl font-black text-emerald-900 tracking-tighter">R$ {costPerKgSupplement.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total</p>
                             <p className={`text-2xl font-black ${totalPercent === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{totalPercent}%</p>
                        </div>
                    </div>
                  </div>
              </div>
           </div>
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8 flex flex-col h-full">
                 <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="text-blue-600" size={18} /> Consumo do Lote</h4>
                 <div className="space-y-5">
                    <div className="space-y-1">
                       <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Peso Médio (kg)</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={avgLotWeight} onChange={e => setAvgLotWeight(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Total Animais</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={numAnimals} onChange={e => setNumAnimals(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">% do Peso Vivo</label>
                       <select className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-bold bg-gray-50 cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-blue-500" value={pvPercent} onChange={e => setPvPercent(Number(e.target.value))}>
                         <option value={0.1}>0.1% do PV</option>
                         <option value={0.2}>0.2% do PV</option>
                         <option value={0.3}>0.3% do PV</option>
                         <option value={0.5}>0.5% do PV</option>
                         <option value={1.0}>1.0% do PV</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-4 flex-1">
                    <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex flex-col">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Consumo/Animal</p>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">{consumptionPerAnimalKg.toFixed(2)} <span className="text-sm font-bold opacity-60">kg/dia</span></p>
                    </div>
                    <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex flex-col">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Consumo Total do Lote</p>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">{totalBatchConsumption.toFixed(2)} <span className="text-sm font-bold opacity-60">kg/dia</span></p>
                    </div>
                    <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex flex-col">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Consumo Mensal do Lote</p>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">{totalMonthlyConsumptionKg.toFixed(2)} <span className="text-sm font-bold opacity-60">kg/mês</span></p>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Custo por Dia</p>
                        <p className="text-3xl font-black text-emerald-900 tracking-tighter">R$ {totalDailyCostSupp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 flex flex-col">
                        <p className="text-[10px] font-black text-purple-600 uppercase mb-1 tracking-widest">Custo Mensal</p>
                        <p className="text-3xl font-black text-purple-900 tracking-tighter">R$ {totalMonthlyCostSupp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Salvar diária para qual lote?</label>
                    <select 
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold bg-white"
                        value={targetLotId}
                        onChange={(e) => setTargetLotId(e.target.value)}
                    >
                        <option value="">Geral</option>
                        {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                 </div>

                 <button onClick={handleSaveSupplementation} disabled={totalPercent > 100} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
                    <Save size={20} /> Salvar Configuração
                 </button>
                 {showSaveSuccess && <div className="text-emerald-600 font-bold text-center animate-bounce text-xs uppercase tracking-widest">Configuração Salva!</div>}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'prediction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Main Form Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-3 uppercase text-sm tracking-widest">
                        <Activity className="text-emerald-600" size={24} /> Variáveis de Entrada
                    </h3>
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                        <button onClick={() => setPredTargetMode('final_weight')} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${predTargetMode === 'final_weight' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>OBJ: PESO</button>
                        <button onClick={() => setPredTargetMode('gmd')} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${predTargetMode === 'gmd' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>OBJ: GMD</button>
                        <button onClick={() => setPredTargetMode('days')} className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${predTargetMode === 'days' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>OBJ: DIAS</button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Investimento */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Investimento</h4>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Qtd Cabeças</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={predQty} onChange={e => setPredQty(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Peso Compra (kg)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={predEntryWeight} onChange={e => setPredEntryWeight(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Compra (R$/@)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-black text-blue-600 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={predBuyPrice} onChange={e => setPredBuyPrice(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Manejo Técnico */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Manejo Técnico</h4>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">GMD (kg/dia)</label>
                            <input type="number" step="0.01" onFocus={handleFocus} className={`w-full border rounded-xl px-4 py-3 font-bold outline-none transition-all ${predTargetMode === 'gmd' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500'}`} value={predTargetMode === 'gmd' ? calculatedGmd.toFixed(3) : predGmd} onChange={e => setPredGmd(Number(e.target.value))} readOnly={predTargetMode === 'gmd'} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Duração (Dias)</label>
                            <input type="number" onFocus={handleFocus} className={`w-full border rounded-xl px-4 py-3 font-bold outline-none transition-all ${predTargetMode === 'days' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500'}`} value={predTargetMode === 'days' ? Math.round(calculatedDays) : predDays} onChange={e => setPredDays(Number(e.target.value))} readOnly={predTargetMode === 'days'} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Ração R$/dia</label>
                                <input type="number" step="0.01" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={predSuppCostDaily} onChange={e => setPredSuppCostDaily(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Oper. R$/dia</label>
                                <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={predOpCostDaily} onChange={e => setPredOpCostDaily(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* Mercado Saída */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Mercado Saída</h4>
                        <div className="space-y-1 relative group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Peso Final (kg)</label>
                            <span className="absolute right-4 top-10 text-[9px] font-black text-blue-600 uppercase">Calculando...</span>
                            <input type="number" onFocus={handleFocus} className={`w-full border rounded-xl px-4 py-3 font-black outline-none transition-all ${predTargetMode === 'final_weight' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} value={predTargetMode === 'final_weight' ? calculatedFinalWeight.toFixed(1) : predExitWeight} onChange={e => setPredExitWeight(Number(e.target.value))} readOnly={predTargetMode === 'final_weight'} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Rendimento (%)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={predCarcassYield} onChange={e => setPredCarcassYield(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Venda (R$/@)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-black text-emerald-600 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={predSellPrice} onChange={e => setPredSellPrice(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Green Banner */}
            <div className="bg-emerald-600 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-900 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <Scale size={200} />
                </div>
                <div className="space-y-2 relative z-10 text-center md:text-left">
                    <p className="text-emerald-100 text-[11px] font-black uppercase tracking-[0.2em]">Resumo do Ciclo</p>
                    <h4 className="text-2xl font-black tracking-tight">
                        Ciclo de <span className="text-yellow-400">{Math.round(calculatedDays)} dias</span> para atingir <span className="text-yellow-400">{calculatedFinalWeight.toFixed(1)} kg</span> de peso vivo.
                    </h4>
                    <p className="text-sm text-emerald-100 font-medium">Equivale a {(arrobasUnit).toFixed(2)} @ de carcaça disponível.</p>
                </div>
                <div className="mt-6 md:mt-0 bg-emerald-500/30 backdrop-blur-sm p-5 rounded-[1.5rem] border border-white/20 text-center z-10 min-w-[150px]">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">GMD Projetado</p>
                    <p className="text-4xl font-black tracking-tighter">{(predTargetMode === 'gmd' ? calculatedGmd : predGmd).toFixed(3)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">kg/dia</p>
                </div>
            </div>
          </div>

          {/* Right Dark Panel */}
          <div className="lg:col-span-4 h-full">
            <div className="bg-[#1a1f2c] text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col h-full border-[6px] border-[#252b3a]">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-900 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                  <Coins size={250} />
               </div>
               
               <div className="mb-8 relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DRE Projetado (Ciclo)</h4>
                    {netProfitTotal > 0 && (
                        <span className="bg-yellow-500/20 text-yellow-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-500/30">Alerta: Margem</span>
                    )}
                  </div>
                  <p className={`text-6xl font-black ${netProfitTotal >= 0 ? 'text-white' : 'text-red-500'} tracking-tighter`}>
                    R$ {Math.abs(netProfitTotal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-[#252b3a] p-4 rounded-3xl border border-gray-700/30">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Rentab. Mensal</span>
                        <span className="text-lg font-black text-yellow-500 tracking-tight">{monthlyRoi.toFixed(2)}% / mês</span>
                    </div>
                    <div className="bg-[#252b3a] p-4 rounded-3xl border border-gray-700/30">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">ROI Total</span>
                        <span className="text-lg font-black text-yellow-500 tracking-tight">{roiTotal.toFixed(1)}%</span>
                    </div>
                  </div>
               </div>

               <div className="flex-1 relative z-10 space-y-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Composição de Custos</h5>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-medium">Compra (Animal):</span>
                            <span className="font-bold text-blue-400">R$ {(costAnimalUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-medium">Nutrição (Ração):</span>
                            <span className="font-bold text-red-400">R$ {(costNutritionUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-medium">Operacional (Fixo):</span>
                            <span className="font-bold text-red-400">R$ {(costOperationUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-baseline mb-6">
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Desembolso Total:</span>
                        <span className="text-2xl font-black text-white">R$ {(desembolsoTotalUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-6">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Receita Bruta Venda:</span>
                        <span className="text-2xl font-black text-emerald-400 font-bold">R$ {(receitaBrutaUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="bg-[#252b3a] p-5 rounded-3xl border border-gray-700/50 flex justify-between items-center mt-auto">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">Ponto de Equilíbrio</span>
                        <p className="text-xl font-black tracking-tight">R$ {breakEven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] font-medium opacity-50">/ @</span></p>
                    </div>
                    <div className="opacity-20 transform -rotate-12">
                        <TrendingUp size={32} />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsCalculator;
