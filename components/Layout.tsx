
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Beef, 
  Wallet, 
  BrainCircuit, 
  Menu, 
  X,
  LogOut,
  Warehouse,
  Layers,
  Calculator,
  HeartPulse,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  CheckSquare,
  Instagram
} from 'lucide-react';
import { User, Animal, InventoryItem, HealthRecord, HealthSeverity, Task } from '../types';

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
  tasks = []
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Derivando notificações
  const getNotifications = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const notices = [
      // 1. Tarefas Próximas ou Atrasadas
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
      // 2. Saúde Crítica
      ...healthRecords
        .filter(r => r.status === 'Em Tratamento' && r.severity === HealthSeverity.CRITICAL)
        .map(r => ({
          id: `health-${r.id}`,
          title: `Urgência Sanitária: ${r.title}`,
          description: `Animal ${animals.find(a => a.id === r.animalId)?.earTag || ''} em estado crítico.`,
          type: 'error' as const,
          view: 'health'
        })),
      // 3. Estoque Baixo
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
    { id: 'tools', label: 'Ferramentas', icon: <Calculator size={20} /> },
    { id: 'ai-advisor', label: 'Consultor IA', icon: <BrainCircuit size={20} /> },
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
          lg:relative lg:translate-x-0 lg:shadow-xl
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-2">
            <Beef className="text-green-400" size={32} />
            <span className="text-xl font-bold tracking-tight">Gestão Pecuária</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-green-200 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${currentView === item.id 
                  ? 'bg-green-700 text-white shadow-md' 
                  : 'text-green-100 hover:bg-green-800 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-green-800 bg-green-900 space-y-2">
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
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-600 hover:text-gray-900">
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800 hidden md:block">
              {navItems.find(i => i.id === currentView)?.label || 'Painel'}
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
                                {n.type === 'error' ? <AlertTriangle size={18} /> : 
                                 n.type === 'warning' ? <AlertTriangle size={18} /> : 
                                 <Info size={18} />}
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
                  <p className="text-xs text-gray-500 uppercase font-semibold">Admin Fazenda</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-600 border-2 border-green-100 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                  {user.photo ? <img src={user.photo} className="w-full h-full object-cover" alt="User" /> : user.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
