
import React, { useState } from 'react';
import { HealthRecord, Animal, HealthSeverity, AnimalStatus } from '../types';
import { HeartPulse, Plus, Search, Calendar, AlertCircle, X, CheckCircle2, History, Bell, RotateCcw } from 'lucide-react';

interface HealthManagerProps {
  animals: Animal[];
  healthRecords: HealthRecord[];
  onAddRecord: (record: HealthRecord) => void;
  onUpdateRecord: (record: HealthRecord) => void;
}

const HealthManager: React.FC<HealthManagerProps> = ({ animals, healthRecords, onAddRecord, onUpdateRecord }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<HealthRecord>>({
    animalId: '',
    type: 'Doença',
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    severity: HealthSeverity.MODERATE,
    protocol: '',
    notifyAsReminder: true,
    repeatAfterDays: 0,
    status: 'Em Tratamento'
  });

  const activeCases = healthRecords.filter(r => r.status === 'Em Tratamento');
  
  const filteredRecords = healthRecords.filter(record => {
    const animal = animals.find(a => a.id === record.animalId);
    const searchString = `${record.title} ${animal?.earTag || ''} ${record.type}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalId || !formData.title) return;

    const newRecord: HealthRecord = {
      ...(formData as HealthRecord),
      id: Date.now().toString(),
      status: formData.type === 'Vacina' || formData.type === 'Vermífugo' ? 'Concluído' : 'Em Tratamento'
    };

    onAddRecord(newRecord);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      animalId: '',
      type: 'Doença',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      severity: HealthSeverity.MODERATE,
      protocol: '',
      notifyAsReminder: true,
      repeatAfterDays: 0,
      status: 'Em Tratamento'
    });
  };

  const handleStatusChange = (record: HealthRecord, newStatus: HealthRecord['status']) => {
    onUpdateRecord({ ...record, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Casos Ativos</p>
            <h3 className="text-3xl font-black text-red-600 mt-1">{activeCases.length}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manejos (30 dias)</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">
              {healthRecords.filter(r => {
                const d = new Date(r.startDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return d > thirtyDaysAgo;
              }).length}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <HeartPulse size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Próximos Lembretes</p>
            <h3 className="text-3xl font-black text-orange-600 mt-1">
                {healthRecords.filter(r => r.notifyAsReminder && r.status === 'Em Tratamento').length}
            </h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Bell size={24} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por diagnóstico, brinco ou tipo..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-red-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Registrar Ocorrência
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Animal / Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Ocorrência</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Início</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Severidade</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.slice().reverse().map((record) => {
                  const animal = animals.find(a => a.id === record.animalId);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">{animal?.earTag || 'N/A'}</span>
                          <span className={`text-[10px] font-bold uppercase w-fit px-2 rounded ${
                            record.type === 'Doença' ? 'bg-red-100 text-red-700' :
                            record.type === 'Vacina' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{record.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                          <span className="text-sm font-bold text-gray-800">{record.title}</span>
                          <span className="text-xs text-gray-500 line-clamp-1 italic">{record.protocol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <Calendar size={14} />
                          {new Date(record.startDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          record.severity === HealthSeverity.CRITICAL ? 'text-red-600 border border-red-200 bg-red-50' :
                          record.severity === HealthSeverity.MODERATE ? 'text-orange-600 border border-orange-200 bg-orange-50' :
                          'text-green-600 border border-green-200 bg-green-50'
                        }`}>
                          {record.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          record.status === 'Em Tratamento' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                          record.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.status === 'Em Tratamento' && (
                          <button 
                            onClick={() => handleStatusChange(record, 'Concluído')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Concluir Tratamento"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                    Nenhum registro de saúde encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden scale-in">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Registrar Ocorrência de Saúde</h3>
                <p className="text-sm text-gray-500 mt-1">Gestão sanitária e protocolos de tratamento</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Animal *</label>
                  <select 
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all font-medium"
                    value={formData.animalId}
                    onChange={(e) => setFormData({...formData, animalId: e.target.value})}
                  >
                    <option value="">Selecione o animal</option>
                    {animals.filter(a => a.status === AnimalStatus.ACTIVE).map(a => (
                      <option key={a.id} value={a.id}>{a.earTag} ({a.breed})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo *</label>
                  <select 
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="Doença">Doença</option>
                    <option value="Vacina">Vacina / Manejo Sanitário</option>
                    <option value="Vermífugo">Vermífugo</option>
                    <option value="Suplementação">Suplementação Injetável</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Diagnóstico / Título *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Mastite Clínica, Corte na Perna, Pneumonia..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Data Início *</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Severidade</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all font-medium"
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                  >
                    {Object.values(HealthSeverity).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Protocolo de Tratamento</label>
                <textarea 
                  rows={3}
                  placeholder="Descreva medicamentos, dosagens e procedimentos..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all"
                  value={formData.protocol}
                  onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <RotateCcw size={20} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-gray-700">Repetir Manejo?</p>
                            <p className="text-[10px] text-gray-400 font-medium">Define se o tratamento precisa de nova dose</p>
                          </div>
                      </div>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-20 border border-gray-300 rounded-lg p-2 text-center font-bold"
                        value={formData.repeatAfterDays}
                        onChange={(e) => setFormData({...formData, repeatAfterDays: Number(e.target.value)})}
                      />
                      <span className="text-xs font-bold text-gray-400">DIAS</span>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-gray-300 text-red-600 focus:ring-red-500"
                        checked={formData.notifyAsReminder}
                        onChange={(e) => setFormData({...formData, notifyAsReminder: e.target.checked})}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">Gerar tarefa de acompanhamento automaticamente</span>
                        <span className="text-[10px] text-gray-400">Você será notificado no painel geral</span>
                      </div>
                  </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95"
                >
                  Registrar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthManager;
