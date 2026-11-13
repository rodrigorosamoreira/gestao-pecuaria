
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
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug">Controle Financeiro</h2>
          <p className="text-sm text-[#64766C] font-normal mt-0.5">Fluxo de caixa, centro de custos e resultado operacional</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#E3EAE6] text-sm font-medium text-[#20332C] shadow-2xs capitalize">
           <Calendar size={16} className="text-[#145C46]" />
           <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="agro-card p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#64766C]">Receitas Totais</span>
            <div className="p-2.5 rounded-xl bg-[#DCEDE4] text-[#145C46] border border-[#145C46]/20">
              <ArrowUpCircle size={20} />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#145C46] font-nums leading-tight">
            R$ {totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-xs text-[#64766C] font-normal mt-1">Vendas e entradas de caixa</p>
        </div>
        
        <div className="agro-card p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#64766C]">Despesas Totais</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <p className="text-2xl font-semibold text-rose-600 font-nums leading-tight">
            R$ {totalExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-xs text-[#64766C] font-normal mt-1">Custos e investimentos no rebanho</p>
        </div>

        <div className="agro-card p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#64766C]">Resultado (Saldo)</span>
            <div className={`p-2.5 rounded-xl border ${balance >= 0 ? 'bg-[#DCEDE4] text-[#145C46] border-[#145C46]/20' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className={`text-2xl font-semibold font-nums leading-tight ${balance >= 0 ? 'text-[#145C46]' : 'text-rose-600'}`}>
            R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </p>
          <p className="text-xs text-[#64766C] font-normal mt-1">Lucro operacional acumulado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Lateral */}
        <div className="lg:col-span-4 agro-card p-5 sm:p-6 h-fit space-y-5">
          <h3 className="text-base font-semibold text-[#20332C] flex items-center gap-2 pb-3 border-b border-[#E3EAE6]">
            <FileText size={18} className="text-[#145C46]" /> Novo Lançamento
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#64766C]">Descrição</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 font-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] transition-all text-sm"
                placeholder="Ex: Suplementação mineral, Reforma cerca..."
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#64766C]">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C] font-normal text-sm">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-3.5 py-2.5 font-semibold text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] transition-all text-sm font-nums"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#64766C]">Categoria</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 font-medium text-[#20332C] bg-[#F6F8F5] focus:bg-white outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] transition-all text-sm cursor-pointer"
              >
                <option value="Manutenção">Manutenção</option>
                <option value="Insumos">Insumos</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Salários">Mão de Obra</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#64766C]">Tipo de Lançamento</label>
              <div className="flex bg-[#F6F8F5] rounded-xl p-1 border border-[#E3EAE6]">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-2xs text-[#145C46]' : 'text-[#64766C] hover:text-[#20332C]'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-2xs text-rose-600' : 'text-[#64766C] hover:text-[#20332C]'}`}
                >
                  Despesa
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs">
              <Plus size={16} /> Lançar Transação
            </button>
          </form>
        </div>

        {/* Lista de Transações */}
        <div className="lg:col-span-8 agro-card overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#E3EAE6] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#20332C] flex items-center gap-2">
              <History size={18} className="text-[#145C46]" /> Extrato Financeiro
            </h3>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64766C]" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar lançamentos..." 
                className="w-full pl-9 pr-3.5 py-2 border border-[#E3EAE6] rounded-xl outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal text-[#20332C]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F6F8F5] border-b border-[#E3EAE6]">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-medium text-[#64766C]">Data / Categoria</th>
                  <th className="px-5 py-3.5 text-xs font-medium text-[#64766C]">Descrição</th>
                  <th className="px-5 py-3.5 text-xs font-medium text-[#64766C] text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAE6]">
                {filteredTransactions.map((t, index) => (
                  <tr key={`${t.id}-${index}`} className="hover:bg-[#F6F8F5]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#20332C] font-nums">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-[#64766C] font-normal">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-normal text-[#20332C] line-clamp-1">{t.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-semibold font-nums ${t.type === TransactionType.INCOME ? 'text-[#145C46]' : 'text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[#64766C]">
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
