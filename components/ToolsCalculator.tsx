
import React, { useState } from 'react';
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
  Activity,
  Plus,
  Trash2,
  Weight,
  Layers as LayersIcon,
  ArrowDownToLine
} from 'lucide-react';
import { Lot, AnimalStatus } from '../types';

interface ToolsCalculatorProps {
    onSaveDailyCost?: (cost: number, lotId?: string) => void;
    lots?: Lot[];
}

interface Ingredient {
    id: string;
    name: string;
    percent: number;
    priceKg: number;
}

const ToolsCalculator: React.FC<ToolsCalculatorProps> = ({ onSaveDailyCost, lots = [] }) => {
  const [activeTab, setActiveTab] = useState<'prediction' | 'cost'>('prediction');
  const [costSubTab, setCostSubTab] = useState<'operational' | 'diet'>('diet');

  // --- Estados do Simulador Preditivo (Aba 1) ---
  const [predQty, setPredQty] = useState<number>(50);
  const [predEntryWeight, setPredEntryWeight] = useState<number>(330);
  const [predBuyPrice, setPredBuyPrice] = useState<number>(250); 
  const [predTargetMode, setPredTargetMode] = useState<'final_weight' | 'gmd' | 'days'>('final_weight');
  const [predExitWeight, setPredExitWeight] = useState<number>(520);
  const [predCarcassYield, setPredCarcassYield] = useState<number>(52);
  const [predSellPrice, setPredSellPrice] = useState<number>(240);
  const [predSuppCostDaily, setPredSuppCostDaily] = useState<number>(6.50);
  const [predOpCostDaily, setPredOpCostDaily] = useState<number>(1.80);
  const [predGmd, setPredGmd] = useState<number>(1.15);
  const [predDays, setPredDays] = useState<number>(180);

  // --- Estados da Calculadora de Custos (Aba 2) ---
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Custos Operacionais
  const [opLabor, setOpLabor] = useState<number>(0);
  const [opFuel, setOpFuel] = useState<number>(0);
  const [opEnergy, setOpEnergy] = useState<number>(0);
  const [opMaint, setOpMaint] = useState<number>(0);
  const [opOther, setOpOther] = useState<number>(0);
  
  // Dieta/Ração
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Farelo de Milho', percent: 65, priceKg: 1.00 },
    { id: '2', name: 'Farelo de Soja', percent: 21, priceKg: 3.00 },
    { id: '3', name: 'Núcleo', percent: 11, priceKg: 5.00 },
    { id: '4', name: 'Ureia', percent: 3, priceKg: 7.00 },
  ]);

  // --- Estados do Cálculo de Consumo (Lote) ---
  const [avgLotWeight, setAvgLotWeight] = useState<number>(330);
  const [numAnimals, setNumAnimals] = useState<number>(50);
  const [pvPercent, setPvPercent] = useState<number>(0.1); 

  // --- Estados da Calculadora de Batida (Mixer) ---
  const [batchTotalKg, setBatchTotalKg] = useState<number>(100);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select();

  // --- Lógicas de Cálculo ---
  const totalPercent = ingredients.reduce((acc, i) => acc + i.percent, 0);
  const costPerKgSupplement = ingredients.reduce((acc, i) => acc + (i.percent / 100) * i.priceKg, 0);

  const consumptionPerAnimalKg = (avgLotWeight * (pvPercent / 100));
  const totalBatchConsumption = consumptionPerAnimalKg * numAnimals;
  const totalDailyCost = totalBatchConsumption * costPerKgSupplement;
  const totalMonthlyCost = totalDailyCost * 30;

  const calculatedDays = predTargetMode === 'days' 
    ? (predGmd > 0 ? (predExitWeight - predEntryWeight) / predGmd : 0)
    : predDays;
  
  const calculatedGmd = predTargetMode === 'gmd'
    ? (predDays > 0 ? (predExitWeight - predEntryWeight) / predDays : 0)
    : predGmd;

  const calculatedFinalWeight = predTargetMode === 'final_weight'
    ? predEntryWeight + (predGmd * predDays)
    : predExitWeight;

  const acquisitionCost = (predEntryWeight / 30) * predBuyPrice;
  const nutritionTotal = predSuppCostDaily * calculatedDays;
  const operationTotal = predOpCostDaily * calculatedDays;
  const totalInvestment = acquisitionCost + nutritionTotal + operationTotal;
  const carcassWeightKg = calculatedFinalWeight * (predCarcassYield / 100);
  const totalArrobas = carcassWeightKg / 15;
  const grossRevenue = totalArrobas * predSellPrice;
  const netProfit = grossRevenue - totalInvestment;
  const roiTotal = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const monthlyRoi = calculatedDays > 0 ? (roiTotal / (calculatedDays / 30)) : 0;
  const breakEvenPrice = totalArrobas > 0 ? totalInvestment / totalArrobas : 0;

  const totalMonthlyOp = opLabor + opFuel + opEnergy + opMaint + opOther;
  const calculatedDailyOpPerHead = predQty > 0 ? (totalMonthlyOp / 30) / predQty : 0;

  const handleBatchTotalChange = (val: number) => setBatchTotalKg(val);
  const handleIngredientBatchChange = (ingId: string, kgValue: number) => {
    const ing = ingredients.find(i => i.id === ingId);
    if (ing && ing.percent > 0) {
      const newTotal = kgValue / (ing.percent / 100);
      setBatchTotalKg(newTotal);
    }
  };

  const handleAddIngredient = () => {
    const newIng: Ingredient = { id: Date.now().toString(), name: '', percent: 0, priceKg: 0 };
    setIngredients([...ingredients, newIng]);
  };

  const removeIngredient = (id: string) => setIngredients(ingredients.filter(i => i.id !== id));

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const syncDailyCost = () => {
    const individualDailyCost = consumptionPerAnimalKg * costPerKgSupplement;
    setPredSuppCostDaily(individualDailyCost);
    setAvgLotWeight(predEntryWeight);
    setNumAnimals(predQty);
  };

  const handleSaveCosts = () => {
    if (totalPercent > 100) return;
    setPredOpCostDaily(calculatedDailyOpPerHead);
    const individualDailyCost = consumptionPerAnimalKg * costPerKgSupplement;
    setPredSuppCostDaily(individualDailyCost);
    
    if (onSaveDailyCost) {
      const totalCombined = calculatedDailyOpPerHead + individualDailyCost;
      onSaveDailyCost(totalCombined, selectedLotId || undefined);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter flex items-center gap-2">
            <Calculator className="text-emerald-600" /> Inteligência Produtiva
          </h2>
          <p className="text-gray-500 text-sm italic">Gestão zootécnica de alta performance</p>
        </div>
        
        <div className="flex bg-gray-200 rounded-2xl p-1 shadow-inner border border-gray-300">
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'prediction' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
          >Simulador de Lucro</button>
          <button 
            onClick={() => setActiveTab('cost')} 
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'cost' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
          >Config. Nutricional</button>
        </div>
      </div>

      {activeTab === 'prediction' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Target className="text-emerald-600" /> Variáveis de Entrada</h3>
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                  <button onClick={() => setPredTargetMode('final_weight')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${predTargetMode === 'final_weight' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}>OBJ: PESO</button>
                  <button onClick={() => setPredTargetMode('gmd')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${predTargetMode === 'gmd' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}>OBJ: GMD</button>
                  <button onClick={() => setPredTargetMode('days')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${predTargetMode === 'days' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}>OBJ: DIAS</button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Investimento</p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd Cabeças</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={predQty} onChange={e => setPredQty(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Peso Compra (kg)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={predEntryWeight} onChange={e => setPredEntryWeight(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Compra (R$/@)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-blue-600" value={predBuyPrice} onChange={e => setPredBuyPrice(Number(e.target.value))} />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b pb-2">Manejo Técnico</p>
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center h-4 mb-0.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">GMD (kg/dia)</label>
                        {predTargetMode === 'gmd' && <span className="text-[9px] font-black text-blue-600 animate-pulse tracking-tighter absolute -top-4 right-0">CALCULANDO...</span>}
                    </div>
                    <input 
                      type="number" 
                      step="0.01" 
                      onFocus={handleFocus} 
                      className={`w-full border rounded-xl px-3 py-2 font-bold transition-all outline-none ${predTargetMode === 'gmd' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200'}`} 
                      value={predTargetMode === 'gmd' ? calculatedGmd.toFixed(3) : predGmd} 
                      onChange={e => setPredGmd(Number(e.target.value))}
                      readOnly={predTargetMode === 'gmd'}
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center h-4 mb-0.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Duração (Dias)</label>
                        {predTargetMode === 'days' && <span className="text-[9px] font-black text-blue-600 animate-pulse tracking-tighter absolute -top-4 right-0">CALCULANDO...</span>}
                    </div>
                    <input 
                      type="number" 
                      onFocus={handleFocus} 
                      className={`w-full border rounded-xl px-3 py-2 font-bold transition-all outline-none ${predTargetMode === 'days' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200'}`} 
                      value={predTargetMode === 'days' ? Math.round(calculatedDays) : predDays} 
                      onChange={e => setPredDays(Number(e.target.value))}
                      readOnly={predTargetMode === 'days'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Ração R$/dia</label>
                        <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs font-bold" value={predSuppCostDaily} onChange={e => setPredSuppCostDaily(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Oper. R$/dia</label>
                        <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs font-bold" value={predOpCostDaily} onChange={e => setPredOpCostDaily(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2">Mercado Saída</p>
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center h-4 mb-0.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Peso Final (kg)</label>
                        {predTargetMode === 'final_weight' && <span className="text-[9px] font-black text-blue-600 animate-pulse tracking-tighter absolute -top-4 right-0">CALCULANDO...</span>}
                    </div>
                    <input 
                      type="number" 
                      onFocus={handleFocus} 
                      className={`w-full border rounded-xl px-3 py-2 font-bold transition-all outline-none ${predTargetMode === 'final_weight' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200'}`} 
                      value={predTargetMode === 'final_weight' ? calculatedFinalWeight.toFixed(1) : predExitWeight} 
                      onChange={e => setPredExitWeight(Number(e.target.value))}
                      readOnly={predTargetMode === 'final_weight'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Rendimento (%)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-500 outline-none" value={predCarcassYield} onChange={e => setPredCarcassYield(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Venda (R$/@)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-emerald-600" value={predSellPrice} onChange={e => setPredSellPrice(Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 p-8 rounded-[2rem] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Scale size={100} />
                </div>
                <div className="space-y-2 relative z-10">
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Resumo do Ciclo</p>
                    <h4 className="text-xl font-black leading-tight">
                        Ciclo de <span className="text-yellow-400">{calculatedDays.toFixed(0)} dias</span> para atingir 
                        <span className="text-yellow-400"> {calculatedFinalWeight.toFixed(1)} kg</span> de peso vivo.
                    </h4>
                    <p className="text-xs text-emerald-100 font-medium">Equivale a {totalArrobas.toFixed(2)} @ de carcaça disponível.</p>
                </div>
                <div className="bg-emerald-500/50 p-4 rounded-3xl border border-emerald-400/30 text-center min-w-[140px] relative z-10">
                    <p className="text-[9px] font-black uppercase mb-1">GMD Projetado</p>
                    <p className="text-3xl font-black">{calculatedGmd.toFixed(3)}</p>
                    <p className="text-[9px] font-bold">kg/dia</p>
                </div>
            </div>
          </div>

          <div className="lg:col-span-4 h-full">
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col h-full border-4 border-gray-800">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                 <Coins size={150} />
               </div>

               <div className="mb-10 relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DRE Projetado (Ciclo)</h4>
                    {monthlyRoi > 0.9 ? (
                        <span className="bg-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                            RENTÁVEL
                        </span>
                    ) : (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${monthlyRoi > 0 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                            {monthlyRoi > 0 ? 'ALERTA: MARGEM' : 'PREJUÍZO'}
                        </span>
                    )}
                  </div>
                  <p className={`text-5xl font-black ${(netProfit * predQty) >= 0 ? 'text-white' : 'text-red-500'} tracking-tighter`}>
                    R$ {(netProfit * predQty).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Rentab. Mensal</span>
                        <span className={`text-lg font-black ${monthlyRoi > 0.9 ? 'text-emerald-400' : 'text-yellow-500'}`}>{monthlyRoi.toFixed(2)}% / mês</span>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">ROI Total</span>
                        <span className="text-lg font-black text-yellow-500">{roiTotal.toFixed(1)}%</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-6 flex-1 relative z-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-800 pb-2">Composição de Custos</p>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Compra (Animal):</span>
                      <span className="font-bold text-blue-400">R$ {acquisitionCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Nutrição (Ração):</span>
                      <span className="font-bold text-red-400">R$ {nutritionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Operacional (Fixo):</span>
                      <span className="font-bold text-red-400">R$ {operationTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-3 mt-1 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-yellow-500">Desembolso Total:</span>
                        <span className="text-xl font-black">R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 mt-6 border-t border-gray-800/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Receita Bruta Venda:</span>
                      <span className="font-black text-emerald-400 text-base">R$ {grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-gray-500 font-black uppercase">Ponto de Equilíbrio</p>
                            <p className="text-lg font-black text-yellow-500">R$ {breakEvenPrice.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">/ @</span></p>
                        </div>
                        <Activity size={24} className="text-gray-700" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in zoom-in-95 duration-200">
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-1 bg-gray-100 border-b border-gray-200 flex">
                    <button 
                      onClick={() => setCostSubTab('diet')} 
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl ${costSubTab === 'diet' ? 'bg-white text-emerald-700' : 'text-gray-400 hover:bg-gray-200'}`}
                    >Suplementação / Dieta</button>
                    <button 
                      onClick={() => setCostSubTab('operational')} 
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl ${costSubTab === 'operational' ? 'bg-white text-orange-700' : 'text-gray-400 hover:bg-gray-200'}`}
                    >Custos Operacionais</button>
                  </div>

                  <div className="p-8">
                    {costSubTab === 'diet' ? (
                      <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                    <PieChartIcon className="text-emerald-500" size={18} /> Composição da Mistura (100kg)
                                </h4>
                                {totalPercent > 100 && (
                                    <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg animate-bounce flex items-center gap-1">
                                        ERRO: EXCESSO {totalPercent}%
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {ingredients.map(ing => {
                                    const costInMix = (ing.percent / 100) * ing.priceKg;
                                    return (
                                        <div key={ing.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
                                            <div className="flex justify-between items-center mb-3">
                                                <input 
                                                  type="text" 
                                                  className="bg-transparent border-none p-0 text-sm font-black text-gray-700 outline-none focus:ring-0 w-1/2" 
                                                  value={ing.name} 
                                                  onChange={e => updateIngredient(ing.id, 'name', e.target.value)} 
                                                  placeholder="Ingrediente..." 
                                                />
                                                <button onClick={() => removeIngredient(ing.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Percentual (%)</label>
                                                    <input type="number" onFocus={handleFocus} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black" value={ing.percent || ''} onChange={e => updateIngredient(ing.id, 'percent', Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valor/Kg (R$)</label>
                                                    <input type="number" step="0.01" onFocus={handleFocus} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black" value={ing.priceKg || ''} onChange={e => updateIngredient(ing.id, 'priceKg', Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custo na Mistura</label>
                                                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-gray-400">R$ {costInMix.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={handleAddIngredient} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-xs font-bold text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2">
                                    <Plus size={16} /> Adicionar Ingrediente
                                </button>
                            </div>

                            <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Valor Total do Kg do Suplemento</p>
                                    <p className="text-4xl font-black text-emerald-900 tracking-tighter">R$ {costPerKgSupplement.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Soma Formulação</p>
                                    <p className={`text-2xl font-black ${totalPercent === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{totalPercent}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-900 text-white rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Weight size={180} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-lg font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-1">
                                        <LayersIcon size={20} /> Mixer Proporcional
                                    </h4>
                                    <p className="text-xs text-emerald-200/70 font-medium italic">Baseado nos ingredientes acima</p>
                                </div>
                                <div className="bg-emerald-800/40 p-4 rounded-2xl border border-emerald-700/50 flex flex-col">
                                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Produzir Batida de:</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            onFocus={handleFocus}
                                            className="bg-transparent border-none p-0 text-3xl font-black text-white focus:ring-0 outline-none w-24"
                                            value={batchTotalKg || ''}
                                            onChange={e => handleBatchTotalChange(Number(e.target.value))}
                                        />
                                        <span className="text-xs font-black text-emerald-500 uppercase">Kg</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                {ingredients.map(ing => {
                                    const kgNeeded = (ing.percent / 100) * batchTotalKg;
                                    return (
                                        <div key={`mixer-${ing.id}`} className="bg-emerald-800/20 p-4 rounded-2xl border border-emerald-700/30">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase truncate mb-1">{ing.name || 'S/ Nome'}</p>
                                            <p className="text-xl font-black text-white">{kgNeeded.toFixed(1)} <span className="text-[10px] font-bold text-emerald-600 uppercase">kg</span></p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mão de Obra Mensal</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold bg-gray-50 focus:bg-white transition-all outline-none" value={opLabor || ''} onChange={e => setOpLabor(Number(e.target.value))} />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Diesel / Energia</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold bg-gray-50 focus:bg-white transition-all outline-none" value={opFuel || ''} onChange={e => setOpFuel(Number(e.target.value))} />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Reparos / Cercas</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold bg-gray-50 focus:bg-white transition-all outline-none" value={opMaint || ''} onChange={e => setOpMaint(Number(e.target.value))} />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Impostos / Pro-labore</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold bg-gray-50 focus:bg-white transition-all outline-none" value={opOther || ''} onChange={e => setOpOther(Number(e.target.value))} />
                              </div>
                           </div>
                        </div>
                        <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex justify-between items-center shadow-inner">
                           <div>
                              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Custo Operacional Projetado</p>
                              <p className="text-3xl font-black text-gray-800">R$ {calculatedDailyOpPerHead.toFixed(2)} <span className="text-sm text-gray-400 font-bold">/ cab. / dia</span></p>
                           </div>
                           <Activity className="text-orange-300" size={48} />
                        </div>
                      </div>
                    )}
                  </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8 animate-in slide-in-from-right-4">
                 <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} /> Consumo do Lote
                 </h4>
                 
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peso Médio do Lote (kg)</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-gray-700" value={avgLotWeight} onChange={e => setAvgLotWeight(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total de Animais</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-gray-700" value={numAnimals} onChange={e => setNumAnimals(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Percentual do Peso Vivo</label>
                       <select 
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        value={pvPercent}
                        onChange={e => setPvPercent(Number(e.target.value))}
                       >
                         <option value={0.1}>0.1% do peso vivo</option>
                         <option value={0.2}>0.2% do peso vivo</option>
                         <option value={0.3}>0.3% do peso vivo</option>
                         <option value={0.5}>0.5% do peso vivo</option>
                         <option value={1.0}>1.0% do peso vivo</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Consumo por Animal</p>
                        <p className="text-2xl font-black text-blue-900">{consumptionPerAnimalKg.toFixed(2)} <span className="text-xs font-bold opacity-60">kg/dia</span></p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Valor Gasto por Dia</p>
                        <p className="text-2xl font-black text-emerald-900">R$ {totalDailyCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4 border-t border-gray-100">
                    <button 
                      onClick={handleSaveCosts}
                      disabled={totalPercent > 100}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Save size={18} /> Salvar Configuração
                    </button>
                    <button 
                      onClick={syncDailyCost}
                      className="w-full bg-white text-emerald-600 border-2 border-emerald-600 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <ArrowDownToLine size={18} /> Enviar R$ { (consumptionPerAnimalKg * costPerKgSupplement).toFixed(2) } para Diária
                    </button>
                    {showSaveSuccess && (
                      <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] animate-bounce uppercase tracking-widest">
                        <CheckCircle size={18} /> Dados Atualizados com Sucesso
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ToolsCalculator;
