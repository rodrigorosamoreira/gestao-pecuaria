
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
  Trash2,
  KeyRound,
  BarChart4,
  Sparkles
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
  onOpenResetPassword?: () => void;
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
  onCreateFarm,
  onOpenResetPassword
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
    { id: 'market', label: 'Monitor Scot', icon: <BarChart4 size={20} /> },
    { id: 'consultant', label: 'Consultor IA', icon: <Sparkles size={20} /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-70 bg-emerald-950 text-slate-100 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:shadow-xl flex flex-col border-r border-emerald-900/60
        `}
      >
        <div className="p-5 border-b border-emerald-900/80 shrink-0 bg-emerald-950/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30">
                <Beef size={22} />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white block leading-tight">Gestão Pecuária</span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Pecuária de Precisão</span>
              </div>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden text-emerald-300 hover:text-white p-1 rounded-lg">
              <X size={22} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsFarmMenuOpen(!isFarmMenuOpen)}
              className="w-full bg-emerald-900/80 hover:bg-emerald-900 p-3.5 rounded-xl flex items-center justify-between transition-all group border border-emerald-800/80 shadow-inner active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center text-emerald-200 shrink-0 border border-emerald-600/40">
                  <Tractor size={16} />
                </div>
                <div className="text-left overflow-hidden">
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fazenda Ativa</p>
                   <p className="text-xs font-bold text-white truncate">{activeFarm?.name || 'Selecionar fazenda...'}</p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-emerald-400 transition-transform duration-200 ${isFarmMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFarmMenuOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setIsFarmMenuOpen(false)}></div>
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2">
                   <div className="p-1.5 max-h-60 overflow-y-auto">
                      {farms.length > 0 ? (
                        farms.map(farm => (
                          <div key={farm.id} className="group flex items-center pr-1 border-b border-slate-100 last:border-0">
                            <button 
                              onClick={() => {
                                onSelectFarm?.(farm.id);
                                setIsFarmMenuOpen(false);
                              }}
                              className={`flex-1 p-3 rounded-lg text-left transition-colors flex items-center justify-between ${activeFarmId === farm.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              <span className="text-xs truncate">{farm.name}</span>
                              {activeFarmId === farm.id && <CheckCircle2 size={15} className="text-emerald-600" />}
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteFarm?.(farm.id);
                              }}
                              className="p-2 text-slate-300 hover:text-white hover:bg-rose-600 rounded-lg transition-all active:scale-90"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-xs text-slate-400 text-center font-bold">Nenhuma unidade cadastrada.</p>
                      )}
                   </div>
                   <button 
                    onClick={() => { onCreateFarm?.(); setIsFarmMenuOpen(false); }}
                    className="w-full p-3 bg-slate-50 border-t border-slate-100 text-emerald-700 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                   >
                     <Plus size={14} /> Nova Fazenda / Unidade
                   </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 my-3 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-medium text-xs
                  ${isActive 
                    ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-400/40' 
                    : 'text-emerald-200/90 hover:bg-emerald-900/60 hover:text-white'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={isActive ? 'text-white' : 'text-emerald-400/90'}>{item.icon}</div>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.id === 'consultant' && (
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">IA</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-emerald-900/80 bg-emerald-950/90 shrink-0 space-y-1">
          <a 
            href="https://instagram.com.br/vivendoapecuaria" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 text-emerald-200/90 bg-emerald-900/40 hover:bg-pink-600 hover:text-white px-3.5 py-2.5 rounded-xl w-full transition-all font-bold text-xs group border border-emerald-800/40"
          >
            <Instagram size={18} className="group-hover:scale-110 transition-transform text-pink-400 group-hover:text-white" />
            <span className="truncate">@vivendoapecuaria</span>
          </a>
          {onOpenResetPassword && (
            <button 
              onClick={onOpenResetPassword}
              className="flex items-center space-x-3 text-emerald-300 hover:text-white px-3.5 py-2 w-full transition-colors font-medium text-xs"
            >
              <KeyRound size={17} />
              <span>Alterar Senha</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-emerald-300/80 hover:text-rose-400 px-3.5 py-2 w-full transition-colors font-medium text-xs"
          >
            <LogOut size={17} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 shadow-xs z-10">
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{navItems.find(i => i.id === currentView)?.label || 'Painel'}</span>
                  {activeFarm && (
                    <>
                      <span className="text-slate-300 font-light">|</span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">{activeFarm.name}</span>
                    </>
                  )}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2 rounded-xl border transition-all relative ${isNotifOpen ? 'bg-slate-100 border-slate-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  title="Alertas & Notificações"
                >
                  <Bell size={19} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800">Alertas Operacionais</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{notifications.length} Pendentes</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length > 0 ? (
                          notifications.map((n, idx) => (
                            <button 
                              key={`${n.id}-${idx}`}
                              onClick={() => {
                                onChangeView(n.view);
                                setIsNotifOpen(false);
                              }}
                              className="w-full p-3.5 flex gap-3 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                                n.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                n.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-sky-50 text-sky-600 border border-sky-200'
                              }`}>
                                <AlertTriangle size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{n.description}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-medium">Nenhum alerta pendente na fazenda!</p>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                         <button onClick={() => setIsNotifOpen(false)} className="text-[11px] font-bold text-emerald-700 hover:underline uppercase tracking-wider">Fechar Notificações</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Proprietário</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs overflow-hidden">
                  {user.photo ? <img src={user.photo} className="w-full h-full object-cover" alt="User" /> : user.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
