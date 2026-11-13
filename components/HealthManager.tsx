
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    <div className="space-y-6 font-sans">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="agro-card p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64766C] font-medium">Casos Ativos</p>
            <h3 className="text-2xl font-semibold text-rose-600 mt-1 font-nums leading-tight">{activeCases.length}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="agro-card p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64766C] font-medium">Manejos (30 dias)</p>
            <h3 className="text-2xl font-semibold text-[#20332C] mt-1 font-nums leading-tight">
              {healthRecords.filter(r => {
                const d = new Date(r.startDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return d > thirtyDaysAgo;
              }).length}
            </h3>
          </div>
          <div className="p-3 bg-[#DCEDE4] text-[#145C46] rounded-xl border border-[#145C46]/20">
            <HeartPulse size={22} />
          </div>
        </div>

        <div className="agro-card p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64766C] font-medium">Próximos Lembretes</p>
            <h3 className="text-2xl font-semibold text-amber-700 mt-1 font-nums leading-tight">
                {healthRecords.filter(r => r.notifyAsReminder && r.status === 'Em Tratamento').length}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Bell size={22} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-[#E3EAE6]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por diagnóstico, brinco ou tipo..." 
            className="w-full pl-10 pr-4 py-2.5 border border-[#E3EAE6] rounded-xl outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm text-[#20332C] placeholder:text-[#64766C]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#145C46] hover:bg-[#0E4434] text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> Registrar Ocorrência
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-2xs border border-[#E3EAE6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F6F8F5] border-b border-[#E3EAE6]">
              <tr>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Animal / Tipo</th>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Ocorrência</th>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Início</th>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Severidade</th>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C]">Status</th>
                <th className="px-6 py-3.5 text-xs font-medium text-[#64766C] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE6]">
              {filteredRecords.length > 0 ? (
                filteredRecords.slice().reverse().map((record, idx) => {
                  const animal = animals.find(a => a.id === record.animalId);
                  return (
                    <tr key={`${record.id}-${idx}`} className="hover:bg-[#F6F8F5]/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#20332C] font-nums">{animal?.earTag || 'N/A'}</span>
                          <span className={`text-xs font-normal w-fit px-2 py-0.5 rounded-md mt-0.5 ${
                            record.type === 'Doença' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            record.type === 'Vacina' ? 'bg-[#DCEDE4] text-[#145C46] border border-[#145C46]/20' :
                            'bg-[#F6F8F5] text-[#64766C] border border-[#E3EAE6]'
                          }`}>{record.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                          <span className="text-sm font-medium text-[#20332C]">{record.title}</span>
                          <span className="text-xs text-[#64766C] line-clamp-1 italic font-normal mt-0.5">{record.protocol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-[#64766C] font-normal font-nums">
                          <Calendar size={14} className="text-[#64766C]" />
                          {new Date(record.startDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          record.severity === HealthSeverity.CRITICAL ? 'text-rose-700 border border-rose-200 bg-rose-50' :
                          record.severity === HealthSeverity.MODERATE ? 'text-amber-700 border border-amber-200 bg-amber-50' :
                          'text-[#145C46] border border-[#145C46]/20 bg-[#DCEDE4]'
                        }`}>
                          {record.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                          record.status === 'Em Tratamento' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          record.status === 'Concluído' ? 'bg-[#DCEDE4] text-[#145C46]' :
                          'bg-[#F6F8F5] text-[#64766C] border border-[#E3EAE6]'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.status === 'Em Tratamento' && (
                          <button 
                            onClick={() => handleStatusChange(record, 'Concluído')}
                            className="p-2 text-[#145C46] hover:bg-[#E5F2EB] rounded-xl transition-all"
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
                  <td colSpan={6} className="px-6 py-16 text-center text-sm font-normal text-[#64766C]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-[#E3EAE6] max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-[#E3EAE6] flex justify-between items-center bg-[#F6F8F5] shrink-0">
              <div>
                <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Registrar Ocorrência de Saúde</h3>
                <p className="text-[13px] font-normal leading-normal text-[#64766C] mt-0.5">Gestão sanitária e protocolos de tratamento</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64766C] hover:text-[#20332C] p-2 hover:bg-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Animal *</label>
                  <select 
                    required
                    className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
                    value={formData.animalId}
                    onChange={(e) => setFormData({...formData, animalId: e.target.value})}
                  >
                    <option value="">Selecione o animal</option>
                    {animals.filter(a => a.status === AnimalStatus.ACTIVE).map(a => (
                      <option key={a.id} value={a.id}>{a.earTag} ({a.breed})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Tipo *</label>
                  <select 
                    required
                    className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
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

              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Diagnóstico / Título *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Mastite Clínica, Corte na Perna, Pneumonia..."
                  className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Data de Início *</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Severidade</label>
                  <select 
                    className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                  >
                    {Object.values(HealthSeverity).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Protocolo de Tratamento</label>
                <textarea 
                  rows={3}
                  placeholder="Descreva medicamentos, dosagens e procedimentos..."
                  className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 text-sm font-normal leading-normal text-[#20332C] outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all"
                  value={formData.protocol}
                  onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                />
              </div>

              <div className="bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw size={18} className="text-[#64766C] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#20332C] leading-snug">Repetir Manejo?</p>
                      <p className="text-xs font-normal text-[#64766C] leading-normal">Define se o tratamento precisa de nova dose</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-20 border border-[#E3EAE6] bg-white rounded-xl px-3 py-2 text-center text-sm font-semibold text-[#20332C] font-nums outline-none focus:border-[#145C46]"
                      value={formData.repeatAfterDays}
                      onChange={(e) => setFormData({...formData, repeatAfterDays: Number(e.target.value)})}
                    />
                    <span className="text-xs font-medium text-[#64766C]">dias</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-[#E3EAE6]">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-[#E3EAE6] text-[#145C46] focus:ring-[#145C46]"
                    checked={formData.notifyAsReminder}
                    onChange={(e) => setFormData({...formData, notifyAsReminder: e.target.checked})}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#20332C] group-hover:text-[#145C46] transition-colors leading-snug">Gerar tarefa de acompanhamento automaticamente</span>
                    <span className="text-xs font-normal text-[#64766C] leading-normal">Você será notificado no painel geral</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E3EAE6]">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold leading-snug text-[#64766C] hover:bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[#145C46] hover:bg-[#0E4434] text-white text-sm font-semibold leading-snug rounded-xl shadow-xs transition-all active:scale-95"
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
