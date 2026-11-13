
import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  User, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Search, 
  Clock,
  Trash2
} from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todas' | 'Pendente' | 'Concluída'>('Todas');

  const [formData, setFormData] = useState<Partial<Task>>({
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: TaskPriority.MEDIUM,
    responsible: '',
    status: 'Pendente'
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todas' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.responsible) return;

    onAddTask({
      ...formData as Task,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    });
    setIsModalOpen(false);
    setFormData({
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: TaskPriority.MEDIUM,
      responsible: '',
      status: 'Pendente'
    });
  };

  const toggleStatus = (task: Task) => {
    onUpdateTask({
      ...task,
      status: task.status === 'Pendente' ? 'Concluída' : 'Pendente'
    });
  };

  const isOverdue = (date: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(date) < today;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug">Agenda de Tarefas</h2>
          <p className="text-sm text-[#64766C] font-normal mt-0.5">Controle operacional e cronograma da fazenda</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#145C46] hover:bg-[#0E4434] text-white px-4.5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-[#E3EAE6] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por tarefa ou responsável..." 
            className="w-full pl-10 pr-4 py-2.5 border border-[#E3EAE6] rounded-xl outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm text-[#20332C] placeholder:text-[#64766C]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border border-[#E3EAE6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] font-medium text-sm text-[#20332C] cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="Todas">Todas as Tarefas</option>
          <option value="Pendente">Apenas Pendentes</option>
          <option value="Concluída">Concluídas</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task, idx) => (
            <div key={`${task.id}-${idx}`} className={`bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border transition-all hover:border-[#145C46]/40 ${task.status === 'Concluída' ? 'opacity-65 border-[#E3EAE6]' : 'border-[#E3EAE6]'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  task.priority === TaskPriority.HIGH ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  task.priority === TaskPriority.MEDIUM ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-[#DCEDE4] text-[#145C46] border border-[#145C46]/20'
                }`}>
                  Prioridade {task.priority}
                </span>
                <div className="flex gap-1">
                   <button onClick={() => toggleStatus(task)} className={`p-1.5 rounded-lg transition-all ${task.status === 'Concluída' ? 'text-[#145C46] bg-[#DCEDE4]' : 'text-[#64766C] hover:text-[#145C46] hover:bg-[#DCEDE4]'}`}>
                    <CheckCircle2 size={18} />
                  </button>
                  <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-[#64766C] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className={`text-base font-semibold text-[#20332C] mb-3 leading-snug ${task.status === 'Concluída' ? 'line-through text-[#64766C]' : ''}`}>
                {task.description}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Clock size={15} className={task.status === 'Pendente' && isOverdue(task.dueDate) ? 'text-rose-600' : 'text-[#64766C]'} />
                  <span className={`font-normal ${task.status === 'Pendente' && isOverdue(task.dueDate) ? 'text-rose-600 font-medium' : 'text-[#64766C]'}`}>
                    Vence em: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    {task.status === 'Pendente' && isOverdue(task.dueDate) && ' (Atrasada!)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64766C]">
                  <User size={15} className="text-[#64766C]" />
                  <span className="font-normal">Responsável: {task.responsible}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E3EAE6] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'Concluída' ? 'bg-[#145C46]' : 'bg-amber-500'}`} />
                  <span className="text-xs font-medium text-[#64766C]">{task.status}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-[#E3EAE6] flex flex-col items-center justify-center text-[#64766C]">
            <CheckSquare size={42} className="mb-3 opacity-20" />
            <p className="text-sm font-normal">Nenhuma tarefa encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-150 border border-[#E3EAE6]">
            <div className="px-6 py-4.5 border-b border-[#E3EAE6] flex justify-between items-center bg-[#F6F8F5]">
              <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64766C] hover:text-[#20332C] p-1.5 hover:bg-white rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Descrição *</label>
                <textarea 
                  required
                  className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all min-h-[90px] text-sm font-normal leading-normal text-[#20332C]"
                  placeholder="Ex: Consertar cerca do piquete 4, carregar bezerros..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Data Limite *</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-[#E3EAE6] rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal leading-normal text-[#20332C]"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium leading-snug text-[#64766C]">Prioridade</label>
                  <select 
                    className="w-full border border-[#E3EAE6] rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal leading-normal text-[#20332C]"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                  >
                    <option value={TaskPriority.LOW}>Baixa</option>
                    <option value={TaskPriority.MEDIUM}>Média</option>
                    <option value={TaskPriority.HIGH}>Alta</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Responsável *</label>
                <input 
                  type="text"
                  required
                  className="w-full border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal leading-normal text-[#20332C]"
                  placeholder="Ex: João, Equipe B..."
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold leading-snug text-[#64766C] hover:bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#145C46] hover:bg-[#0E4434] text-white py-2.5 rounded-xl text-sm font-semibold leading-snug shadow-xs transition-all active:scale-95"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
