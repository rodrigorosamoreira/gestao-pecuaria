
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
      id: Date.now().toString()
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Agenda de Tarefas</h2>
          <p className="text-gray-500 text-sm">Controle operacional e cronograma da fazenda</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Nova Tarefa
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por tarefa ou responsável..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold text-gray-700"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="Todas">Todas as Tarefas</option>
          <option value="Pendente">Apenas Pendentes</option>
          <option value="Concluída">Concluídas</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div key={task.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${task.status === 'Concluída' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                  task.priority === TaskPriority.HIGH ? 'bg-red-100 text-red-700' :
                  task.priority === TaskPriority.MEDIUM ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  Prioridade {task.priority}
                </span>
                <div className="flex gap-1">
                   <button onClick={() => toggleStatus(task)} className={`p-2 rounded-lg transition-all ${task.status === 'Concluída' ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-green-600 hover:bg-green-50'}`}>
                    <CheckCircle2 size={20} />
                  </button>
                  <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <h3 className={`text-lg font-bold text-gray-800 mb-4 ${task.status === 'Concluída' ? 'line-through' : ''}`}>
                {task.description}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className={task.status === 'Pendente' && isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-400'} />
                  <span className={`font-medium ${task.status === 'Pendente' && isOverdue(task.dueDate) ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    Vence em: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    {task.status === 'Pendente' && isOverdue(task.dueDate) && ' (Atrasada!)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">Responsável: {task.responsible}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'Concluída' ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`} />
                  <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{task.status}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <CheckSquare size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Nenhuma tarefa encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descrição *</label>
                <textarea 
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all min-h-[100px]"
                  placeholder="Ex: Consertar cerca do piquete 4, carregar bezerros..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Data Limite *</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Prioridade</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all font-bold"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                  >
                    <option value={TaskPriority.LOW}>Baixa</option>
                    <option value={TaskPriority.MEDIUM}>Média</option>
                    <option value={TaskPriority.HIGH}>Alta</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Responsável *</label>
                <input 
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="Ex: João, Equipe B..."
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase text-xs tracking-widest"
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
