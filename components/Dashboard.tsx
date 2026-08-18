
import React from 'react';
import ScotQuoteBar from './ScotQuoteBar';
import PartnersBanner from './PartnersBanner';
import { Animal, Transaction, AnimalStatus, TransactionType, InventoryItem, HealthRecord, HealthSeverity, AnimalGender, User } from '../types';
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
  onChangeView?: (view: string) => void;
  currentUser?: User | null;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

const Dashboard: React.FC<DashboardProps> = ({ animals, transactions, inventory, healthRecords = [], onChangeView, currentUser }) => {
  // Calculate Stats
  const activeAnimals = animals.filter(a => a.status === AnimalStatus.ACTIVE);
  const totalAnimals = activeAnimals.length;
  
  const males = activeAnimals.filter(a => a.gender === AnimalGender.MALE).length;
  const females = activeAnimals.filter(a => a.gender === AnimalGender.FEMALE).length;
  
  const todayStr = getTodayDateString();
  const herdStats = calculateLotWeighingStats(activeAnimals, todayStr);
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
      {/* Banner de Cotação Regional Scot Consultoria */}
      <ScotQuoteBar 
        compact={true} 
        onNavigateToCalculators={() => onChangeView?.('tools')} 
      />

      {/* Banner de Parceiros do Agro - 3 Espaços */}
      <PartnersBanner currentUser={currentUser} />

      {/* Resumo do Rebanho & KPIs Principais */}
      <div className="space-y-5">
        <div className="agro-card p-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Resumo Detalhado do Rebanho</h3>
                <p className="text-xs text-slate-500">Métricas consolidadas de contagem, peso e GMD</p>
              </div>
            </div>
            <button 
              onClick={() => onChangeView?.('animals')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Ver Rebanho Completo →
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ativo</p>
              <p className="text-2xl font-black text-slate-900 font-nums mt-0.5">{totalAnimals} <span className="text-xs font-normal text-slate-400">cab.</span></p>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Balança</p>
              <p className="text-2xl font-black text-slate-900 font-nums mt-0.5">{herdStats.avgRecordedArroba.toFixed(1)} <span className="text-xs font-normal text-slate-400">@</span></p>
              <p className="text-[11px] text-slate-500 font-medium font-nums">{herdStats.avgRecordedWeightKg.toFixed(1)} kg/cab</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">GMD Médio</p>
              <p className="text-2xl font-black text-emerald-700 font-nums mt-0.5">+{herdStats.avgGmd.toFixed(3)} <span className="text-xs font-normal text-emerald-600">kg/d</span></p>
              <p className="text-[11px] text-emerald-600 font-medium">Ganho Médio Diário</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
              <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-600" /> Peso Previsto
              </p>
              <p className="text-2xl font-black text-emerald-900 font-nums mt-0.5">{herdStats.avgPredictedArroba.toFixed(1)} <span className="text-xs font-bold text-emerald-700">@</span></p>
              <p className="text-[11px] text-emerald-700 font-bold font-nums">{herdStats.avgPredictedWeightKg.toFixed(1)} kg hoje</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Machos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900 font-nums">{males}</span>
                <span className="text-xs text-slate-500 font-medium">({totalAnimals > 0 ? ((males/totalAnimals)*100).toFixed(0) : 0}%)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fêmeas</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900 font-nums">{females}</span>
                <span className="text-xs text-slate-500 font-medium">({totalAnimals > 0 ? ((females/totalAnimals)*100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Rápidos de Indicadores Financeiros e Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="agro-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo em Caixa</p>
                <h3 className={`text-2xl font-black mt-1 font-nums ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Saldo acumulado</p>
              </div>
              <div className={`p-3 rounded-xl border ${totalBalance >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <Wallet size={22} />
              </div>
            </div>
          </div>

          <div className="agro-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Casos de Saúde</p>
                <h3 className={`text-2xl font-black mt-1 font-nums ${healthAlerts > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{healthAlerts}</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Animais em tratamento</p>
              </div>
              <div className={`p-3 rounded-xl border ${healthAlerts > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                <HeartPulse size={22} />
              </div>
            </div>
          </div>

          <div className="agro-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque Baixo</p>
                <h3 className={`text-2xl font-black mt-1 font-nums ${stockAlerts > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{stockAlerts}</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Insumos em nível crítico</p>
              </div>
              <div className={`p-3 rounded-xl border ${stockAlerts > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                <Package size={22} />
              </div>
            </div>
          </div>

          <div className="agro-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arroba Média</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-nums">{(avgWeightKg / 30).toFixed(1)} @</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Desempenho por cabeça</p>
              </div>
              <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200">
                <Scale size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Fluxo de Caixa */}
        <div className="lg:col-span-8 agro-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-600" /> Evolução Financeira
              </h3>
              <p className="text-xs text-slate-500">Receitas x Despesas nos últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> <span className="text-slate-600">Receita</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> <span className="text-slate-600">Despesa</span></div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastMonths}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{fill: '#64748B'}} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}} 
                  formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget de Pendências Críticas */}
        <div className="lg:col-span-4 agro-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" /> Ações Urgentes
              </h3>
              <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">Manejo do Dia</span>
            </div>

            <div className="space-y-3">
              {urgentTasks.length > 0 ? (
                  urgentTasks.map((task, idx) => (
                      <div key={`${task.id}-${idx}`} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 border ${
                              task.severity === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                              task.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                              'bg-sky-50 text-sky-600 border-sky-200'
                          }`}>
                              {task.type === 'stock' ? <Package size={15} /> : <HeartPulse size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                              <p className="text-[11px] text-slate-500">
                                  {task.animal ? `Brinco ${task.animal}` : task.subtitle}
                              </p>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                      </div>
                  ))
              ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-100">
                          <TrendingUp size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Tudo Atualizado!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Nenhuma pendência crítica detectada no momento.</p>
                  </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => onChangeView?.('health')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200/80"
          >
            Ver Todos os Manejos →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Gastos */}
        <div className="agro-card p-6">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <PieChartIcon size={18} className="text-emerald-600" /> Gastos por Categoria
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
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto font-bold text-slate-900 font-nums">R$ {entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lembretes Próximos */}
        <div className="agro-card p-6">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" /> Agenda de Manejos
          </h3>
          <div className="space-y-3">
            {healthRecords.filter(r => r.status === 'Em Tratamento').slice(0, 5).map((r, idx) => (
                <div key={`${r.id}-${idx}`} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200">
                            {new Date(r.startDate).getDate()}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">{r.title}</p>
                            <p className="text-[11px] text-slate-500">Animal: Brinco {animals.find(a => a.id === r.animalId)?.earTag || '-'}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">Em Tratamento</span>
                </div>
            ))}
            {healthRecords.filter(r => r.status === 'Em Tratamento').length === 0 && (
                <p className="text-center py-10 text-xs text-slate-400 font-medium italic">Nenhum manejo agendado para os próximos dias.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
