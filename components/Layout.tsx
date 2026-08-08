
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Beef, 
  Wallet, 
  Menu, 
  X,
  LogOut,
  Warehouse,
  Layers,
  Calculator,
  HeartPulse,
  Bell,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Instagram,
  DollarSign,
  Zap,
  ChevronDown,
  Tractor,
  Plus,
  Trash2
} from 'lucide-react';
import { User, Animal, InventoryItem, HealthRecord, HealthSeverity, Task, Farm } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  user: User;
  animals?: Animal[];
  inventory?: InventoryItem[];
  healthRecords?: HealthRecord[];
  tasks?: Task[];
  farms?: Farm[];
  activeFarmId?: string | null;
  onSelectFarm?: (id: string) => void;
  onDeleteFarm?: (id: string) => void;
  onCreateFarm?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  onLogout, 
  user,
  animals = [],
  inventory = [],
  healthRecords = [],
  tasks = [],
  farms = [],
  activeFarmId = null,
  onSelectFarm,
  onDeleteFarm,
  onCreateFarm
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFarmMenuOpen, setIsFarmMenuOpen] = useState(false);

  const activeFarm = farms.find(f => f.id === activeFarmId);

  const getNotifications = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const notices = [
      ...tasks
        .filter(t => t.status === 'Pendente' && new Date(t.dueDate) <= today)
        .map(t => {
          const isLate = new Date(t.dueDate) < today;
          return {
            id: `task-${t.id}`,
            title: isLate ? `Tarefa Atrasada: ${t.description}` : `Tarefa Vence Hoje: ${t.description}`,
            description: `Responsável: ${t.responsible}. Prazo: ${new Date(t.dueDate).toLocaleDateString('pt-BR')}`,
            type: 'error' as const,
            view: 'tasks'
          };
        }),
      ...healthRecords
        .filter(r => r.status === 'Em Tratamento' && r.severity === HealthSeverity.CRITICAL)
        .map(r => ({
          id: `health-${r.id}`,
          title: `Urgência Sanitária: ${r.title}`,
          description: `Animal ${animals.find(a => a.id === r.animalId)?.earTag || ''} em estado crítico.`,
          type: 'error' as const,
          view: 'health'
        })),
      ...inventory
        .filter(i => i.quantity <= i.minQuantity)
        .map(i => ({
          id: `stock-${i.id}`,
          title: `Estoque Baixo: ${i.name}`,
          description: `Apenas ${i.quantity} ${i.unit} restantes (Mínimo: ${i.minQuantity}).`,
          type: 'warning' as const,
          view: 'inventory'
        }))
    ];
    return notices;
  };

  const notifications = getNotifications();

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'animals', label: 'Rebanho (Animais)', icon: <Beef size={20} /> },
    { id: 'tasks', label: 'Gestão de Tarefas', icon: <CheckSquare size={20} /> },
    { id: 'health', label: 'Saúde e Manejo', icon: <HeartPulse size={20} /> },
    { id: 'lots', label: 'Gestão de Lotes', icon: <Layers size={20} /> },
    { id: 'inventory', label: 'Estoque / Insumos', icon: <Warehouse size={20} /> },
    { id: 'finance', label: 'Financeiro', icon: <Wallet size={20} /> },
    { id: 'valor_diario', label: 'Valor Diário', icon: <DollarSign size={20} /> },
    { id: 'suplementacao', label: 'Suplementação', icon: <Zap size={20} /> },
    { id: 'tools', label: 'Simulador', icon: <Calculator size={20} /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-green-900 text-white transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:shadow-xl flex flex-col
        `}
      >
        <div className="p-6 border-b border-green-800 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Beef className="text-green-400" size={32} />
              <span className="text-xl font-bold tracking-tight">Gestão Pecuária</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden text-green-200 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsFarmMenuOpen(!isFarmMenuOpen)}
              className="w-full bg-green-800 hover:bg-green-700 p-4 rounded-2xl flex items-center justify-between transition-all group border border-green-700 shadow-lg active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white">
                  <Tractor size={16} />
                </div>
                <div className="text-left overflow-hidden">
                   <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Unidade Selecionada</p>
                   <p className="text-sm font-bold truncate">{activeFarm?.name || 'Selecionar...'}</p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-green-400 transition-transform ${isFarmMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFarmMenuOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setIsFarmMenuOpen(false)}></div>
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[50] animate-in slide-in-from-top-2">
                   <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {farms.length > 0 ? (
                        farms.map(farm => (
                          <div key={farm.id} className="group flex items-center pr-2 border-b border-gray-50 last:border-0">
                            <button 
                              onClick={() => {
                                onSelectFarm?.(farm.id);
                                setIsFarmMenuOpen(false);
                              }}
                              className={`flex-1 p-4 rounded-xl text-left transition-colors flex items-center justify-between ${activeFarmId === farm.id ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="font-bold text-sm truncate">{farm.name}</span>
                              {activeFarmId === farm.id && <CheckCircle2 size={16} />}
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteFarm?.(farm.id);
                              }}
                              className="p-3 text-gray-300 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm active:scale-90"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-xs text-gray-400 text-center font-bold">Nenhuma unidade cadastrada.</p>
                      )}
                   </div>
                   <button 
                    onClick={() => { onCreateFarm?.(); setIsFarmMenuOpen(false); }}
                    className="w-full p-4 bg-gray-50 border-t border-gray-100 text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all"
                   >
                     <Plus size={14} /> Nova Unidade
                   </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                ${currentView === item.id 
                  ? 'bg-green-700 text-white shadow-md' 
                  : 'text-green-100 hover:bg-green-800 hover:text-white'}
              `}
            >
              <div className={currentView === item.id ? 'text-green-400' : ''}>{item.icon}</div>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-green-800 bg-green-900 shrink-0 space-y-2">
          <a 
            href="https://instagram.com.br/vivendoapecuaria" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 text-green-100 bg-green-800/50 hover:bg-pink-600 px-4 py-3 rounded-xl w-full transition-all font-bold text-sm shadow-sm group"
          >
            <Instagram size={20} className="group-hover:scale-110 transition-transform" />
            <span>@vivendoapecuaria</span>
          </a>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-green-300 hover:text-red-400 px-4 py-2 w-full transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10 border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-600 hover:text-gray-900">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter hidden md:block">
              {navItems.find(i => i.id === currentView)?.label || 'Painel'}
              <span className="mx-3 text-gray-300 font-light">|</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">{activeFarm?.name}</span>
            </h1>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2 rounded-full transition-all relative ${isNotifOpen ? 'bg-gray-100 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Alertas Urgentes</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{notifications.length} Pendências</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <button 
                              key={n.id}
                              onClick={() => {
                                onChangeView(n.view);
                                setIsNotifOpen(false);
                              }}
                              className="w-full p-4 border-b border-gray-50 flex gap-4 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                                n.type === 'error' ? 'bg-red-50 text-red-600' :
                                n.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                <AlertTriangle size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800 leading-tight">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{n.description}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-10 text-center">
                            <CheckCircle2 size={40} className="text-green-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-medium">Tudo em ordem na fazenda!</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 text-center">
                         <button onClick={() => setIsNotifOpen(false)} className="text-[10px] font-bold text-green-700 hover:underline uppercase">Fechar Painel</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Proprietário</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-600 border-2 border-green-100 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                  {user.photo ? <img src={user.photo} className="w-full h-full object-cover" alt="User" /> : user.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
