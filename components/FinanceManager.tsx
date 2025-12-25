import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';

interface FinanceManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ transactions, onAddTransaction }) => {
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState<TransactionType>(TransactionType.EXPENSE);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAddTransaction({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description,
      amount: parseFloat(amount),
      type,
      category: 'Geral'
    });
    setDescription('');
    setAmount('');
  };

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Controle Financeiro</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Receita Total</p>
          <div className="flex items-center gap-2 mt-2">
            <ArrowUpCircle className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-800">R$ {totalIncome.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Despesa Total</p>
          <div className="flex items-center gap-2 mt-2">
            <ArrowDownCircle className="text-red-500" size={24} />
            <span className="text-2xl font-bold text-gray-800">R$ {totalExpense.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Saldo</p>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="text-blue-500" size={24} />
            <span className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(totalIncome - totalExpense).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-semibold text-gray-800 mb-4">Nova Transação</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Descrição</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: Venda de Gado, Vacinas..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Valor (R$)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-2 rounded-lg border ${type === TransactionType.INCOME ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-200 text-gray-600'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2 rounded-lg border ${type === TransactionType.EXPENSE ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-200 text-gray-600'}`}
                >
                  Despesa
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">
              Adicionar
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-6 border-b border-gray-100">Histórico Recente</h3>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.slice().reverse().map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{t.description}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhuma transação registrada.</td>
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