
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
      id: `man-${Date.now()}`,
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Controle Financeiro</h2>
          <p className="text-gray-500 text-sm">Fluxo de caixa e lucratividade em tempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
           <Calendar size={18} className="text-green-600" />
           <span className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-green-50 group-hover:text-green-100 transition-colors"><ArrowUpCircle size={100} /></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest relative z-10">Receitas Totais</p>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black text-emerald-600 tracking-tighter">R$ {totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-red-50 group-hover:text-red-100 transition-colors"><ArrowDownCircle size={100} /></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest relative z-10">Despesas Totais</p>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black text-red-600 tracking-tighter">R$ {totalExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-xl relative overflow-hidden group border-2 ${balance >= 0 ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'}`}>
          <div className="absolute top-0 right-0 p-4 text-white opacity-10"><DollarSign size={100} /></div>
          <p className="text-xs font-black text-white/70 uppercase tracking-widest relative z-10">Saldo Líquido (Lucro)</p>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black text-white tracking-tighter">
              R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Lateral */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit space-y-6">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <FileText size={18} className="text-green-600" /> Lançamento Avulso
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="Ex: Reforma de Cerca..."
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-gray-800 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
              >
                <option value="Manutenção">Manutenção</option>
                <option value="Insumos">Insumos</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Salários">Mão de Obra</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Lançamento</label>
              <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${type === TransactionType.INCOME ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-white shadow-md text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Despesa
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2">
              <Plus size={18} /> Lançar Valor
            </button>
          </form>
        </div>

        {/* Lista de Transações */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <History size={18} className="text-blue-600" /> Extrato Financeiro
            </h3>
            <div className="relative group min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar lançamentos..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-xs font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{t.description}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <DollarSign size={48} className="opacity-10" />
                        <p className="text-sm font-medium">Nenhuma movimentação encontrada.</p>
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
