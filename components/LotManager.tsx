
import React, { useState } from 'react';
import { Lot, Animal } from '../types';
import { Layers, Plus, Edit2, Users, Scale, DollarSign, X } from 'lucide-react';

interface LotManagerProps {
  lots: Lot[];
  animals: Animal[];
  onAddLot: (lot: Lot) => void;
  onUpdateLot: (lot: Lot) => void;
  onSellLot?: (lotId: string, date: string, totalValue: number) => void;
}

const LotManager: React.FC<LotManagerProps> = ({ lots, animals, onAddLot, onUpdateLot, onSellLot }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [currentLot, setCurrentLot] = useState<Lot>({ id: '', name: '', description: '' });
  
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);
  const [sellValue, setSellValue] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentLot.id) {
      onUpdateLot(currentLot);
    } else {
      onAddLot({ ...currentLot, id: Date.now().toString() });
    }
    closeModal();
  };

  const openModal = (lot?: Lot) => {
    setCurrentLot(lot || { id: '', name: '', description: '' });
    setIsModalOpen(true);
  };

  const openSellModal = (lot: Lot) => {
    setCurrentLot(lot);
    setSellValue(0);
    setIsSellModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSellModalOpen(false);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSellLot && currentLot.id) {
          onSellLot(currentLot.id, sellDate, sellValue);
          setIsSellModalOpen(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-blue-600" /> Gestão de Lotes
        </h2>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Novo Lote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lots.map((lot) => {
          const lotAnimals = animals.filter(a => a.lotId === lot.id && a.status !== 'Vendido' && a.status !== 'Morto');
          const headCount = lotAnimals.length;
          const avgWeight = headCount > 0 
            ? lotAnimals.reduce((sum, a) => sum + a.weightKg, 0) / headCount 
            : 0;

          return (
            <div key={lot.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all relative group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{lot.name}</h3>
                <div className="flex gap-2">
                    <button onClick={() => openModal(lot)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all"><Edit2 size={18} /></button>
                    {headCount > 0 && (
                        <button onClick={() => openSellModal(lot)} className="text-gray-400 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-all" title="Vender Lote Inteiro"><DollarSign size={18} /></button>
                    )}
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium mb-6 h-10 line-clamp-2 italic uppercase tracking-widest">{lot.description || 'Sem descrição.'}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800 tracking-tighter">{headCount}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cabeças</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Scale size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800 tracking-tighter">{avgWeight.toFixed(1)} <span className="text-[10px]">kg</span></p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peso Médio</p>
                    </div>
                </div>
              </div>

              {lot.dailyCost ? (
                  <div className="mt-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diária Lote:</span>
                    <span className="text-sm font-black text-blue-600">R$ {lot.dailyCost.toFixed(2)}</span>
                  </div>
              ) : (
                  <div className="mt-6 text-center">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">Usando diária padrão da fazenda</span>
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden scale-in">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Configuração do Lote</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Nome do Lote</label>
                <input type="text" required className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-bold bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={currentLot.name} onChange={e => setCurrentLot({...currentLot, name: e.target.value})} placeholder="Ex: Engorda 2024" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Descrição</label>
                <textarea className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-medium bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={currentLot.description} onChange={e => setCurrentLot({...currentLot, description: e.target.value})} rows={3} />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100">Salvar Lote</button>
            </form>
          </div>
        </div>
      )}

      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden scale-in border-4 border-green-50">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-green-600 text-white">
              <h3 className="text-lg font-black uppercase tracking-tight">Liquidacion de Lote</h3>
              <button onClick={closeModal} className="text-white hover:bg-white/10 rounded-full p-1"><X size={24} /></button>
            </div>
            <form onSubmit={handleSellSubmit} className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Data da Venda</label>
                <input type="date" required className="w-full border border-gray-200 rounded-2xl px-5 py-3 font-bold bg-gray-50 focus:bg-white outline-none"
                  value={sellDate} onChange={e => setSellDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Valor Total Bruto (R$)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-green-600 font-black text-xl">R$</span>
                  <input type="number" required className="w-full border border-gray-200 rounded-[2rem] pl-16 pr-6 py-5 font-black text-3xl text-green-900 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none"
                    value={sellValue || ''} onChange={e => setSellValue(Number(e.target.value))} placeholder="0,00" />
                </div>
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center px-4">O lucro será calculado automaticamente subtraindo o valor de compra e a estadia total do lote.</p>
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-200">Confirmar Liquidação</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotManager;
