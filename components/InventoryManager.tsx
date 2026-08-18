import React, { useState, useMemo } from 'react';
import { InventoryItem, Lot, StockMovement } from '../types';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Tag, 
  Layers, 
  CheckCircle2, 
  History, 
  Trash2, 
  Edit3, 
  ShoppingCart, 
  AlertCircle, 
  Warehouse, 
  ShieldAlert,
  ArrowRight,
  Filter,
  X,
  Sparkles
} from 'lucide-react';

interface FinancialExpensePayload {
  amount: number;
  description?: string;
  date?: string;
  category?: string;
}

interface InventoryManagerProps {
  inventory: InventoryItem[];
  lots?: Lot[];
  onAddStock: (item: InventoryItem, financialExpense?: FinancialExpensePayload) => void;
  onUpdateStock: (item: InventoryItem, financialExpense?: FinancialExpensePayload) => void;
  onConsumeStock?: (itemId: string, consumedQuantity: number, details?: { date?: string; notes?: string; lotId?: string }) => void;
  onDeleteStock?: (itemId: string) => void;
  onChangeView?: (view: string) => void;
}

const CATEGORIES = [
  'Ração',
  'Suplemento',
  'Medicamento',
  'Pastagem',
  'Equipamento',
  'Combustível',
  'Outro'
];

