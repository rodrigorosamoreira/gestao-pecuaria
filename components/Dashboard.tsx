
import React from 'react';
import ScotQuoteBar from './ScotQuoteBar';
import PartnersBanner from './PartnersBanner';
import AdSenseBanner from './AdSenseBanner';
import { Animal, Transaction, AnimalStatus, TransactionType, InventoryItem, HealthRecord, HealthSeverity, AnimalGender, User, Lot } from '../types';
import { 
  TrendingUp, 
  Users, 
  Scale, 
  AlertTriangle,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ChevronRight,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { calculateLotWeighingStats, getTodayDateString } from '../services/weightService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  animals: Animal[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  healthRecords?: HealthRecord[];
  lots?: Lot[];
  onChangeView?: (view: string) => void;
  currentUser?: User | null;
}

const COLORS = ['#145C46', '#218568', '#536579', '#D97706', '#0284C7', '#7C3AED', '#E11D48'];

const Dashboard: React.FC<DashboardProps> = ({ animals, transactions, inventory, healthRecords = [], lots = [], onChangeView, currentUser }) => {
  // Calculate Stats
  const activeAnimals = animals.filter(a => a.status === AnimalStatus.ACTIVE);
  const totalAnimals = activeAnimals.length;
  
  const males = activeAnimals.filter(a => a.gender === AnimalGender.MALE).length;
  const females = activeAnimals.filter(a => a.gender === AnimalGender.FEMALE).length;
  
  const todayStr = getTodayDateString();
  const herdStats = calculateLotWeighingStats(activeAnimals, todayStr, lots);
  const avgWeightKg = herdStats.avgRecordedWeightKg;
  const avgGmd = herdStats.avgGmd;

  const totalBalance = transactions.reduce((acc, t) => 
    t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0
  );

  const healthAlerts = healthRecords.filter(r => r.status === 'Em Tratamento').length;
  const stockAlerts = inventory.filter(i => i.quantity <= i.minQuantity).length;

  // Derivando Pendências Críticas para o Widget
  // Fix: Added explicit type annotation to urgentTasks to allow accessing optional properties like animal and subtitle
  const urgentTasks: Array<{
    id: string;
    type: string;
    title: string;
    animal?: string;
    subtitle?: string;
    severity: string;
  }> = [
    ...healthRecords.filter(r => r.status === 'Em Tratamento' && r.severity === HealthSeverity.CRITICAL).map(r => ({
        id: `health-crit-${r.id}`,
        type: 'health-critical',
        title: `CRÍTICO: ${r.title}`,
        animal: animals.find(a => a.id === r.animalId)?.earTag,
        severity: 'high'
    })),
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({
        id: `stock-${i.id}`,
        type: 'stock',
        title: `Repor ${i.name}`,
        subtitle: `${i.quantity} ${i.unit} restantes`,
        severity: 'medium'
    })),
    ...healthRecords.filter(r => r.status === 'Em Tratamento' && r.notifyAsReminder && r.repeatAfterDays).map(r => ({
        id: `health-rem-${r.id}`,
        type: 'management',
        title: `Manejo: ${r.title}`,
        animal: animals.find(a => a.id === r.animalId)?.earTag,
        severity: 'low'
    }))
  ].slice(0, 4);

  // Chart Data: Financial Flow (Last 6 months)
  const lastMonths = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleString('pt-BR', { month: 'short' }),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      income: 0,
      expense: 0
    };
  });

  // Populate financial evolution data from transactions
  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const m = lastMonths.find(lm => lm.monthIndex === tDate.getMonth() && lm.year === tDate.getFullYear());
    if (m) {
      if (t.type === TransactionType.INCOME) {
        m.income += t.amount;
      } else {
        m.expense += t.amount;
      }
    }
  });

  // Chart Data: Expense Categories
  const categoryMap = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: categoryMap[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header matching Paleta A AgroTech Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#20332C] leading-snug">
            Painel Operacional & Indicadores
          </h2>
          <p className="text-sm text-[#64766C] mt-1 leading-relaxed">
            Métricas zootécnicas, ganho de peso (GMD) e saúde do rebanho em tempo real.
          </p>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E3EAE6] rounded-lg text-xs font-medium text-[#20332C] shadow-xs">
          <Calendar size={15} className="text-[#145C46]" />
          <span>Hoje: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Banner de Cotação Regional Scot Consultoria */}
      <ScotQuoteBar 
        compact={true} 
        onNavigateToCalculators={() => onChangeView?.('tools')} 
      />

      {/* Banner de Parceiros do Agro - 3 Espaços */}
      <PartnersBanner currentUser={currentUser} />

      {/* Resumo do Rebanho & KPIs Principais */}
      <div className="space-y-4">
        <div className="agro-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#E3EAE6]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#DCEDE4] text-[#145C46] shrink-0 border border-[#DCEDE4]">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#20332C] leading-normal">Resumo Detalhado do Rebanho</h3>
                <p className="text-xs text-[#64766C] mt-0.5">Métricas consolidadas de contagem, peso e GMD</p>
              </div>
            </div>
            <button 
              onClick={() => onChangeView?.('animals')}
              className="self-start sm:self-auto text-sm font-semibold text-[#145C46] hover:text-[#0E4434] bg-[#DCEDE4] hover:bg-[#E5F2EB] px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Ver Rebanho Completo →
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6]">
              <p className="text-xs font-medium text-[#64766C]">Total Ativo</p>
              <p className="text-2xl font-semibold text-[#20332C] font-nums mt-1 leading-tight">
                {totalAnimals} <span className="text-sm font-normal text-[#64766C] ml-1">cab.</span>
              </p>
              <p className="text-xs text-[#64766C] mt-1 font-normal">Rebanho total</p>
            </div>
            
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6]">
              <p className="text-xs font-medium text-[#64766C]">Média Balança</p>
              <p className="text-2xl font-semibold text-[#20332C] font-nums mt-1 leading-tight">
                {herdStats.avgRecordedArroba.toFixed(1)} <span className="text-sm font-normal text-[#64766C] ml-1">@</span>
              </p>
              <p className="text-xs text-[#64766C] font-normal font-nums mt-1">{herdStats.avgRecordedWeightKg.toFixed(1)} kg/cab</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#DCEDE4]/60 border border-[#DCEDE4]">
              <p className="text-xs font-medium text-[#145C46]">GMD Médio</p>
              <p className="text-2xl font-semibold text-[#145C46] font-nums mt-1 leading-tight">
                +{herdStats.avgGmd.toFixed(3)} <span className="text-sm font-normal text-[#218568] ml-1">kg/d</span>
              </p>
              <p className="text-xs text-[#218568] font-normal mt-1">Ganho Médio Diário</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#DCEDE4]/80 to-white border border-[#DCEDE4]">
              <p className="text-xs font-semibold text-[#145C46] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#145C46]" /> Peso Previsto
              </p>
              <p className="text-2xl font-semibold text-[#145C46] font-nums mt-1 leading-tight">
                {herdStats.avgPredictedArroba.toFixed(1)} <span className="text-sm font-semibold text-[#218568] ml-1">@</span>
              </p>
              <p className="text-xs text-[#218568] font-medium font-nums mt-1">{herdStats.avgPredictedWeightKg.toFixed(1)} kg hoje</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6]">
              <p className="text-xs font-medium text-[#64766C]">Machos</p>
              <div className="flex items-baseline gap-2 mt-1 leading-tight">
                <span className="text-2xl font-semibold text-[#20332C] font-nums">{males}</span>
                <span className="text-xs text-[#64766C] font-normal">({totalAnimals > 0 ? ((males/totalAnimals)*100).toFixed(0) : 0}%)</span>
              </div>
              <p className="text-xs text-[#64766C] mt-1 font-normal">Bois e bezerros</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F6F8F5] border border-[#E3EAE6]">
              <p className="text-xs font-medium text-[#64766C]">Fêmeas</p>
              <div className="flex items-baseline gap-2 mt-1 leading-tight">
                <span className="text-2xl font-semibold text-[#20332C] font-nums">{females}</span>
                <span className="text-xs text-[#64766C] font-normal">({totalAnimals > 0 ? ((females/totalAnimals)*100).toFixed(0) : 0}%)</span>
              </div>
              <p className="text-xs text-[#64766C] mt-1 font-normal">Vacas e novilhas</p>
            </div>
          </div>
        </div>

        {/* Cards Rápidos de Indicadores Financeiros e Saúde com +15% de respiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="agro-card p-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-[#64766C]">Saldo em Caixa</p>
                <h3 className={`text-2xl font-semibold mt-1 font-nums leading-tight ${totalBalance >= 0 ? 'text-[#145C46]' : 'text-rose-600'}`}>
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-[#64766C] mt-1 font-normal">Saldo acumulado</p>
              </div>
              <div className={`p-3 rounded-xl border ${totalBalance >= 0 ? 'bg-[#DCEDE4] text-[#145C46] border-[#DCEDE4]' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <Wallet size={22} />
              </div>
            </div>
          </div>

          <div className="agro-card p-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-[#64766C]">Casos de Saúde</p>
                <h3 className={`text-2xl font-semibold mt-1 font-nums leading-tight ${healthAlerts > 0 ? 'text-rose-600' : 'text-[#20332C]'}`}>{healthAlerts}</h3>
                <p className="text-xs text-[#64766C] mt-1 font-normal">Animais em tratamento</p>
              </div>
              <div className={`p-3 rounded-xl border ${healthAlerts > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-[#F6F8F5] text-[#64766C] border-[#E3EAE6]'}`}>
                <HeartPulse size={22} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => onChangeView?.('inventory')}
            className="agro-card p-5 sm:p-6 cursor-pointer hover:border-[#145C46]/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-[#64766C] group-hover:text-[#145C46] transition-colors">Estoque Baixo</p>
                <h3 className={`text-2xl font-semibold mt-1 font-nums leading-tight ${stockAlerts > 0 ? 'text-amber-700' : 'text-[#20332C]'}`}>{stockAlerts}</h3>
                <p className="text-xs text-[#64766C] mt-1 font-normal">Insumos em nível crítico</p>
              </div>
              <div className={`p-3 rounded-xl border ${stockAlerts > 0 ? 'bg-amber-50 text-amber-700 border-amber-200 group-hover:scale-105' : 'bg-[#F6F8F5] text-[#64766C] border-[#E3EAE6]'} transition-transform`}>
                <Package size={22} />
              </div>
            </div>
          </div>

          <div className="agro-card p-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-[#64766C]">Arroba Média</p>
                <h3 className="text-2xl font-semibold text-[#20332C] mt-1 font-nums leading-tight">
                  {(avgWeightKg / 30).toFixed(1)} <span className="text-sm font-normal text-[#64766C] ml-1">@</span>
                </h3>
                <p className="text-xs text-[#64766C] mt-1 font-normal">Desempenho por cabeça</p>
              </div>
              <div className="p-3 bg-[#F6F8F5] text-[#145C46] rounded-xl border border-[#E3EAE6]">
                <Scale size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intervalo com Bloco AdSense Responsivo */}
      <AdSenseBanner className="my-1" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico de Fluxo de Caixa */}
        <div className="lg:col-span-8 agro-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#E3EAE6]">
            <div>
              <h3 className="text-base font-semibold text-[#20332C] flex items-center gap-2">
                <BarChart3 size={18} className="text-[#145C46] shrink-0" /> Evolução Financeira
              </h3>
              <p className="text-xs text-[#64766C] mt-0.5 font-normal">Receitas x Despesas nos últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium self-start sm:self-auto">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#145C46]"></div> <span className="text-[#64766C]">Receita</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> <span className="text-[#64766C]">Despesa</span></div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastMonths}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#145C46" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#145C46" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3EAE6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64766C'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64766C'}} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '10px', border: '1px solid #E3EAE6', boxShadow: '0 2px 8px rgba(32,51,44,0.06)', fontSize: '13px'}} 
                  formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#145C46" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget de Pendências Críticas */}
        <div className="lg:col-span-4 agro-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E3EAE6]">
              <h3 className="text-base font-semibold text-[#20332C] flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" /> Ações Urgentes
              </h3>
              <span className="text-amber-800 bg-amber-50 text-xs font-medium px-2.5 py-0.5 rounded-md border border-amber-200">Manejo do Dia</span>
            </div>

            <div className="space-y-3">
              {urgentTasks.length > 0 ? (
                  urgentTasks.map((task, idx) => (
                      <div key={`${task.id}-${idx}`} className="p-3 rounded-xl border border-[#E3EAE6] bg-[#F6F8F5]/80 hover:bg-white hover:border-[#218568]/40 hover:shadow-xs transition-all flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg shrink-0 border ${
                              task.severity === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                              task.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-[#DCEDE4] text-[#145C46] border-[#145C46]/20'
                          }`}>
                              {task.type === 'stock' ? <Package size={16} /> : <HeartPulse size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#20332C] truncate">{task.title}</p>
                              <p className="text-xs text-[#64766C] mt-0.5">
                                  {task.animal ? `Brinco ${task.animal}` : task.subtitle}
                              </p>
                          </div>
                          <ChevronRight size={16} className="text-[#64766C]/60 shrink-0" />
                      </div>
                  ))
              ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                      <div className="p-3 bg-[#DCEDE4] text-[#145C46] rounded-full mb-3 border border-[#145C46]/20">
                          <TrendingUp size={24} />
                      </div>
                      <p className="text-sm font-semibold text-[#20332C]">Tudo Atualizado!</p>
                      <p className="text-xs text-[#64766C] mt-1 font-normal">Nenhuma pendência crítica detectada no momento.</p>
                  </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => onChangeView?.('health')}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#F6F8F5] text-sm font-semibold text-[#20332C] hover:bg-[#DCEDE4] hover:text-[#145C46] transition-all border border-[#E3EAE6]"
          >
            Ver Todos os Manejos →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Gastos */}
        <div className="agro-card p-5 sm:p-6">
          <h3 className="text-base font-semibold text-[#20332C] mb-5 pb-3 border-b border-[#E3EAE6] flex items-center gap-2">
            <PieChartIcon size={18} className="text-[#145C46] shrink-0" /> Gastos por Categoria
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#E3EAE6]">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs font-normal text-[#64766C]">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto font-semibold text-[#20332C] font-nums shrink-0">R$ {entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lembretes Próximos */}
        <div className="agro-card p-5 sm:p-6">
          <h3 className="text-base font-semibold text-[#20332C] mb-5 pb-3 border-b border-[#E3EAE6] flex items-center gap-2">
            <Calendar size={18} className="text-[#145C46] shrink-0" /> Agenda de Manejos
          </h3>
          <div className="space-y-3">
            {healthRecords.filter(r => r.status === 'Em Tratamento').slice(0, 5).map((r, idx) => (
                <div key={`${r.id}-${idx}`} className="flex items-center justify-between p-3.5 border border-[#E3EAE6] bg-[#F6F8F5]/60 rounded-xl hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#DCEDE4] text-[#145C46] font-semibold text-sm flex items-center justify-center border border-[#145C46]/20">
                            {new Date(r.startDate).getDate()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#20332C]">{r.title}</p>
                            <p className="text-xs text-[#64766C] mt-0.5">Animal: Brinco {animals.find(a => a.id === r.animalId)?.earTag || '-'}</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-[#145C46] bg-[#DCEDE4] border border-[#145C46]/20 px-2.5 py-1 rounded-md">Em Tratamento</span>
                </div>
            ))}
            {healthRecords.filter(r => r.status === 'Em Tratamento').length === 0 && (
                <p className="text-center py-10 text-sm text-[#64766C] font-normal italic">Nenhum manejo agendado para os próximos dias.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
