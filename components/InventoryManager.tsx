
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Plus, AlertTriangle, Search, Package } from 'lucide-react';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onAddStock: (item: InventoryItem) => void;
  onUpdateStock: (item: InventoryItem) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onAddStock, onUpdateStock }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialFormState: InventoryItem = {
    id: '',
    name: '',
    category: 'Ração',
    quantity: 0,
    minQuantity: 10,
    unit: 'kg',
    unitCost: 0
  };

  const [currentItem, setCurrentItem] = useState<InventoryItem>(initialFormState);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem.id) {
      onUpdateStock(currentItem);
    } else {
      onAddStock({ ...currentItem, id: Date.now().toString() });
    }
    closeModal();
  };

  const openModal = (item?: InventoryItem) => {
    setCurrentItem(item || initialFormState);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(initialFormState);
  };

  const handleAdjustQuantity = (item: InventoryItem, amount: number) => {
    const newQty = Math.max(0, item.quantity + amount);
    onUpdateStock({ ...item, quantity: newQty });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-purple-600" /> Controle de Estoque
        </h2>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Novo Item
        </button>
      </div>

      <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar item..." 
            className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isLowStock = item.quantity <= item.minQuantity;
          return (
            <div key={item.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${isLowStock ? 'border-red-100' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                </div>
                {isLowStock && (
                  <div className="text-red-500 bg-red-50 p-1 rounded-md" title="Estoque Baixo">
                    <AlertTriangle size={20} />
                  </div>
                )}
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <div>
                    <p className="text-3xl font-bold text-gray-800">{item.quantity} <span className="text-sm text-gray-500 font-normal">{item.unit}</span></p>
                    <p className="text-xs text-gray-500">Mínimo: {item.minQuantity} {item.unit}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">R$ {item.unitCost.toFixed(2)}/{item.unit}</p>
                    <p className="text-xs text-gray-400">Custo Unit.</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleAdjustQuantity(item, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >-</button>
                    <button 
                         onClick={() => handleAdjustQuantity(item, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                    >+</button>
                </div>
                <button onClick={() => openModal(item)} className="text-sm text-blue-600 hover:underline">Editar</button>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Item de Estoque</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Atual</label>
                    <input type="number" onFocus={handleFocus} required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                      value={currentItem.quantity || ''} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Mínima</label>
                    <input type="number" onFocus={handleFocus} required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                      value={currentItem.minQuantity || ''} onChange={e => setCurrentItem({...currentItem, minQuantity: Number(e.target.value)})} />
                 </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário (R$)</label>
                  <input type="number" onFocus={handleFocus} step="0.01" required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                    value={currentItem.unitCost || ''} onChange={e => setCurrentItem({...currentItem, unitCost: Number(e.target.value)})} />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