const UNITS = [
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'sacos', label: 'Sacos (sc)' },
  { value: 'sacos 25kg', label: 'Sacos de 25kg' },
  { value: 'sacos 30kg', label: 'Sacos de 30kg' },
  { value: 'sacos 50kg', label: 'Sacos de 50kg' },
  { value: 'doses', label: 'Doses / Frascos' },
  { value: 'litros', label: 'Litros (L)' },
  { value: 'toneladas', label: 'Toneladas (t)' },
  { value: 'fardos', label: 'Fardos' },
  { value: 'unidades', label: 'Unidades (un)' },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  inventory = [], 
  lots = [],
  onAddStock, 
  onUpdateStock,
  onConsumeStock,
  onDeleteStock,
  onChangeView
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Active items for modals
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);

  // Alert Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Item Form State (New or Edit)
  const initialFormState = {
    id: '',
    name: '',
    category: 'Ração',
    quantity: 0,
    minQuantity: 10,
    unit: 'sacos',
    unitCost: 0,
    totalCost: 0,
    launchExpense: true,
    expenseDate: new Date().toISOString().split('T')[0],
    expenseCategory: 'Nutrição'
  };
  const [itemForm, setItemForm] = useState(initialFormState);

  // Consumption Form State
  const initialConsumeState = {
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    lotId: '',
    notes: 'Consumo diário / rotina'
  };
  const [consumeForm, setConsumeForm] = useState(initialConsumeState);

  // New Purchase / Stock Entry Form State
  const initialEntryState = {
    quantity: 0,
    unitCost: 0,
    totalCost: 0,
    date: new Date().toISOString().split('T')[0],
    launchExpense: true,
    notes: 'Compra de reposição'
  };
  const [entryForm, setEntryForm] = useState(initialEntryState);

  // KPI Calculations
  const totalStockItemsCount = inventory.length;
  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQuantity);
  }, [inventory]);

  const totalLowStockCount = lowStockItems.length;

  // Filtered List
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || item.quantity <= item.minQuantity;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [inventory, searchTerm, selectedCategory, onlyLowStock]);

  // Open New Item Modal
  const handleOpenNewItem = () => {
    setItemForm({
      ...initialFormState,
      id: '',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item: InventoryItem) => {
    const totalCost = Number((item.quantity * item.unitCost).toFixed(2));
    setItemForm({
      id: item.id,
      name: item.name,
      category: item.category || 'Ração',
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      unitCost: item.unitCost,
      totalCost,
      launchExpense: false, // For edits default to false unless adding new
      expenseDate: new Date().toISOString().split('T')[0],
      expenseCategory: getSuggestedExpenseCategory(item.category)
    });
    setIsItemModalOpen(true);
  };

  // Helper for expense category
  const getSuggestedExpenseCategory = (cat: string) => {
    if (cat === 'Medicamento') return 'Sanidade';
    if (cat === 'Ração' || cat === 'Suplemento') return 'Nutrição';
    if (cat === 'Pastagem') return 'Pastagem/Manejo';
    if (cat === 'Combustível') return 'Combustível';
    if (cat === 'Equipamento') return 'Manutenção/Equipamentos';
    return 'Insumos e Estoque';
  };

  // Handle unitCost change with total sync
  const handleUnitCostChange = (val: number) => {
    const uCost = Math.max(0, val);
    const total = Number((itemForm.quantity * uCost).toFixed(2));
    setItemForm(prev => ({
      ...prev,
      unitCost: uCost,
      totalCost: total
    }));
  };

  // Handle totalCost change with unit cost sync
  const handleTotalCostChange = (val: number) => {
    const tCost = Math.max(0, val);
    const uCost = itemForm.quantity > 0 ? Number((tCost / itemForm.quantity).toFixed(2)) : 0;
    setItemForm(prev => ({
      ...prev,
      totalCost: tCost,
      unitCost: uCost
    }));
  };

  // Handle quantity change with total sync
  const handleQuantityChange = (qty: number) => {
    const q = Math.max(0, qty);
    const total = Number((q * itemForm.unitCost).toFixed(2));
    setItemForm(prev => ({
      ...prev,
      quantity: q,
      totalCost: total
    }));
  };

  // Save Item (New or Edit)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    const isNew = !itemForm.id;
    const finalId = itemForm.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const totalPurchaseCost = itemForm.totalCost > 0 ? itemForm.totalCost : Number((itemForm.quantity * itemForm.unitCost).toFixed(2));

    const itemData: InventoryItem = {
      id: finalId,
      name: itemForm.name.trim(),
      category: itemForm.category,
      quantity: itemForm.quantity,
      minQuantity: itemForm.minQuantity,
      unit: itemForm.unit,
      unitCost: itemForm.unitCost,
      totalCost: totalPurchaseCost,
      lastPurchaseDate: itemForm.expenseDate,
      history: isNew && itemForm.quantity > 0 ? [
        {
          id: `mov-${Date.now()}`,
          date: itemForm.expenseDate,
          type: 'entrada',
          quantity: itemForm.quantity,
          unitCost: itemForm.unitCost,
          totalCost: totalPurchaseCost,
          notes: 'Cadastro inicial de estoque'
        }
      ] : undefined
    };

    const financialExpense: FinancialExpensePayload | undefined = (itemForm.launchExpense && totalPurchaseCost > 0) ? {
      amount: totalPurchaseCost,
      description: `Compra de Insumo: ${itemData.name} (${itemData.quantity} ${itemData.unit})`,
      date: itemForm.expenseDate,
      category: itemForm.expenseCategory || getSuggestedExpenseCategory(itemData.category)
    } : undefined;

    if (isNew) {
      onAddStock(itemData, financialExpense);
      if (financialExpense) {
        showToast(`Item "${itemData.name}" cadastrado e despesa de R$ ${totalPurchaseCost.toFixed(2)} lançada no Financeiro!`, 'success');
      } else {
        showToast(`Item "${itemData.name}" cadastrado no estoque com sucesso!`, 'success');
      }
    } else {
      onUpdateStock(itemData, financialExpense);
      showToast(`Item "${itemData.name}" atualizado com sucesso!`, 'info');
    }

    if (itemData.quantity <= itemData.minQuantity) {
      setTimeout(() => {
        showToast(`⚠️ Alerta: "${itemData.name}" atingiu a quantidade mínima prevista (${itemData.quantity} ${itemData.unit}) e gerou notificação!`, 'warning');
      }, 500);
    }

    setIsItemModalOpen(false);
  };

  // Open Consume Modal
  const handleOpenConsume = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setConsumeForm({
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      lotId: lots[0]?.id || '',
      notes: 'Consumo no manejo diário'
    });
    setIsConsumeModalOpen(true);
  };

  // Confirm Consumption
  const handleConfirmConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction || consumeForm.quantity <= 0) return;

    const consumedAmount = consumeForm.quantity;
    const previousStock = selectedItemForAction.quantity;
    const newStock = Math.max(0, Number((previousStock - consumedAmount).toFixed(2)));

    if (onConsumeStock) {
      onConsumeStock(selectedItemForAction.id, consumedAmount, {
        date: consumeForm.date,
        notes: consumeForm.notes,
        lotId: consumeForm.lotId
      });
    } else {
      // Fallback if prop not direct
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: consumeForm.date,
        type: 'consumo',
        quantity: consumedAmount,
        unitCost: selectedItemForAction.unitCost,
        totalCost: Number((consumedAmount * selectedItemForAction.unitCost).toFixed(2)),
        notes: consumeForm.notes,
        lotId: consumeForm.lotId,
        lotName: lots.find(l => l.id === consumeForm.lotId)?.name
      };
      onUpdateStock({
        ...selectedItemForAction,
        quantity: newStock,
        history: [movement, ...(selectedItemForAction.history || [])]
      });
    }

    const costConsumed = consumedAmount * selectedItemForAction.unitCost;
    showToast(`Consumo de ${consumedAmount} ${selectedItemForAction.unit} registrado com sucesso (Valor: R$ ${costConsumed.toFixed(2)})!`, 'success');

    // If new stock reaches minimum quantity
    if (newStock <= selectedItemForAction.minQuantity) {
      setTimeout(() => {
        showToast(`⚠️ Atenção: "${selectedItemForAction.name}" atingiu o estoque mínimo (${newStock} ${selectedItemForAction.unit} restantes)! Notificação enviada para Alertas e Notificações.`, 'warning');
      }, 500);
    }

    setIsConsumeModalOpen(false);
    setSelectedItemForAction(null);
  };

  // Open Quick Entry / Repurchase Modal
  const handleOpenEntry = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setEntryForm({
      quantity: 0,
      unitCost: item.unitCost,
      totalCost: 0,
      date: new Date().toISOString().split('T')[0],
      launchExpense: true,
      notes: 'Compra de reposição de estoque'
    });
    setIsEntryModalOpen(true);
  };

  // Confirm Stock Entry
  const handleConfirmEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction || entryForm.quantity <= 0) return;

    const addedQty = entryForm.quantity;
    const newTotalQty = Number((selectedItemForAction.quantity + addedQty).toFixed(2));
    const effectiveTotalCost = entryForm.totalCost > 0 ? entryForm.totalCost : Number((addedQty * entryForm.unitCost).toFixed(2));
    const effectiveUnitCost = addedQty > 0 ? Number((effectiveTotalCost / addedQty).toFixed(2)) : selectedItemForAction.unitCost;

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: entryForm.date,
      type: 'entrada',
      quantity: addedQty,
      unitCost: effectiveUnitCost,
      totalCost: effectiveTotalCost,
      notes: entryForm.notes
    };

    const updatedItem: InventoryItem = {
      ...selectedItemForAction,
      quantity: newTotalQty,
      unitCost: effectiveUnitCost,
      totalCost: Number((newTotalQty * effectiveUnitCost).toFixed(2)),
      lastPurchaseDate: entryForm.date,
      history: [movement, ...(selectedItemForAction.history || [])]
    };

    const financialExpense: FinancialExpensePayload | undefined = (entryForm.launchExpense && effectiveTotalCost > 0) ? {
      amount: effectiveTotalCost,
      description: `Reposição de Estoque: ${selectedItemForAction.name} (+${addedQty} ${selectedItemForAction.unit})`,
      date: entryForm.date,
      category: getSuggestedExpenseCategory(selectedItemForAction.category)
    } : undefined;

    onUpdateStock(updatedItem, financialExpense);

    if (financialExpense) {
      showToast(`Entrada de +${addedQty} ${selectedItemForAction.unit} salva e despesa de R$ ${effectiveTotalCost.toFixed(2)} lançada no Financeiro!`, 'success');
    } else {
      showToast(`Entrada de +${addedQty} ${selectedItemForAction.unit} adicionada ao estoque!`, 'success');
    }

    setIsEntryModalOpen(false);
    setSelectedItemForAction(null);
  };

  // Open History Modal
  const handleOpenHistory = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-start gap-3 max-w-md animate-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'warning' 
            ? 'bg-amber-950/90 text-amber-200 border-amber-500/50 backdrop-blur-md'
            : toastMessage.type === 'info'
            ? 'bg-sky-950/90 text-sky-200 border-sky-500/50 backdrop-blur-md'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 backdrop-blur-md'
        }`}>
          <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
            {toastMessage.type === 'warning' ? <AlertTriangle size={18} className="text-amber-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          </div>
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {toastMessage.text}
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Warehouse size={220} />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Package size={14} className="text-emerald-300" />
            <span>Gestão de Insumos & Almoxarifado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Estoque / Insumos
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Controle de rações, suplementos, medicamentos e defensivos com registro de consumo direto, cálculo de custos e lançamento automático de despesas no Financeiro.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button 
            onClick={handleOpenNewItem}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <Plus size={18} className="stroke-[3]" />
            <span>Novo Insumo / Compra</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Insumos</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalStockItemsCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tipos cadastrados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Valor em Estoque</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Patrimônio em insumos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <DollarSign size={24} />
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
          totalLowStockCount > 0 
            ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Estoque Crítico</p>
            <p className={`text-2xl font-black mt-1 ${totalLowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {totalLowStockCount} {totalLowStockCount === 1 ? 'item' : 'itens'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalLowStockCount > 0 ? 'Abaixo da quantidade mínima' : 'Níveis normais'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            totalLowStockCount > 0 
              ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse' 
              : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Alertas Ativos</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {totalLowStockCount > 0 ? 'Notificado' : 'OK'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Visível no sino do topo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Notification Banner */}
      {totalLowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-md shadow-amber-500/30">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <span>Alerta de Reposição de Estoque ({totalLowStockCount} {totalLowStockCount === 1 ? 'item atingiu' : 'itens atingiram'} o mínimo)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase">Notificação Ativa</span>
              </h3>
              <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                Estes insumos atingiram ou ultrapassaram o limite mínimo de segurança e já geraram alertas em <strong>"Alertas e Notificações"</strong>. Registre uma nova compra para restabelecer o estoque.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              onlyLowStock 
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
            }`}
          >
            {onlyLowStock ? 'Ver Todos os Itens' : 'Filtrar Itens Críticos'}
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, categoria ou unidade..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({inventory.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = inventory.filter(i => i.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insumos Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Warehouse size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhum insumo encontrado</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {searchTerm || selectedCategory !== 'todos' || onlyLowStock
              ? 'Nenhum item corresponde aos filtros selecionados. Tente limpar os filtros de busca.'
              : 'Cadastre seus insumos (rações, suplementos, medicamentos) para gerenciar o almoxarifado e lançar custos automaticamente no Financeiro.'}
          </p>
          <button 
            onClick={handleOpenNewItem}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} /> Cadastrar Primeiro Insumo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isLowStock = item.quantity <= item.minQuantity;
            const stockPercent = item.minQuantity > 0 ? Math.min(100, Math.round((item.quantity / (item.minQuantity * 2)) * 100)) : 100;
            const totalItemValue = Number((item.quantity * item.unitCost).toFixed(2));

            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-md flex flex-col justify-between ${
                  isLowStock 
                    ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/30 to-white shadow-xs' 
                    : 'border-slate-200/80'
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        item.category === 'Ração' ? 'bg-amber-100 text-amber-800' :
                        item.category === 'Medicamento' ? 'bg-rose-100 text-rose-800' :
                        item.category === 'Suplemento' ? 'bg-emerald-100 text-emerald-800' :
                        item.category === 'Pastagem' ? 'bg-lime-100 text-lime-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.category}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1.5 leading-snug">
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLowStock ? (
                        <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs animate-bounce" title="Atingiu a quantidade mínima! Notificação ativa.">
                          <AlertTriangle size={18} />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600" title="Estoque em nível regular">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantity Display */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4 space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Saldo Atual</span>
                        <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                          {item.quantity} <span className="text-xs font-bold text-slate-500 uppercase">{item.unit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Valor Total</span>
                        <p className="text-base font-extrabold text-emerald-700 leading-none mt-1">
                          R$ {totalItemValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Stock Level Progress Indicator */}
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className={isLowStock ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                          Mínimo: {item.minQuantity} {item.unit}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Custo: R$ {item.unitCost.toFixed(2)}/{item.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, Math.min(100, (item.quantity / (item.minQuantity > 0 ? item.minQuantity * 2 : 10)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {isLowStock && (
                      <div className="bg-amber-100/90 text-amber-950 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-amber-300">
                        <AlertCircle size={15} className="text-amber-700 shrink-0" />
                        <span>Estoque mínimo atingido! Reabasteça logo.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {/* Primary "Consumo" Button Requested by User */}
                  <button 
                    onClick={() => handleOpenConsume(item)}
                    className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-slate-950/20 transition-all group"
                  >
                    <TrendingDown size={17} className="text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                    <span>Registrar Consumo</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Entry / Buy More */}
                    <button 
                      onClick={() => handleOpenEntry(item)}
                      className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-emerald-200/80"
                      title="Registrar nova compra ou entrada de estoque com lançamento no financeiro"
                    >
                      <ShoppingCart size={14} />
                      <span>Comprar</span>
                    </button>

                    {/* History */}
                    <button 
                      onClick={() => handleOpenHistory(item)}
                      className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Ver histórico de entradas e consumos deste item"
                    >
                      <History size={14} />
                      <span>Histórico</span>
                    </button>

                    {/* Edit */}
                    <button 
                      onClick={() => handleOpenEditItem(item)}
                      className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Editar configurações do item"
                    >
                      <Edit3 size={14} />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODAL: REGISTRAR CONSUMO (Req #2) */}
      {/* ========================================================================= */}
      {isConsumeModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Registrar Consumo de Insumo</h3>
                  <p className="text-xs text-slate-300">{selectedItemForAction.name} ({selectedItemForAction.category})</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsConsumeModalOpen(false); setSelectedItemForAction(null); }}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmConsume} className="p-6 space-y-5">
              
              {/* Current Stock Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Atual em Almoxarifado</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {selectedItemForAction.quantity} <span className="text-xs font-bold text-slate-500">{selectedItemForAction.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custo Unitário</span>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    R$ {selectedItemForAction.unitCost.toFixed(2)}/{selectedItemForAction.unit}
                  </p>
                </div>
              </div>

              {/* Input: Quantidade Consumida */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Quantidade / Valor Consumido ({selectedItemForAction.unit}) *
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    min="0.01"
                    required
                    autoFocus
                    placeholder={`Ex: 5 ou 100`}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-lg font-black text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                    value={consumeForm.quantity || ''} 
                    onChange={e => setConsumeForm({ ...consumeForm, quantity: Number(e.target.value) })} 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                    {selectedItemForAction.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Este valor será retirado diretamente do total do item no estoque.
                </p>
              </div>

              {/* Lote / Destino & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Destino / Lote (Opcional)
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={consumeForm.lotId}
                    onChange={e => setConsumeForm({ ...consumeForm, lotId: e.target.value })}
                  >
                    <option value="">Geral da Fazenda</option>
                    {lots.map(lot => (
                      <option key={lot.id} value={lot.id}>{lot.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data do Consumo *
                  </label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={consumeForm.date}
                    onChange={e => setConsumeForm({ ...consumeForm, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Finalidade / Observações */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Finalidade / Observação
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Trato matinal piquete 04, Vacinação preventiva..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  value={consumeForm.notes}
                  onChange={e => setConsumeForm({ ...consumeForm, notes: e.target.value })}
                />
              </div>

              {/* Real-Time Impact Simulation */}
              {consumeForm.quantity > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-medium">Novo saldo de estoque:</span>
                    <span className="font-extrabold text-amber-950">
                      {Math.max(0, Number((selectedItemForAction.quantity - consumeForm.quantity).toFixed(2)))} {selectedItemForAction.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-medium">Custo do consumo:</span>
                    <span className="font-extrabold text-emerald-800">
                      R$ {(consumeForm.quantity * selectedItemForAction.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Warning if will hit minimum quantity */}
                  {(selectedItemForAction.quantity - consumeForm.quantity) <= selectedItemForAction.minQuantity && (
                    <div className="pt-2 border-t border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900 font-bold">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>Este consumo deixará o estoque igual ou abaixo do mínimo ({selectedItemForAction.minQuantity} {selectedItemForAction.unit}) e acionará os Alertas da Fazenda!</span>
                    </div>
                  )}

                  {consumeForm.quantity > selectedItemForAction.quantity && (
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>A quantidade consumida é maior que o saldo atual ({selectedItemForAction.quantity}). O estoque será zerado.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsConsumeModalOpen(false); setSelectedItemForAction(null); }}
                  className="w-1/3 py-3.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-amber-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <TrendingDown size={16} />
                  <span>Confirmar Consumo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: NOVO INSUMO / COMPRA (Req #1: Lançar no financeiro como despesa) */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="p-6 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {itemForm.id ? 'Editar Insumo de Estoque' : 'Cadastrar Novo Insumo / Compra'}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {itemForm.id ? 'Modifique os parâmetros cadastrados' : 'Registre o produto e lance o valor diretamente como despesa'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              
              {/* Nome do Produto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome do Produto / Insumo *
                </label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  placeholder="Ex: Sal Mineral 80, Milho Moído, Vacina Febre Aftosa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                  value={itemForm.name} 
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })} 
                />
              </div>

              {/* Categoria & Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Categoria *
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={itemForm.category}
                    onChange={e => {
                      const cat = e.target.value;
                      setItemForm({ 
                        ...itemForm, 
                        category: cat,
                        expenseCategory: getSuggestedExpenseCategory(cat)
                      });
                    }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unidade de Medida *
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                  >
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantidade Inicial e Quantidade Mínima de Alerta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Quantidade Comprada / Inicial *
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    required
                    placeholder="Ex: 50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={itemForm.quantity || ''} 
                    onChange={e => handleQuantityChange(Number(e.target.value))} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Qtd Mínima (Alerta) *</span>
                    <span className="text-[10px] text-amber-600 font-bold lowercase">gera notificação</span>
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    required
                    placeholder="Ex: 10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    value={itemForm.minQuantity || ''} 
                    onChange={e => setItemForm({ ...itemForm, minQuantity: Number(e.target.value) })} 
                  />
                </div>
              </div>

              {/* Custo Unitário e Valor Total (Sincronização Bi-Direcional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Custo Unitário (R$ / {itemForm.unit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      value={itemForm.unitCost || ''} 
                      onChange={e => handleUnitCostChange(Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Valor Total da Compra (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                      value={itemForm.totalCost || ''} 
                      onChange={e => handleTotalCostChange(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Integração Financeira: Lançamento como Despesa (Req #1) */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                    checked={itemForm.launchExpense}
                    onChange={e => setItemForm({ ...itemForm, launchExpense: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-extrabold text-emerald-950 block">
                      Lançar valor no Financeiro como "Despesa"
                    </span>
                    <span className="text-[11px] text-emerald-800 leading-tight block">
                      Cria automaticamente um lançamento financeiro de despesa vinculado a esta compra.
                    </span>
                  </div>
                </label>

                {itemForm.launchExpense && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                        Data do Lançamento
                      </label>
                      <input 
                        type="date"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={itemForm.expenseDate}
                        onChange={e => setItemForm({ ...itemForm, expenseDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                        Categoria Financeira
                      </label>
                      <select 
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={itemForm.expenseCategory}
                        onChange={e => setItemForm({ ...itemForm, expenseCategory: e.target.value })}
                      >
                        <option value="Nutrição">Nutrição</option>
                        <option value="Sanidade">Sanidade</option>
                        <option value="Insumos e Estoque">Insumos e Estoque</option>
                        <option value="Pastagem/Manejo">Pastagem/Manejo</option>
                        <option value="Manutenção/Equipamentos">Manutenção/Equipamentos</option>
                        <option value="Combustível">Combustível</option>
                        <option value="Outros Custos">Outros Custos</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsItemModalOpen(false)}
                  className="w-1/3 py-3.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{itemForm.id ? 'Salvar Alterações' : 'Cadastrar Insumo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: NOVA COMPRA / ENTRADA EM ITEM EXISTENTE */}
      {/* ========================================================================= */}
      {isEntryModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            
            <div className="p-6 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Nova Compra / Entrada</h3>
                  <p className="text-xs text-emerald-200">{selectedItemForAction.name} (Saldo atual: {selectedItemForAction.quantity} {selectedItemForAction.unit})</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEntryModalOpen(false); setSelectedItemForAction(null); }}
                className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Quantidade Comprada ({selectedItemForAction.unit}) *
                </label>
                <input 
                  type="number" 
                  step="any"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="Ex: 50"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  value={entryForm.quantity || ''} 
                  onChange={e => {
                    const q = Number(e.target.value);
                    const total = q * entryForm.unitCost;
                    setEntryForm({ ...entryForm, quantity: q, totalCost: Number(total.toFixed(2)) });
                  }} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Custo Unitário (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={entryForm.unitCost || ''} 
                    onChange={e => {
                      const u = Number(e.target.value);
                      const total = entryForm.quantity * u;
                      setEntryForm({ ...entryForm, unitCost: u, totalCost: Number(total.toFixed(2)) });
                    }} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Valor Total da Compra (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-emerald-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    value={entryForm.totalCost || ''} 
                    onChange={e => {
                      const t = Number(e.target.value);
                      const u = entryForm.quantity > 0 ? t / entryForm.quantity : entryForm.unitCost;
                      setEntryForm({ ...entryForm, totalCost: t, unitCost: Number(u.toFixed(2)) });
                    }} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Data da Compra *
                </label>
                <input 
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  value={entryForm.date}
                  onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                />
              </div>

              {/* Checkbox Despesa Financeira */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                    checked={entryForm.launchExpense}
                    onChange={e => setEntryForm({ ...entryForm, launchExpense: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-extrabold text-emerald-950 block">
                      Lançar R$ {entryForm.totalCost.toFixed(2)} no Financeiro como Despesa
                    </span>
                    <span className="text-[11px] text-emerald-800 block">
                      Atualiza o fluxo de caixa da fazenda automaticamente.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEntryModalOpen(false); setSelectedItemForAction(null); }}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  <span>Confirmar Compra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: HISTÓRICO DE MOVIMENTAÇÕES DO ITEM */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Histórico de Movimentações</h3>
                  <p className="text-xs text-slate-300">{selectedItemForAction.name} ({selectedItemForAction.unit})</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsHistoryModalOpen(false); setSelectedItemForAction(null); }}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {(!selectedItemForAction.history || selectedItemForAction.history.length === 0) ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Package size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Nenhuma movimentação registrada ainda para este item.</p>
                  <p className="text-[11px] text-slate-400">Os consumos e compras registradas aparecerão listados aqui.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedItemForAction.history.map((mov, idx) => (
                    <div key={mov.id || idx} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          mov.type === 'consumo' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {mov.type === 'consumo' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">
                              {mov.type === 'consumo' ? 'Consumo Registrado' : 'Entrada / Compra'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(mov.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {mov.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{mov.notes}</p>
                          )}
                          {mov.lotName && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Lote: {mov.lotName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-xs font-black ${
                          mov.type === 'consumo' ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {mov.type === 'consumo' ? '-' : '+'}{mov.quantity} {selectedItemForAction.unit}
                        </p>
                        {mov.totalCost ? (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            R$ {mov.totalCost.toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => { setIsHistoryModalOpen(false); setSelectedItemForAction(null); }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManager;
