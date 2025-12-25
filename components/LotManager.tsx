import React, { useState } from 'react';
import { Lot, Animal } from '../types';
import { Layers, Plus, Edit2, Users, Scale } from 'lucide-react';

interface LotManagerProps {
  lots: Lot[];
  animals: Animal[];
  onAddLot: (lot: Lot) => void;
  onUpdateLot: (lot: Lot) => void;
}

const LotManager: React.FC<LotManagerProps> = ({ lots, animals, onAddLot, onUpdateLot }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLot, setCurrentLot] = useState<Lot>({ id: '', name: '', description: '' });

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

  const closeModal = () => {
    setIsModalOpen(false);
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
          const lotAnimals = animals.filter(a => a.lotId === lot.id);
          const headCount = lotAnimals.length;
          const avgWeight = headCount > 0 
            ? lotAnimals.reduce((sum, a) => sum + a.weightKg, 0) / headCount 
            : 0;

          return (
            <div key={lot.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800">{lot.name}</h3>
                <button onClick={() => openModal(lot)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
              </div>
              <p className="text-sm text-gray-500 mb-6 h-10 line-clamp-2">{lot.description || 'Sem descrição.'}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-gray-700">
                    <Users size={18} className="text-blue-500" />
                    <div>
                        <p className="text-lg font-bold">{headCount}</p>
                        <p className="text-xs text-gray-500">Animais</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <Scale size={18} className="text-green-500" />
                    <div>
                        <p className="text-lg font-bold">{avgWeight.toFixed(1)} kg</p>
                        <p className="text-xs text-gray-500">Média</p>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Detalhes do Lote</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Lote</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={currentLot.name} onChange={e => setCurrentLot({...currentLot, name: e.target.value})} placeholder="Ex: Engorda 2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={currentLot.description} onChange={e => setCurrentLot({...currentLot, description: e.target.value})} rows={3} />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">Salvar Lote</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotManager;