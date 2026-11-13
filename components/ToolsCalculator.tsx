
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
  Activity,
  Clock,
  Building2,
  MapPin
} from 'lucide-react';
import { Lot, AnimalStatus, CalculatorConfig, Ingredient } from '../types';
import { getSelectedScotQuote } from '../services/scotData';

interface ToolsCalculatorProps {
    onSaveDailyCost?: (cost: number, lotId?: string, config?: CalculatorConfig) => void;
    lots?: Lot[];
    initialTab?: 'prediction' | 'diet' | 'daily_value';
    initialConfig?: CalculatorConfig;
}

const ToolsCalculator: React.FC<ToolsCalculatorProps> = ({ onSaveDailyCost, lots = [], initialTab = 'prediction', initialConfig }) => {
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
  const [predDailyRate, setPredDailyRate] = useState<number>(8.532);
  const [predGmd, setPredGmd] = useState<number>(1.15);
  const [predDays, setPredDays] = useState<number>(180);

  // --- Estados do Valor da Diária / Suplementação (Persistíveis) ---
  const [rentMode, setRentMode] = useState<'total' | 'per_animal'>('total');
  const [rentCost, setRentCost] = useState<number>(3000);
  const [rentPerAnimal, setRentPerAnimal] = useState<number>(60);
  const [suppCostMonthly, setSuppCostMonthly] = useState<number>(2000); 
  const [extraCostMonthly, setExtraCostMonthly] = useState<number>(500);
  const [totalAnimalsDaily, setTotalAnimalsDaily] = useState<number>(50);
  const [gmdDailyVal, setGmdDailyVal] = useState<number>(0.8);
  const [targetLotId, setTargetLotId] = useState<string>(''); 
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Farelo de Milho', percent: 65, priceKg: 1.00 },
    { id: '2', name: 'Farelo de Soja', percent: 21, priceKg: 3.00 },
    { id: '3', name: 'Núcleo', percent: 11, priceKg: 5.00 },
    { id: '4', name: 'Ureia', percent: 3, priceKg: 7.00 },
  ]);
  const [avgLotWeight, setAvgLotWeight] = useState<number>(330);
  const [numAnimals, setNumAnimals] = useState<number>(50);
  const [pvPercent, setPvPercent] = useState<number>(0.1); 

  // --- Estados do Sal Mineral ---
  const [isMineralSalt, setIsMineralSalt] = useState<boolean>(false);
  const [mineralPriceTotal, setMineralPriceTotal] = useState<number>(120);
  const [mineralBagWeight, setMineralBagWeight] = useState<number>(30);
  const [mineralConsumptionGrams, setMineralConsumptionGrams] = useState<number>(100);

  const [isSaving, setIsSaving] = useState(false);

  // Carregar configurações salvas apenas ao mudar o lote alvo ou no mount inicial
  useEffect(() => {
    const configToLoad = targetLotId 
      ? lots.find(l => l.id === targetLotId)?.calculatorConfig 
      : initialConfig;

    if (configToLoad) {
      const loadedRentMode = configToLoad.rentMode || 'total';
      setRentMode(loadedRentMode);
      const loadedRentCost = configToLoad.rentCost || 0;
      setRentCost(loadedRentCost);
      const loadedAnimals = configToLoad.totalAnimalsDaily || 50;
      setTotalAnimalsDaily(loadedAnimals);

      if (configToLoad.rentPerAnimal !== undefined) {
        setRentPerAnimal(configToLoad.rentPerAnimal);
      } else if (loadedAnimals > 0 && loadedRentCost > 0) {
        setRentPerAnimal(Number((loadedRentCost / loadedAnimals).toFixed(2)));
      }

      setSuppCostMonthly(configToLoad.suppCostMonthly || 0);
      setExtraCostMonthly(configToLoad.extraCostMonthly || 0);
      setGmdDailyVal(configToLoad.gmdDailyVal || 0);
      setIngredients(configToLoad.ingredients || [
        { id: '1', name: 'Farelo de Milho', percent: 65, priceKg: 1.00 },
        { id: '2', name: 'Farelo de Soja', percent: 21, priceKg: 3.00 },
        { id: '3', name: 'Núcleo', percent: 11, priceKg: 5.00 },
        { id: '4', name: 'Ureia', percent: 3, priceKg: 7.00 },
      ]);
      setAvgLotWeight(configToLoad.avgLotWeight || 0);
      setNumAnimals(configToLoad.numAnimals || 50);
      setPvPercent(configToLoad.pvPercent || 0);
      setIsMineralSalt(configToLoad.isMineralSalt || false);
      setMineralPriceTotal(configToLoad.mineralPriceTotal ?? 120);
      setMineralBagWeight(configToLoad.mineralBagWeight ?? 30);
      setMineralConsumptionGrams(configToLoad.mineralConsumptionGrams ?? 100);

      // Carregar campos do simulador de lucro
      if (configToLoad.predQty !== undefined) setPredQty(configToLoad.predQty);
      if (configToLoad.predEntryWeight !== undefined) setPredEntryWeight(configToLoad.predEntryWeight);
      if (configToLoad.predBuyPrice !== undefined) setPredBuyPrice(configToLoad.predBuyPrice);
      if (configToLoad.predTargetMode !== undefined) setPredTargetMode(configToLoad.predTargetMode);
      if (configToLoad.predExitWeight !== undefined) setPredExitWeight(configToLoad.predExitWeight);
      if (configToLoad.predCarcassYield !== undefined) setPredCarcassYield(configToLoad.predCarcassYield);
      if (configToLoad.predSellPrice !== undefined) setPredSellPrice(configToLoad.predSellPrice);
      if (configToLoad.predDailyRate !== undefined) setPredDailyRate(configToLoad.predDailyRate);
      if (configToLoad.predGmd !== undefined) setPredGmd(configToLoad.predGmd);
      if (configToLoad.predDays !== undefined) setPredDays(configToLoad.predDays);
    }
  }, [targetLotId]); // Removido lots e initialConfig para evitar sobrescrever edições em curso

  // --- Estados da Calculadora de Mistura ---
  const scotQuote = getSelectedScotQuote();
  const [calcInput, setCalcInput] = useState<{ id: string | 'total', value: number }>({ id: 'total', value: 100 });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select();

  // --- Cálculos Suplementação ---
  const totalPercent = ingredients.reduce((acc, i) => acc + i.percent, 0);
  const costPerKgSupplement = isMineralSalt
    ? (mineralBagWeight > 0 ? mineralPriceTotal / mineralBagWeight : 0)
    : ingredients.reduce((acc, i) => acc + (i.percent / 100) * i.priceKg, 0);
  const consumptionPerAnimalKg = isMineralSalt
    ? (mineralConsumptionGrams / 1000)
    : (avgLotWeight * (pvPercent / 100));
  const totalBatchConsumption = consumptionPerAnimalKg * numAnimals;
  const totalDailyCostSupp = totalBatchConsumption * costPerKgSupplement;
  const totalMonthlyCostSupp = totalDailyCostSupp * 30;
  const totalMonthlyConsumptionKg = totalBatchConsumption * 30;

  // --- Funções Calculadora de Mistura ---
  const getWeight = (ingId: string) => {
    const ing = ingredients.find(i => i.id === ingId);
    if (!ing || totalPercent === 0) return 0;
    if (calcInput.id === 'total') return calcInput.value * (ing.percent / totalPercent);
    if (calcInput.id === ingId) return calcInput.value;
    const sourceIng = ingredients.find(i => i.id === calcInput.id);
    if (!sourceIng || sourceIng.percent === 0) return 0;
    const total = calcInput.value / (sourceIng.percent / totalPercent);
    return total * (ing.percent / totalPercent);
  };

  const getTotalWeight = () => {
    if (calcInput.id === 'total') return calcInput.value;
    const sourceIng = ingredients.find(i => i.id === calcInput.id);
    if (!sourceIng || sourceIng.percent === 0) return 0;
    return calcInput.value / (sourceIng.percent / totalPercent);
  };

  // --- Cálculos Valor da Diária ---
  const effectiveRentCost = rentMode === 'per_animal' 
    ? ((Number(rentPerAnimal) || 0) * (Number(totalAnimalsDaily) || 0)) 
    : (Number(rentCost) || 0);

  const totalMonthlyFinance = effectiveRentCost + suppCostMonthly + extraCostMonthly;
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
  const costNutritionUnit = predDailyRate * calculatedDays;
  const costOperationUnit = 0;
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
    setIngredients([...ingredients, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, name: '', percent: 0, priceKg: 0 }]);
  };
  const removeIngredient = (id: string) => setIngredients(ingredients.filter(i => i.id !== id));
  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSaveDailyConfig = () => {
    if (onSaveDailyCost) {
      setIsSaving(true);
      const safeDailyCost = isNaN(dailyCostPerAnimal) ? 0 : dailyCostPerAnimal;
      
      const config: CalculatorConfig = {
        rentCost: Number(effectiveRentCost) || 0,
        rentMode,
        rentPerAnimal: Number(rentPerAnimal) || 0,
        suppCostMonthly: Number(suppCostMonthly) || 0,
        extraCostMonthly: Number(extraCostMonthly) || 0,
        totalAnimalsDaily: Number(totalAnimalsDaily) || 1,
        gmdDailyVal: Number(gmdDailyVal) || 0,
        ingredients,
        avgLotWeight: Number(avgLotWeight) || 0,
        numAnimals: Number(numAnimals) || 1,
        pvPercent: Number(pvPercent) || 0,
        isMineralSalt,
        mineralPriceTotal,
        mineralBagWeight,
        mineralConsumptionGrams,
        predQty: Number(predQty) || 50,
        predEntryWeight: Number(predEntryWeight) || 330,
        predBuyPrice: Number(predBuyPrice) || 250,
        predTargetMode,
        predExitWeight: Number(predExitWeight) || 537,
        predCarcassYield: Number(predCarcassYield) || 52,
        predSellPrice: Number(predSellPrice) || 240,
        predDailyRate: Number(predDailyRate) || 8.532,
        predGmd: Number(predGmd) || 1.15,
        predDays: Number(predDays) || 180,
      };
      
      onSaveDailyCost(safeDailyCost, targetLotId || undefined, config);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setShowSaveSuccess(false);
      }, 3000);
    }
  };

  const handleSaveSupplementation = () => {
    if (!isMineralSalt && totalPercent > 100) return;
    setIsSaving(true);
    
    setSuppCostMonthly(totalMonthlyCostSupp);
    setTotalAnimalsDaily(numAnimals);
    const individualDailyCost = consumptionPerAnimalKg * costPerKgSupplement;
    const safeDailyCost = isNaN(individualDailyCost) ? 0 : individualDailyCost;

    if (onSaveDailyCost) {
      const config: CalculatorConfig = {
        rentCost: Number(effectiveRentCost) || 0,
        rentMode,
        rentPerAnimal: Number(rentPerAnimal) || 0,
        suppCostMonthly: totalMonthlyCostSupp,
        extraCostMonthly: Number(extraCostMonthly) || 0,
        totalAnimalsDaily: numAnimals,
        gmdDailyVal: Number(gmdDailyVal) || 0,
        ingredients,
        avgLotWeight: Number(avgLotWeight) || 0,
        numAnimals: Number(numAnimals) || 1,
        pvPercent: Number(pvPercent) || 0,
        isMineralSalt,
        mineralPriceTotal,
        mineralBagWeight,
        mineralConsumptionGrams,
        predQty: Number(predQty) || 50,
        predEntryWeight: Number(predEntryWeight) || 330,
        predBuyPrice: Number(predBuyPrice) || 250,
        predTargetMode,
        predExitWeight: Number(predExitWeight) || 537,
        predCarcassYield: Number(predCarcassYield) || 52,
        predSellPrice: Number(predSellPrice) || 240,
        predDailyRate: Number(predDailyRate) || 8.532,
        predGmd: Number(predGmd) || 1.15,
        predDays: Number(predDays) || 180,
      };
      onSaveDailyCost(safeDailyCost, targetLotId || undefined, config);
    }
    setShowSaveSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(false);
    }, 3000);
  };

  const handleSavePrediction = () => {
    setIsSaving(true);
    if (onSaveDailyCost) {
      // Use the current simulator daily rate as the daily cost
      const safeDailyCost = Number(predDailyRate) || 0;

      const config: CalculatorConfig = {
        rentCost: Number(effectiveRentCost) || 0,
        rentMode,
        rentPerAnimal: Number(rentPerAnimal) || 0,
        suppCostMonthly: Number(suppCostMonthly) || 0,
        extraCostMonthly: Number(extraCostMonthly) || 0,
        totalAnimalsDaily: Number(totalAnimalsDaily) || 1,
        gmdDailyVal: Number(gmdDailyVal) || 0,
        ingredients,
        avgLotWeight: Number(avgLotWeight) || 0,
        numAnimals: Number(numAnimals) || 1,
        pvPercent: Number(pvPercent) || 0,
        isMineralSalt,
        mineralPriceTotal,
        mineralBagWeight,
        mineralConsumptionGrams,
        predQty: Number(predQty) || 50,
        predEntryWeight: Number(predEntryWeight) || 330,
        predBuyPrice: Number(predBuyPrice) || 250,
        predTargetMode,
        predExitWeight: Number(predExitWeight) || 537,
        predCarcassYield: Number(predCarcassYield) || 52,
        predSellPrice: Number(predSellPrice) || 240,
        predDailyRate,
        predGmd: Number(predGmd) || 1.15,
        predDays: Number(predDays) || 180,
      };
      onSaveDailyCost(safeDailyCost, targetLotId || undefined, config);
    }
    setShowSaveSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug flex items-center gap-2.5">
            {activeTab === 'daily_value' && 'Valor da Diária'}
            {activeTab === 'diet' && 'Suplementação'}
            {activeTab === 'prediction' && 'Simulador de Lucro'}
          </h2>
          <p className="text-[#64766C] text-[13px] leading-normal mt-1">
            {activeTab === 'daily_value' && 'Calcule o custo da diária por animal'}
            {activeTab === 'diet' && 'Manejo nutricional e composição de mistura'}
            {activeTab === 'prediction' && 'Projeção de rentabilidade do ciclo'}
          </p>
        </div>
        
        <div className="inline-flex bg-[#DCEDE4] text-[#145C46] rounded-lg px-3.5 py-2 text-xs font-medium self-start md:self-auto">
          {activeTab === 'daily_value' && 'Painel de Custos'}
          {activeTab === 'diet' && 'Painel Nutricional'}
          {activeTab === 'prediction' && 'Calculadora de Ciclo'}
        </div>
      </div>

      {activeTab === 'daily_value' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-8 space-y-6">
            <div className="agro-card overflow-hidden p-6 md:p-7">
               <h3 className="text-lg font-semibold text-[#20332C] leading-snug mb-6 flex items-center gap-2">
                 <DollarSign size={20} className="text-[#145C46]" /> Custos Mensais
               </h3>
               <div className="space-y-5">
                  {/* Arrendamento / Custo de Oportunidade */}
                  <div className="space-y-3 bg-[#F6F8F5] p-5 rounded-xl border border-[#E3EAE6]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <label className="text-xs font-medium text-[#20332C] flex items-center gap-1.5">
                        <Building2 size={15} className="text-[#145C46]" />
                        Arrendamento / Custo de Oportunidade
                      </label>
                      
                      {/* Alternador: Total ou Por Animal */}
                      <div className="flex bg-[#E3EAE6] rounded-lg p-0.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (rentMode !== 'total') {
                              setRentMode('total');
                              if (rentPerAnimal > 0 && totalAnimalsDaily > 0) {
                                setRentCost(Number((rentPerAnimal * totalAnimalsDaily).toFixed(2)));
                              }
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            rentMode === 'total'
                              ? 'bg-white text-[#145C46] shadow-2xs'
                              : 'text-[#64766C] hover:text-[#20332C]'
                          }`}
                        >
                          Valor Total
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (rentMode !== 'per_animal') {
                              setRentMode('per_animal');
                              if (rentCost > 0 && totalAnimalsDaily > 0) {
                                setRentPerAnimal(Number((rentCost / totalAnimalsDaily).toFixed(2)));
                              }
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            rentMode === 'per_animal'
                              ? 'bg-white text-[#145C46] shadow-2xs'
                              : 'text-[#64766C] hover:text-[#20332C]'
                          }`}
                        >
                          Valor por Animal
                        </button>
                      </div>
                    </div>

                    {rentMode === 'total' ? (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64766C] font-medium text-sm">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            onFocus={handleFocus} 
                            className="w-full border border-[#E3EAE6] rounded-lg pl-11 pr-28 py-2.5 font-semibold text-base text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                            value={rentCost || ''} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              setRentCost(val);
                              if (totalAnimalsDaily > 0) {
                                setRentPerAnimal(Number((val / totalAnimalsDaily).toFixed(2)));
                              }
                            }} 
                            placeholder="0,00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-normal text-[#64766C]">R$/mês total</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#64766C] font-normal px-1">
                          <span>Equivalente por animal:</span>
                          <span className="font-semibold text-[#20332C] font-nums">
                            R$ {(totalAnimalsDaily > 0 ? (rentCost / totalAnimalsDaily) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /cab/mês ({totalAnimalsDaily} animais)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#145C46] font-medium text-sm">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            onFocus={handleFocus} 
                            className="w-full border border-[#218568]/50 rounded-lg pl-11 pr-32 py-2.5 font-semibold text-base text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                            value={rentPerAnimal || ''} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              setRentPerAnimal(val);
                              setRentCost(Number((val * (totalAnimalsDaily || 0)).toFixed(2)));
                            }} 
                            placeholder="0,00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#145C46]">R$/cab/mês</span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-[#DCEDE4]/60 p-2.5 rounded-lg border border-[#DCEDE4] text-[#20332C] font-normal">
                          <span className="flex items-center gap-1.5">
                            <Calculator size={13} className="text-[#145C46]" />
                            Total calculado (R$ {Number(rentPerAnimal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {totalAnimalsDaily} animais):
                          </span>
                          <span className="font-semibold text-[#145C46] font-nums">
                            R$ {((Number(rentPerAnimal || 0)) * (Number(totalAnimalsDaily || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mês
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#64766C] block">Suplementação (R$/mês)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" value={suppCostMonthly} onChange={e => setSuppCostMonthly(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#64766C] block">Extras (R$/mês)</label>
                    <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" value={extraCostMonthly} onChange={e => setExtraCostMonthly(Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#64766C] block">Total de animais</label>
                        <input 
                          type="number" 
                          onFocus={handleFocus} 
                          className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                          value={totalAnimalsDaily} 
                          onChange={e => {
                            const newTotal = Number(e.target.value);
                            setTotalAnimalsDaily(newTotal);
                            if (rentMode === 'per_animal') {
                              setRentCost(Number((rentPerAnimal * newTotal).toFixed(2)));
                            }
                          }} 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#64766C] block">GMD (kg/animal)</label>
                        <input type="number" step="0.1" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" value={gmdDailyVal} onChange={e => setGmdDailyVal(Number(e.target.value))} />
                    </div>
                  </div>
                  
                  <div className="bg-[#F6F8F5] p-5 rounded-xl border border-[#E3EAE6] space-y-2.5">
                    <label className="text-xs font-medium text-[#20332C] flex items-center gap-2">
                        <LayersIcon size={16} className="text-[#145C46]" /> Onde deseja salvar este custo?
                    </label>
                    <select 
                        className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-medium text-sm text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] transition-all cursor-pointer"
                        value={targetLotId}
                        onChange={(e) => setTargetLotId(e.target.value)}
                    >
                        <option value="">Geral (Toda a Fazenda)</option>
                        {lots.map(lot => (
                            <option key={lot.id} value={lot.id}>Aplicar apenas no Lote: {lot.name}</option>
                        ))}
                    </select>
                  </div>

                  <button 
                    type="button"
                    onClick={handleSaveDailyConfig} 
                    disabled={isSaving}
                    className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-[#145C46] hover:bg-[#0E4434]'} text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    {isSaving ? (
                      <>
                        <Clock className="animate-spin" size={18} /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Salvar Configuração
                      </>
                    )}
                  </button>
                  {showSaveSuccess && (
                    <div className="bg-[#DCEDE4] text-[#145C46] p-3 rounded-lg flex items-center justify-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle size={18} />
                      <span className="text-xs font-semibold">Configuração salva com sucesso!</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="agro-card p-6 space-y-5 h-full flex flex-col">
                <h4 className="text-lg font-semibold text-[#20332C] leading-snug flex items-center gap-2"><Target size={18} className="text-[#145C46]" /> Resultados</h4>
                <div className="space-y-3.5">
                   <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6]">
                      <p className="text-xs font-medium text-[#64766C] mb-1">Custo total mensal</p>
                      <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">R$ {totalMonthlyFinance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                   <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6]">
                      <p className="text-xs font-medium text-[#64766C] mb-1">Custo mensal / animal</p>
                      <p className="text-2xl font-semibold text-[#145C46] leading-tight font-nums">R$ {monthlyCostPerAnimal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                   <div className="bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#DCEDE4]">
                      <p className="text-xs font-medium text-[#145C46] mb-1">Custo diário / animal</p>
                      <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums mb-3">R$ {dailyCostPerAnimal.toLocaleString('pt-BR', {minimumFractionDigits: 3})}</p>
                      <button
                         type="button"
                         onClick={() => {
                            const cost = isNaN(dailyCostPerAnimal) || !isFinite(dailyCostPerAnimal) ? 0 : dailyCostPerAnimal;
                            setPredDailyRate(Number(cost.toFixed(3)));
                            setActiveTab('prediction');
                         }}
                         className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                         <Zap size={15} /> Enviar Diária p/ Simulação
                      </button>
                   </div>
                   <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6]">
                      <p className="text-xs font-medium text-[#64766C] mb-1">Arroba produzida</p>
                      <p className="text-2xl font-semibold text-[#145C46] leading-tight font-nums">R$ {costPerArrobaProduced.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   </div>
                   <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#64766C] mb-1">Tempo para +30 kg (1@)</p>
                        <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">{daysPerArroba.toFixed(1)}<span className="text-sm font-normal text-[#64766C] ml-1">dias</span></p>
                      </div>
                      <div className="p-2.5 bg-white border border-[#E3EAE6] text-[#145C46] rounded-lg"><Clock size={20} /></div>
                   </div>
                </div>
                {showSaveSuccess && <div className="bg-[#145C46] text-white p-3 rounded-lg flex items-center justify-center gap-2"><CheckCircle size={16} /> <span className="text-xs font-semibold">Sincronizado</span></div>}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'diet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
           <div className="lg:col-span-8 space-y-6">
              <div className="agro-card overflow-hidden">
                  <div className="px-6 py-4 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
                    <h3 className="text-base font-semibold text-[#20332C] leading-snug flex items-center gap-2">
                      <PieChartIcon className="text-[#145C46]" size={18} /> Composição {isMineralSalt ? 'do Sal Mineral' : 'da Mistura (100 kg)'}
                    </h3>
                    {!isMineralSalt && totalPercent > 100 && <div className="bg-rose-600 text-white text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5"><AlertCircle size={14} /> Excesso {totalPercent}%</div>}
                  </div>
                  <div className="p-6 md:p-7 space-y-6">
                    {/* Seletor do Tipo de Suplemento */}
                    <div className="bg-[#F6F8F5] p-3 rounded-xl border border-[#E3EAE6] flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-medium text-[#64766C] pl-1">Tipo de nutrição:</span>
                        <div className="flex bg-[#E3EAE6] rounded-lg p-1">
                            <button 
                              onClick={() => setIsMineralSalt(false)} 
                              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${!isMineralSalt ? 'bg-white shadow-2xs text-[#145C46]' : 'text-[#64766C] hover:text-[#20332C]'}`}
                            >
                              Mistura Customizada
                            </button>
                            <button 
                              onClick={() => setIsMineralSalt(true)} 
                              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${isMineralSalt ? 'bg-white shadow-2xs text-[#145C46]' : 'text-[#64766C] hover:text-[#20332C]'}`}
                            >
                              Sal Mineral
                            </button>
                        </div>
                    </div>

                    {isMineralSalt ? (
                      <div className="space-y-6 pt-1">
                        <div className="bg-[#F6F8F5] p-5 rounded-xl border border-[#E3EAE6] space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#DCEDE4] text-[#145C46] rounded-lg"><Coins size={18} /></div>
                              <div>
                                <h4 className="text-base font-semibold text-[#20332C] leading-snug">Configuração de Custo do Sal Mineral</h4>
                                <p className="text-xs text-[#64766C] font-normal mt-0.5">Insira o valor pago e o peso da embalagem para calcular o custo/kg</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#64766C] block">Valor do saco (R$)</label>
                                <div className="relative">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#64766C]">R$</span>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    onFocus={handleFocus} 
                                    className="w-full border border-[#E3EAE6] rounded-lg pl-9 pr-4 py-2.5 text-sm font-normal text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                                    value={mineralPriceTotal || ''} 
                                    onChange={e => setMineralPriceTotal(Number(e.target.value))} 
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#64766C] block">Peso do saco (kg)</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    onFocus={handleFocus} 
                                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                                    value={mineralBagWeight || ''} 
                                    onChange={e => setMineralBagWeight(Number(e.target.value))} 
                                  />
                                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-normal text-[#64766C]">kg</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 bg-[#DCEDE4]/60 rounded-xl border border-[#DCEDE4] flex justify-between items-center">
                              <div>
                                <p className="text-xs font-medium text-[#145C46] mb-1">Custo por kg pronto</p>
                                <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
                                  R$ {(mineralBagWeight > 0 ? (mineralPriceTotal / mineralBagWeight) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium text-[#64766C] mb-1">Status do sal</p>
                                <p className="text-xs font-semibold text-[#145C46] bg-white border border-[#DCEDE4] px-3 py-1 rounded-md inline-block">Saco Pronto</p>
                              </div>
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {ingredients.map(ing => (
                          <div key={ing.id} className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] relative group">
                              <div className="flex justify-between items-center mb-3">
                                  <input type="text" className="bg-transparent border-none p-0 text-sm font-semibold text-[#20332C] outline-none focus:ring-0 w-2/3" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} placeholder="Ingrediente..." />
                                  <button onClick={() => removeIngredient(ing.id)} className="text-rose-500 hover:text-rose-700 opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 size={16} /></button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-xs font-medium text-[#64766C] block">Percentual (%)</label>
                                      <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2 text-sm font-normal text-[#20332C] bg-white font-nums" value={ing.percent || ''} onChange={e => updateIngredient(ing.id, 'percent', Number(e.target.value))} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-medium text-[#64766C] block">Valor / kg (R$)</label>
                                      <input type="number" step="0.01" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2 text-sm font-normal text-[#20332C] bg-white font-nums" value={ing.priceKg || ''} onChange={e => updateIngredient(ing.id, 'priceKg', Number(e.target.value))} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-medium text-[#64766C] block">Custo na mistura</label>
                                      <div className="w-full bg-white border border-[#E3EAE6] rounded-lg px-3.5 py-2 text-sm font-medium text-[#64766C] font-nums">R$ {((ing.percent / 100) * ing.priceKg).toFixed(2)}</div>
                                  </div>
                              </div>
                          </div>
                        ))}
                        <button onClick={handleAddIngredient} className="w-full border border-dashed border-[#218568]/50 rounded-xl py-3 text-sm font-semibold text-[#145C46] hover:bg-[#E5F2EB] transition-all flex items-center justify-center gap-2 cursor-pointer"><Plus size={18} /> Adicionar Ingrediente</button>
                        <div className="mt-6 p-5 bg-[#DCEDE4]/60 rounded-xl border border-[#DCEDE4] flex justify-between items-center">
                            <div>
                                <p className="text-xs font-medium text-[#145C46] mb-1">Custo do kg pronto</p>
                                <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">R$ {costPerKgSupplement.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                 <p className="text-xs font-medium text-[#64766C] mb-1">Total</p>
                                 <p className={`text-2xl font-semibold font-nums ${totalPercent === 100 ? 'text-[#145C46]' : 'text-rose-600'}`}>{totalPercent}%</p>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>

              {/* Calculadora de Proporções */}
              {isMineralSalt ? (
                  <div className="agro-card p-8 flex flex-col items-center justify-center text-center space-y-2.5">
                      <div className="p-3.5 bg-[#DCEDE4] text-[#145C46] rounded-full">
                          <Calculator size={28} />
                      </div>
                      <h4 className="text-base font-semibold text-[#20332C]">Mistura Pronta para Uso Comercial</h4>
                      <p className="text-[13px] text-[#64766C] max-w-md leading-relaxed">
                          O Sal Mineral é fornecido de forma direta e pronta ao cocho. Não há necessidade de balanceamento de ingredientes ou proporções de batida adicional.
                      </p>
                  </div>
              ) : (
                  <div className="agro-card overflow-hidden">
                      <div className="px-6 py-4 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
                          <h3 className="text-base font-semibold text-[#20332C] leading-snug flex items-center gap-2">
                              <Calculator size={18} className="text-[#145C46]" /> Calculadora de Proporções (Misturador)
                          </h3>
                      </div>
                      <div className="p-6 md:p-7 space-y-6">
                          <p className="text-[13px] text-[#64766C] font-normal leading-normal">
                              Insira o peso desejado em qualquer campo para recalcular os demais mantendo as proporções.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {ingredients.map(ing => (
                                  <div key={`calc-${ing.id}`} className="flex items-center gap-4 p-3.5 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-[#20332C] truncate">{ing.name || 'Ingrediente'}</p>
                                          <p className="text-xs font-semibold text-[#145C46] font-nums mt-0.5">{ing.percent}%</p>
                                      </div>
                                      <div className="w-32 relative">
                                          <input 
                                              type="number" 
                                              className={`w-full border rounded-lg pl-3.5 pr-10 py-2 font-semibold text-sm text-right font-nums outline-none transition-all ${calcInput.id === ing.id ? 'border-[#145C46] ring-2 ring-[#DCEDE4] bg-white text-[#20332C]' : 'border-[#E3EAE6] bg-white text-[#20332C]'}`}
                                              value={calcInput.id === ing.id ? calcInput.value : Number(getWeight(ing.id).toFixed(2))}
                                              onChange={(e) => setCalcInput({ id: ing.id, value: Number(e.target.value) })}
                                              onFocus={handleFocus}
                                          />
                                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-normal text-[#64766C] pointer-events-none">kg</span>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="pt-5 border-t border-[#E3EAE6] flex flex-col md:flex-row justify-between items-center gap-5">
                              <div className="flex items-center gap-3">
                                  <div className="p-3 bg-[#145C46] text-white rounded-xl shadow-xs">
                                      <Weight size={20} />
                                  </div>
                                  <div>
                                      <p className="text-xs font-medium text-[#64766C]">Peso total da batida</p>
                                      <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums mt-0.5">
                                          {getTotalWeight().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-sm font-normal text-[#64766C] ml-1">kg</span>
                                      </p>
                                  </div>
                              </div>
                              <div className="w-full md:w-48 relative">
                                  <label className="text-xs font-medium text-[#145C46] block mb-1">Ajustar total</label>
                                  <input 
                                      type="number" 
                                      className={`w-full border rounded-lg pl-3.5 pr-10 py-2.5 font-semibold text-sm text-right font-nums outline-none transition-all ${calcInput.id === 'total' ? 'border-[#145C46] ring-2 ring-[#DCEDE4] bg-white text-[#20332C]' : 'border-[#E3EAE6] bg-[#F6F8F5] text-[#20332C]'}`}
                                      value={calcInput.id === 'total' ? calcInput.value : Number(getTotalWeight().toFixed(2))}
                                      onChange={(e) => setCalcInput({ id: 'total', value: Number(e.target.value) })}
                                      onFocus={handleFocus}
                                  />
                                  <span className="absolute right-3.5 bottom-2.5 text-xs font-normal text-[#64766C] pointer-events-none">kg</span>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
           </div>
           <div className="lg:col-span-4 space-y-6">
              <div className="agro-card p-6 space-y-6 flex flex-col h-full">
                 <h4 className="text-lg font-semibold text-[#20332C] leading-snug flex items-center gap-2"><TrendingUp className="text-[#145C46]" size={18} /> Consumo do Lote</h4>
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-medium text-[#64766C] block">Peso médio (kg)</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" value={avgLotWeight} onChange={e => setAvgLotWeight(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-medium text-[#64766C] block">Total de animais</label>
                       <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" value={numAnimals} onChange={e => setNumAnimals(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                       {isMineralSalt ? (
                          <label className="text-xs font-medium text-[#64766C] block">Consumo por cabeça (g/dia)</label>
                       ) : (
                          <label className="text-xs font-medium text-[#64766C] block">% do peso vivo</label>
                       )}
                       {isMineralSalt ? (
                          <div className="relative">
                             <input 
                                type="number" 
                                onFocus={handleFocus} 
                                className="w-full border border-[#E3EAE6] rounded-lg pl-4 pr-10 py-2.5 font-normal text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46] font-nums transition-all" 
                                value={mineralConsumptionGrams || ''} 
                                onChange={e => setMineralConsumptionGrams(Number(e.target.value))} 
                             />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-normal text-[#64766C]">g</span>
                          </div>
                       ) : (
                          <select className="w-full border border-[#E3EAE6] rounded-lg px-4 py-2.5 font-medium text-sm text-[#20332C] bg-[#F6F8F5] cursor-pointer outline-none focus:ring-2 focus:ring-[#145C46]" value={pvPercent} onChange={e => setPvPercent(Number(e.target.value))}>
                            <option value={0.1}>0.1% do PV</option>
                            <option value={0.2}>0.2% do PV</option>
                            <option value={0.3}>0.3% do PV</option>
                            <option value={0.5}>0.5% do PV</option>
                            <option value={1.0}>1.0% do PV</option>
                          </select>
                       )}
                    </div>
                 </div>
                 <div className="space-y-3.5 flex-1">
                    <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex flex-col">
                        <p className="text-xs font-medium text-[#64766C] mb-1">Consumo / animal</p>
                        <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">
                            {isMineralSalt ? (mineralConsumptionGrams / 1000).toFixed(3) : consumptionPerAnimalKg.toFixed(2)}<span className="text-sm font-normal text-[#64766C] ml-1">kg/dia</span>
                            {isMineralSalt && <span className="text-xs font-normal text-[#64766C] block mt-1">({mineralConsumptionGrams} g/dia)</span>}
                        </p>
                    </div>
                    <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex flex-col">
                        <p className="text-xs font-medium text-[#64766C] mb-1">Consumo total do lote</p>
                        <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">{totalBatchConsumption.toFixed(2)}<span className="text-sm font-normal text-[#64766C] ml-1">kg/dia</span></p>
                    </div>
                    <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex flex-col">
                        <p className="text-xs font-medium text-[#64766C] mb-1">Consumo mensal do lote</p>
                        <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">{totalMonthlyConsumptionKg.toFixed(2)}<span className="text-sm font-normal text-[#64766C] ml-1">kg/mês</span></p>
                    </div>
                    <div className="bg-[#DCEDE4]/60 p-4 rounded-xl border border-[#DCEDE4] flex flex-col">
                        <p className="text-xs font-medium text-[#145C46] mb-1">Custo por dia</p>
                        <p className="text-2xl font-semibold text-[#145C46] leading-tight font-nums">R$ {totalDailyCostSupp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex flex-col">
                        <p className="text-xs font-medium text-[#64766C] mb-1">Custo mensal</p>
                        <p className="text-2xl font-semibold text-[#20332C] leading-tight font-nums">R$ {totalMonthlyCostSupp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
                 
                 <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6]">
                    <label className="text-xs font-medium text-[#64766C] mb-1.5 block">Salvar diária para qual lote?</label>
                    <select 
                        className="w-full border border-[#E3EAE6] rounded-lg px-3 py-2 text-sm font-medium text-[#20332C] bg-white outline-none focus:ring-2 focus:ring-[#145C46]"
                        value={targetLotId}
                        onChange={(e) => setTargetLotId(e.target.value)}
                    >
                        <option value="">Geral</option>
                        {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                 </div>

                 <button 
                    type="button"
                    onClick={handleSaveSupplementation} 
                    disabled={(!isMineralSalt && totalPercent > 100) || isSaving} 
                    className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-[#145C46] hover:bg-[#0E4434]'} text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    {isSaving ? (
                      <>
                        <Clock className="animate-spin" size={18} /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Salvar Configuração
                      </>
                    )}
                 </button>
                 {showSaveSuccess && (
                    <div className="bg-[#DCEDE4] text-[#145C46] p-3 rounded-lg flex items-center justify-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle size={18} />
                      <span className="text-xs font-semibold">Configuração salva com sucesso!</span>
                    </div>
                  )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'prediction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Main Form Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="agro-card overflow-hidden">
                <div className="px-6 py-4 bg-[#F6F8F5] border-b border-[#E3EAE6] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#20332C] flex items-center gap-2.5 text-base leading-snug">
                        <Activity className="text-[#145C46]" size={20} /> Variáveis de Entrada
                    </h3>
                    <div className="flex bg-[#E3EAE6] rounded-lg p-1 self-start md:self-auto">
                        <button onClick={() => setPredTargetMode('final_weight')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${predTargetMode === 'final_weight' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C] hover:text-[#20332C]'}`}>Objetivo: Peso</button>
                        <button onClick={() => setPredTargetMode('gmd')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${predTargetMode === 'gmd' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C] hover:text-[#20332C]'}`}>Objetivo: GMD</button>
                        <button onClick={() => setPredTargetMode('days')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${predTargetMode === 'days' ? 'bg-[#145C46] text-white shadow-2xs' : 'text-[#64766C] hover:text-[#20332C]'}`}>Objetivo: Dias</button>
                    </div>
                </div>

                <div className="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-7">
                    {/* Investimento */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-[#20332C] border-b border-[#E3EAE6] pb-2">Investimento</h4>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#64766C] block">Qtd. cabeças</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predQty} onChange={e => setPredQty(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#64766C] block">Peso compra (kg)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predEntryWeight} onChange={e => setPredEntryWeight(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                                <label className="text-xs font-medium text-[#64766C] block">Compra (R$/@)</label>
                                <button
                                  type="button"
                                  onClick={() => setPredBuyPrice(scotQuote.boiGordoVista)}
                                  className="text-xs font-medium text-[#145C46] hover:underline flex items-center gap-1 cursor-pointer"
                                  title={`Usar Cotação Scot ${scotQuote.state}`}
                                >
                                  <Building2 size={12} /> Scot {scotQuote.state}: R$ {scotQuote.boiGordoVista}
                                </button>
                            </div>
                            <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predBuyPrice} onChange={e => setPredBuyPrice(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Manejo Técnico */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-[#20332C] border-b border-[#E3EAE6] pb-2">Manejo Técnico</h4>
                        <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-[#64766C] block">GMD (kg/dia)</label>
                              {predTargetMode === 'gmd' && <span className="text-xs font-medium text-[#145C46]">Calculado</span>}
                            </div>
                            <input type="number" step="0.01" onFocus={handleFocus} className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-nums outline-none transition-all ${predTargetMode === 'gmd' ? 'bg-[#DCEDE4]/50 border-[#218568]/50 font-semibold text-[#145C46]' : 'border-[#E3EAE6] bg-[#F6F8F5] font-normal text-[#20332C] focus:bg-white focus:ring-2 focus:ring-[#145C46]'}`} value={predTargetMode === 'gmd' ? calculatedGmd.toFixed(3) : predGmd} onChange={e => setPredGmd(Number(e.target.value))} readOnly={predTargetMode === 'gmd'} />
                        </div>
                        <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-[#64766C] block">Duração (dias)</label>
                              {predTargetMode === 'days' && <span className="text-xs font-medium text-[#145C46]">Calculado</span>}
                            </div>
                            <input type="number" onFocus={handleFocus} className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-nums outline-none transition-all ${predTargetMode === 'days' ? 'bg-[#DCEDE4]/50 border-[#218568]/50 font-semibold text-[#145C46]' : 'border-[#E3EAE6] bg-[#F6F8F5] font-normal text-[#20332C] focus:bg-white focus:ring-2 focus:ring-[#145C46]'}`} value={predTargetMode === 'days' ? Math.round(calculatedDays) : predDays} onChange={e => setPredDays(Number(e.target.value))} readOnly={predTargetMode === 'days'} />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#64766C] block">Valor da diária (R$/dia)</label>
                                <input type="number" step="0.01" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predDailyRate} onChange={e => setPredDailyRate(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1">
                                <label className="hidden">Oper. R$/dia</label>
                                <input type="hidden" value={0} />
                            </div>
                        </div>
                    </div>

                    {/* Mercado Saída */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-[#20332C] border-b border-[#E3EAE6] pb-2">Mercado de Saída</h4>
                        <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-[#64766C] block">Peso final (kg)</label>
                              {predTargetMode === 'final_weight' && <span className="text-xs font-medium text-[#145C46]">Calculado</span>}
                            </div>
                            <input type="number" onFocus={handleFocus} className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-nums outline-none transition-all ${predTargetMode === 'final_weight' ? 'bg-[#DCEDE4]/50 border-[#218568]/50 font-semibold text-[#145C46]' : 'border-[#E3EAE6] bg-[#F6F8F5] font-normal text-[#20332C] focus:bg-white focus:ring-2 focus:ring-[#145C46]'}`} value={predTargetMode === 'final_weight' ? calculatedFinalWeight.toFixed(1) : predExitWeight} onChange={e => setPredExitWeight(Number(e.target.value))} readOnly={predTargetMode === 'final_weight'} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#64766C] block">Rendimento (%)</label>
                            <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predCarcassYield} onChange={e => setPredCarcassYield(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                                <label className="text-xs font-medium text-[#64766C] block">Venda (R$/@)</label>
                                <button
                                  type="button"
                                  onClick={() => setPredSellPrice(scotQuote.boiGordoVista)}
                                  className="text-xs font-medium text-[#145C46] hover:underline flex items-center gap-1 cursor-pointer"
                                  title={`Usar Cotação Scot ${scotQuote.state}`}
                                >
                                  <Building2 size={12} /> Scot {scotQuote.state}: R$ {scotQuote.boiGordoVista}
                                </button>
                            </div>
                            <input type="number" onFocus={handleFocus} className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#145C46] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none font-nums transition-all" value={predSellPrice} onChange={e => setPredSellPrice(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Summary Card */}
            <div className="bg-[#DCEDE4]/70 border border-[#DCEDE4] p-6 rounded-xl text-[#20332C] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center md:text-left">
                    <p className="text-[#145C46] text-xs font-medium">Resumo do ciclo</p>
                    <h4 className="text-lg font-semibold leading-snug text-[#20332C] font-nums">
                        Ciclo de <span className="text-[#145C46]">{Math.round(calculatedDays)} dias</span> para atingir <span className="text-[#145C46]">{calculatedFinalWeight.toFixed(1)} kg</span> de peso vivo.
                    </h4>
                    <p className="text-sm text-[#64766C] font-normal font-nums">Equivale a {(arrobasUnit).toFixed(2)} @ de carcaça disponível.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E3EAE6] text-center min-w-[150px] shrink-0">
                    <p className="text-xs font-medium text-[#64766C] mb-1">GMD projetado</p>
                    <p className="text-2xl font-semibold text-[#145C46] leading-tight font-nums">{(predTargetMode === 'gmd' ? calculatedGmd : predGmd).toFixed(3)}</p>
                    <p className="text-xs font-normal text-[#64766C] mt-1">kg/dia</p>
                </div>
            </div>

            {/* Action Bar/Save Button */}
            <div className="agro-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[13px] text-[#64766C] font-normal leading-normal max-w-md">
                Os dados inseridos no simulador ficarão salvos e mantidos até você editá-los novamente.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSavePrediction}
                  disabled={isSaving}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 ${isSaving ? 'bg-slate-400' : 'bg-[#145C46] hover:bg-[#0E4434]'} text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs active:scale-95 transition-all cursor-pointer`}
                >
                  {isSaving ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Save size={16} /> Salvar Simulação
                    </>
                  )}
                </button>
                {showSaveSuccess && (
                  <div className="bg-[#DCEDE4] text-[#145C46] font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 text-xs animate-in fade-in duration-200">
                    <CheckCircle size={15} /> Salvo!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right DRE Card */}
          <div className="lg:col-span-4 h-full">
            <div className="agro-card p-6 md:p-7 flex flex-col h-full space-y-6">
               <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-base font-semibold text-[#20332C]">DRE Projetado (Ciclo)</h4>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${netProfitTotal >= 0 ? 'bg-[#DCEDE4] text-[#145C46]' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {netProfitTotal >= 0 ? 'Lucro Projetado' : 'Prejuízo Projetado'}
                    </span>
                  </div>
                  <p className={`text-3xl font-semibold leading-tight font-nums ${netProfitTotal >= 0 ? 'text-[#145C46]' : 'text-rose-600'}`}>
                    {netProfitTotal < 0 ? '- ' : ''}R$ {Math.abs(netProfitTotal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-[#F6F8F5] p-3.5 rounded-xl border border-[#E3EAE6]">
                        <span className="text-xs text-[#64766C] font-medium block mb-1">Rentab. mensal</span>
                        <span className="text-lg font-semibold text-[#20332C] font-nums">{monthlyRoi.toFixed(2)}%<span className="text-xs font-normal text-[#64766C] ml-1">/mês</span></span>
                    </div>
                    <div className="bg-[#F6F8F5] p-3.5 rounded-xl border border-[#E3EAE6]">
                        <span className="text-xs text-[#64766C] font-medium block mb-1">ROI total</span>
                        <span className="text-lg font-semibold text-[#20332C] font-nums">{roiTotal.toFixed(1)}%</span>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-[#64766C] border-b border-[#E3EAE6] pb-2">Composição de custos</h5>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#64766C] font-normal">Compra (Animal):</span>
                            <span className="font-semibold text-[#20332C] font-nums">R$ {(costAnimalUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#64766C] font-normal">Valor da Diária:</span>
                            <span className="font-semibold text-rose-600 font-nums">R$ {(costNutritionUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#64766C] font-normal hidden">Operacional (Fixo):</span>
                            <span className="font-semibold text-rose-600 hidden font-nums">R$ {(costOperationUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E3EAE6] space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-medium text-[#64766C]">Desembolso total:</span>
                        <span className="text-xl font-semibold text-[#20332C] font-nums">R$ {(desembolsoTotalUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-medium text-[#145C46]">Receita bruta venda:</span>
                        <span className="text-xl font-semibold text-[#145C46] font-nums">R$ {(receitaBrutaUnit * predQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] flex justify-between items-center mt-auto">
                    <div>
                        <span className="text-xs font-medium text-[#64766C] block mb-0.5">Ponto de equilíbrio</span>
                        <p className="text-xl font-semibold text-[#20332C] font-nums">R$ {breakEven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs font-normal text-[#64766C] ml-1">/@</span></p>
                    </div>
                    <div className="p-2.5 bg-white border border-[#E3EAE6] text-[#145C46] rounded-lg">
                        <TrendingUp size={20} />
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
