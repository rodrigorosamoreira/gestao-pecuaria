
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
  Sparkles,
  Database
} from 'lucide-react';
import { User, Animal, InventoryItem, HealthRecord, HealthSeverity, Task, Farm } from '../types';
import { APP_LOGO_DATA_URI } from '../src/assets/logoData';
import AdSenseBanner from './AdSenseBanner';

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
  onOpenSupabaseConfig?: () => void;
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
  onOpenResetPassword,
  onOpenSupabaseConfig
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFarmMenuOpen, setIsFarmMenuOpen] = useState(false);

  // Verificação de administrador para funções de infraestrutura / banco
  const MASTER_ADMIN_EMAILS = [
    'rodrigorosamoreira@gmail.com',
    'admin@gestaopeccuaria.com',
    'vivendoapecuaria@gmail.com'
  ];
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(
    user?.role === 'admin' ||
    MASTER_ADMIN_EMAILS.includes(userEmail) ||
    userEmail.includes('admin') ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gestao_pecuaria_admin_unlocked') === 'true')
  );

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
        .map(i => {
          const isZero = i.quantity <= 0;
          return {
            id: `stock-${i.id}`,
            title: isZero ? `Estoque Esgotado: ${i.name}` : `Estoque Mínimo Atingido: ${i.name}`,
            description: isZero 
              ? `Saldo ZERADO! Mínimo de segurança: ${i.minQuantity} ${i.unit}. Clique para reabastecer.`
              : `Saldo atual: ${i.quantity} ${i.unit} (Atingiu o mínimo de ${i.minQuantity} ${i.unit}). Necessário reposição.`,
            type: isZero ? ('error' as const) : ('warning' as const),
            view: 'inventory'
          };
        })
    ];
    return notices;
  };

  const notifications = getNotifications();

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'animals', label: 'Rebanho (Animais)', icon: <Beef size={20} /> },
    { id: 'tasks', label: 'Gestão de Tarefas', icon: <CheckSquare size={20} /> },
    { id: 'health', label: 'Saúde e Manejo', icon: <HeartPulse size={20} /> },
    { id: 'lots', label: 'Gestão de Piquetes', icon: <Layers size={20} /> },
    { id: 'inventory', label: 'Estoque / Insumos', icon: <Warehouse size={20} /> },
    { id: 'finance', label: 'Financeiro', icon: <Wallet size={20} /> },
    { id: 'valor_diario', label: 'Valor da Diária', icon: <DollarSign size={20} /> },
    { id: 'suplementacao', label: 'Suplementação', icon: <Zap size={20} /> },
    { id: 'tools', label: 'Simulador', icon: <Calculator size={20} /> },
    { id: 'market', label: 'Monitor Scot', icon: <BarChart4 size={20} /> },
    { id: 'consultant', label: 'Consultor IA', icon: <Sparkles size={20} /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Efeito para fechar notificações com a tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNotifOpen]);

  return (
    <div className="flex h-screen bg-[#F6F8F5] text-[#20332C] overflow-hidden font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white text-[#20332C] transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 flex flex-col border-r border-[#E3EAE6] shadow-xs
        `}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E3EAE6] shrink-0 bg-white">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-xs border border-[#E3EAE6] overflow-hidden shrink-0">
                <img 
                  src={APP_LOGO_DATA_URI} 
                  alt="Gestão Pecuária" 
                  className="w-full h-full object-cover rounded-lg" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="min-w-0">
                <span className="text-base font-semibold text-[#20332C] block leading-tight truncate">Gestão Pecuária</span>
                <span className="text-xs text-[#145C46] font-medium block">Pecuária de Precisão</span>
              </div>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden text-[#64766C] hover:text-[#20332C] p-1.5 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Farm Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsFarmMenuOpen(!isFarmMenuOpen)}
              className="w-full bg-[#F6F8F5] hover:bg-[#E5F2EB] p-2.5 rounded-xl flex items-center justify-between transition-all group border border-[#E3EAE6] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#145C46] shrink-0 border border-[#E3EAE6]">
                  <Tractor size={14} />
                </div>
                <div className="text-left overflow-hidden">
                   <p className="text-xs font-medium text-[#64766C] leading-none mb-1">Fazenda Ativa</p>
                   <p className="text-sm font-semibold text-[#20332C] truncate leading-tight">{activeFarm?.name || 'Selecionar fazenda...'}</p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-[#64766C] transition-transform duration-200 ${isFarmMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFarmMenuOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setIsFarmMenuOpen(false)}></div>
                <div className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-xl shadow-lg border border-[#E3EAE6] overflow-hidden z-[50] animate-in fade-in slide-in-from-top-1">
                   <div className="p-1 max-h-56 overflow-y-auto">
                      {farms.length > 0 ? (
                        farms.map(farm => (
                          <div key={farm.id} className="group flex items-center pr-1 border-b border-[#F6F8F5] last:border-0">
                            <button 
                              onClick={() => {
                                onSelectFarm?.(farm.id);
                                setIsFarmMenuOpen(false);
                              }}
                              className={`flex-1 p-2.5 rounded-lg text-left transition-colors flex items-center justify-between ${activeFarmId === farm.id ? 'bg-[#DCEDE4] text-[#145C46] font-semibold' : 'text-[#20332C] hover:bg-[#E5F2EB]'}`}
                            >
                              <span className="text-sm truncate">{farm.name}</span>
                              {activeFarmId === farm.id && <CheckCircle2 size={15} className="text-[#145C46]" />}
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteFarm?.(farm.id);
                              }}
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-rose-600 rounded-lg transition-all active:scale-90"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-xs text-[#64766C] text-center font-medium">Nenhuma unidade cadastrada.</p>
                      )}
                   </div>
                   <button 
                    onClick={() => { onCreateFarm?.(); setIsFarmMenuOpen(false); }}
                    className="w-full p-2.5 bg-[#F6F8F5] border-t border-[#E3EAE6] text-[#145C46] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E5F2EB] transition-all cursor-pointer"
                   >
                     <Plus size={14} /> Nova Fazenda / Unidade
                   </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Items with 14px size, weight 500, line-height 1.5, Paleta A Hover (#E5F2EB) and Active (#DCEDE4) */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
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
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium cursor-pointer group leading-normal
                  ${isActive 
                    ? 'bg-[#DCEDE4] text-[#145C46]' 
                    : 'text-[#64766C] hover:bg-[#E5F2EB] hover:text-[#145C46]'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`transition-colors duration-150 ${isActive ? 'text-[#145C46]' : 'text-[#64766C] group-hover:text-[#145C46]'}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.id === 'consultant' && (
                  <span className="text-xs bg-[#145C46]/10 text-[#145C46] font-semibold px-2 py-0.5 rounded">
                    IA
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions & Profile */}
        <div className="p-3 border-t border-[#E3EAE6] bg-[#FAFCFA] shrink-0 space-y-1.5">
          <a 
            href="https://chat.whatsapp.com/HVA8xmp93HYJeCWQRs1g8x" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#E8F4EE] hover:bg-[#DCEDE4] text-[#145C46] font-semibold text-sm border border-[#DCEDE4] transition-all group"
            title="Acesse a Comunidade no WhatsApp"
          >
            <div className="flex items-center space-x-2.5">
              <svg 
                className="w-4 h-4 fill-[#25D366] shrink-0 group-hover:scale-105 transition-transform" 
                viewBox="0 0 24 24"
                role="img"
                aria-label="WhatsApp"
              >
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8.01 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 13.99C16.32 13.86 15.12 13.27 14.9 13.19C14.68 13.1 14.52 13.06 14.36 13.3C14.19 13.55 13.73 14.11 13.59 14.27C13.45 14.44 13.31 14.46 13.07 14.34C12.82 14.21 11.79 13.88 10.57 12.79C9.62 11.94 8.98 10.89 8.85 10.65C8.73 10.4 8.83 10.28 8.96 10.15C9.07 10.04 9.21 9.85 9.33 9.71C9.46 9.57 9.5 9.47 9.58 9.31C9.66 9.14 9.62 9 9.56 8.88C9.5 8.76 9.03 7.6 8.84 7.13C8.65 6.67 8.46 6.73 8.31 6.72C8.18 6.72 8.02 6.72 7.87 6.72L8.53 7.33Z" />
              </svg>
              <span className="truncate">Acessar Comunidade</span>
            </div>
            <span className="text-xs font-semibold bg-[#145C46]/10 text-[#145C46] px-2 py-0.5 rounded shrink-0">VIP</span>
          </a>

          <a 
            href="https://instagram.com.br/vivendoapecuaria" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2.5 text-[#64766C] hover:text-[#20332C] hover:bg-[#E5F2EB] px-3 py-2 rounded-lg w-full transition-all text-sm font-medium"
          >
            <Instagram size={15} className="text-pink-500 shrink-0" />
            <span className="truncate">@vivendoapecuaria</span>
          </a>

          {/* User profile row */}
          <div className="pt-2.5 border-t border-[#E3EAE6] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#145C46] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user.photo ? <img src={user.photo} className="w-full h-full object-cover rounded-lg" alt="User" /> : user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-[#20332C] truncate leading-tight">{user.name}</p>
                <p className="text-xs text-[#64766C] truncate leading-tight mt-0.5 font-normal">
                  {user.provider === 'guest' ? 'Acesso Local' : (isAdmin ? 'Administrador' : 'Proprietário')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {onOpenResetPassword && (
                <button 
                  onClick={onOpenResetPassword}
                  className="p-1.5 text-[#64766C] hover:text-[#145C46] hover:bg-[#E5F2EB] rounded-lg transition-colors cursor-pointer"
                  title="Alterar Senha"
                >
                  <KeyRound size={16} />
                </button>
              )}
              {isAdmin && onOpenSupabaseConfig && (
                <button 
                  onClick={onOpenSupabaseConfig}
                  className="p-1.5 text-[#64766C] hover:text-[#145C46] hover:bg-[#E5F2EB] rounded-lg transition-colors cursor-pointer"
                  title="Configurar Banco (Admin)"
                >
                  <Database size={16} />
                </button>
              )}
              <button 
                onClick={onLogout}
                className="p-1.5 text-[#64766C] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F6F8F5]">
        <header className="sticky top-0 z-30 bg-white border-b border-[#E3EAE6] shadow-xs">
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={toggleSidebar} 
                className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 shrink-0 transition-colors"
                aria-label="Abrir Menu de Navegação"
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-[#64766C] font-normal">
                  <span className="font-semibold text-[#20332C]">
                    {activeFarm ? activeFarm.name : 'Gestão Pecuária'}
                  </span>
                  <span className="text-[#64766C]/60">›</span>
                  <span className="text-[#64766C] truncate">{navItems.find(i => i.id === currentView)?.label || 'Painel'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Quick AI Consultant CTA matching Paleta A */}
              {currentView !== 'consultant' && (
                <button
                  onClick={() => onChangeView('consultant')}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#DCEDE4] hover:bg-[#E5F2EB] border border-[#DCEDE4] text-sm font-semibold text-[#145C46] transition-all active:scale-95 cursor-pointer"
                  title="Abrir Consultoria Zootécnica com Inteligência Artificial"
                >
                  <Sparkles size={16} className="text-[#145C46]" />
                  <span>Consultor Zootécnico IA</span>
                </button>
              )}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2 rounded-lg border transition-all relative ${
                    isNotifOpen 
                      ? 'bg-[#E5F2EB] border-[#DCEDE4] text-[#145C46]' 
                      : 'bg-white border-[#E3EAE6] text-[#64766C] hover:bg-[#F6F8F5] hover:text-[#20332C]'
                  }`}
                  title="Alertas & Notificações"
                  aria-label="Alertas e Notificações"
                  aria-expanded={isNotifOpen}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-xs font-semibold rounded-full flex items-center justify-center ring-2 ring-white font-nums">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    {/* Backdrop cobrindo a tela inteira para evitar toques acidentais em elementos de fundo */}
                    <div 
                      className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity" 
                      onClick={() => setIsNotifOpen(false)}
                      aria-hidden="true"
                    />
                    
                    {/* Dropdown de Notificações com z-index alto e responsividade móvel */}
                    <div 
                      id="notifications-dropdown-panel"
                      className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-[#E3EAE6] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="p-3.5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-[#145C46]" />
                          <span className="font-semibold text-sm text-[#20332C]">Alertas Operacionais</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#64766C] bg-white border border-[#E3EAE6] px-2.5 py-0.5 rounded-md font-nums">
                            {notifications.length} {notifications.length === 1 ? 'pendente' : 'pendentes'}
                          </span>
                          <button 
                            onClick={() => setIsNotifOpen(false)}
                            className="p-1 text-[#64766C] hover:text-[#20332C] hover:bg-[#E5F2EB] rounded-lg transition-colors cursor-pointer"
                            aria-label="Fechar notificações"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-[#E3EAE6]">
                        {notifications.length > 0 ? (
                          notifications.map((n, idx) => (
                            <button 
                              key={`${n.id}-${idx}`}
                              onClick={() => {
                                onChangeView(n.view);
                                setIsNotifOpen(false);
                              }}
                              className="w-full p-3.5 flex gap-3 hover:bg-[#F6F8F5] transition-colors text-left group cursor-pointer"
                            >
                              <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                                n.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                n.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-sky-50 text-sky-600 border border-sky-200'
                              }`}>
                                <AlertTriangle size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#20332C] leading-snug group-hover:text-[#145C46] transition-colors">{n.title}</p>
                                <p className="text-xs text-[#64766C] mt-1 leading-relaxed line-clamp-2">{n.description}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <CheckCircle2 size={36} className="text-[#218568] mx-auto mb-2" />
                            <p className="text-sm text-[#64766C] font-normal">Nenhum alerta pendente na fazenda!</p>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 bg-[#F6F8F5] border-t border-[#E3EAE6] text-center">
                         <button 
                           onClick={() => setIsNotifOpen(false)} 
                           className="text-sm font-semibold text-[#145C46] hover:text-[#0E4434] hover:underline cursor-pointer"
                         >
                           Fechar notificações
                         </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-[#E3EAE6]">
                {user.provider === 'guest' ? (
                  isAdmin ? (
                    <button
                      onClick={onOpenSupabaseConfig}
                      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCEDE4] hover:bg-[#E5F2EB] border border-[#DCEDE4] text-xs font-medium text-[#145C46] transition-colors cursor-pointer"
                      title="Modo Local: Dados salvos no seu dispositivo. Clique para configurar conexão com a nuvem."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#145C46]" />
                      <span>Modo Local</span>
                    </button>
                  ) : (
                    <div
                      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCEDE4] border border-[#DCEDE4] text-xs font-medium text-[#145C46] select-none"
                      title="Modo Local: Seus dados estão salvos com segurança neste dispositivo."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#145C46]" />
                      <span>Modo Local</span>
                    </div>
                  )
                ) : (
                  isAdmin ? (
                    <button
                      onClick={onOpenSupabaseConfig}
                      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F6F8F5] hover:bg-[#E5F2EB] border border-[#E3EAE6] text-xs font-medium text-[#20332C] transition-colors cursor-pointer"
                      title="Sincronização em nuvem ativa. Clique para gerenciar o banco."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#145C46]" />
                      <span>Nuvem</span>
                    </button>
                  ) : (
                    <div
                      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F6F8F5] border border-[#E3EAE6] text-xs font-medium text-[#20332C] select-none"
                      title="Sincronização em nuvem ativa."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#145C46]" />
                      <span>Nuvem</span>
                    </div>
                  )
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-[#20332C] truncate max-w-[140px] leading-tight">{user.name}</p>
                  <p className="text-xs text-[#145C46] font-normal leading-tight mt-0.5">
                    {user.provider === 'guest' ? 'Acesso Local' : 'Proprietário'}
                  </p>
                </div>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#145C46] text-white flex items-center justify-center font-semibold text-xs shadow-xs overflow-hidden shrink-0">
                  {user.photo ? <img src={user.photo} className="w-full h-full object-cover" alt="User" /> : user.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 bg-[#F6F8F5] flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <div className="mt-8 shrink-0">
            <AdSenseBanner />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
