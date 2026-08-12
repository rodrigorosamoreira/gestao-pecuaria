
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
// Add missing Plus and History icon imports
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Filter, Search, Calendar, FileText, Plus, History } from 'lucide-react';

interface FinanceManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ transactions, onAddTransaction }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('Outros');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAddTransaction({
      id: `man-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      description,
      amount: parseFloat(amount),
      type,
      category
    });
    setDescription('');
    setAmount('');
    setCategory('Outros');
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Controle Financeiro</h2>
          <p className="text-slate-500 text-xs">Fluxo de caixa, centro de custos e resultado operacional</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
           <Calendar size={16} className="text-emerald-600" />
           <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="agro-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas Totais</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ArrowUpCircle size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 font-nums">
            R$ {totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Vendas e entradas de caixa</p>
        </div>
        
        <div className="agro-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas Totais</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 font-nums">
            R$ {totalExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Custos e investimentos no rebanho</p>
        </div>

        <div className="agro-card p-5 relative overflow-hidden bg-slate-900 text-white border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Resultado (Saldo)</span>
            <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
              <DollarSign size={20} />
            </div>
          </div>
          <p className={`text-2xl font-black font-nums ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Lucro operacional acumulado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Lateral */}
        <div className="lg:col-span-4 agro-card p-6 h-fit space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText size={18} className="text-emerald-600" /> Novo Lançamento
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Descrição</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs"
                placeholder="Ex: Suplementação mineral, Reforma cerca..."
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 font-bold text-slate-900 bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs font-nums"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Categoria</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-700 bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs cursor-pointer"
              >
                <option value="Manutenção">Manutenção</option>
                <option value="Insumos">Insumos</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Salários">Mão de Obra</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Tipo de Lançamento</label>
              <div className="flex bg-slate-100/80 rounded-xl p-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-xs text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Despesa
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-emerald-800 cursor-pointer shadow-xs">
              <Plus size={16} /> Lançar Transação
            </button>
          </form>
        </div>

        {/* Lista de Transações */}
        <div className="lg:col-span-8 agro-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <History size={18} className="text-emerald-600" /> Extrato Financeiro
            </h3>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar lançamentos..." 
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition-all text-xs font-medium text-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data / Categoria</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t, index) => (
                  <tr key={`${t.id}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 font-nums">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{t.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-xs font-black font-nums ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <DollarSign size={36} className="opacity-20" />
                        <p className="text-xs font-medium">Nenhuma movimentação registrada.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceManager;
