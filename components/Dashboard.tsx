
import React from 'react';
import { Animal, Transaction, AnimalStatus, TransactionType, InventoryItem, HealthRecord, HealthSeverity } from '../types';
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
  HeartPulse
} from 'lucide-react';
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
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

const Dashboard: React.FC<DashboardProps> = ({ animals, transactions, inventory, healthRecords = [], onChangeView }) => {
  // Calculate Stats
  const activeAnimals = animals.filter(a => a.status === AnimalStatus.ACTIVE);
  const totalAnimals = activeAnimals.length;
  
  const animalsWithHistory = activeAnimals.filter(a => a.history?.length > 0);
  const avgGmd = animalsWithHistory.length > 0 
    ? animalsWithHistory.reduce((acc, a) => acc + (a.history[a.history.length-1].gmd || 0), 0) / animalsWithHistory.length 
    : 0;

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
        id: r.id,
        type: 'health-critical',
        title: `CRÍTICO: ${r.title}`,
        animal: animals.find(a => a.id === r.animalId)?.earTag,
        severity: 'high'
    })),
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({
        id: i.id,
        type: 'stock',
        title: `Repor ${i.name}`,
        subtitle: `${i.quantity} ${i.unit} restantes`,
        severity: 'medium'
    })),
    ...healthRecords.filter(r => r.status === 'Em Tratamento' && r.notifyAsReminder && r.repeatAfterDays).map(r => ({
        id: r.id,
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
    <div className="space-y-6 pb-10">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rebanho Ativo</p>
              <h3 className="text-3xl font-black text-gray-800 mt-1">{totalAnimals}</h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Animais no pasto</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">GMD Médio</p>
              <h3 className="text-3xl font-black text-green-600 mt-1">{avgGmd.toFixed(3)}</h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">kg/dia global</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Casos de Saúde</p>
              <h3 className={`text-3xl font-black mt-1 ${healthAlerts > 0 ? 'text-red-600' : 'text-gray-800'}`}>{healthAlerts}</h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Em tratamento</p>
            </div>
            <div className={`p-3 rounded-xl ${healthAlerts > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-orange-50 text-orange-600'}`}>
              <HeartPulse size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Saldo em Caixa</p>
              <h3 className={`text-3xl font-black mt-1 ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {totalBalance.toLocaleString('pt-BR')}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Fluxo total</p>
            </div>
            <div className={`p-4 rounded-2xl ${totalBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Fluxo de Caixa */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-green-600" /> Evolução Financeira
              </h3>
              <p className="text-xs text-gray-400 font-medium">Receitas vs Despesas nos últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Receita</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Despesa</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastMonths}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#9CA3AF'}} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget de Pendências Críticas */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Ações Urgentes
            </h3>
            <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Hoje</span>
          </div>

          <div className="flex-1 space-y-3">
            {urgentTasks.length > 0 ? (
                urgentTasks.map((task) => (
                    <div key={task.id} className="group p-3 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-100 hover:shadow-sm transition-all flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                            task.severity === 'high' ? 'bg-red-100 text-red-600' : 
                            task.severity === 'medium' ? 'bg-orange-100 text-orange-600' : 
                            'bg-blue-100 text-blue-600'
                        }`}>
                            {task.type === 'stock' ? <Package size={16} /> : <HeartPulse size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{task.title}</p>
                            <p className="text-[10px] text-gray-500 font-medium">
                                {task.animal ? `Animal ${task.animal}` : task.subtitle}
                            </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="p-4 bg-green-50 rounded-full mb-4">
                        <TrendingUp size={32} className="text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Tudo Atualizado!</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhuma pendência crítica detectada no momento.</p>
                </div>
            )}
          </div>

          <button 
            onClick={() => onChangeView?.('health')}
            className="w-full mt-6 py-3 rounded-xl bg-gray-50 text-[10px] font-black text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all uppercase tracking-widest"
          >
            Ver todos os manejos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Gastos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-purple-600" /> Gastos por Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
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
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto text-gray-800">R$ {entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lembretes Próximos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" /> Agenda de Manejos
          </h3>
          <div className="space-y-4">
            {healthRecords.filter(r => r.status === 'Em Tratamento').slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-100 transition-colors">
                            {new Date(r.startDate).getDate()}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">{r.title}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Animal: {animals.find(a => a.id === r.animalId)?.earTag}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Pendente</span>
                </div>
            ))}
            {healthRecords.filter(r => r.status === 'Em Tratamento').length === 0 && (
                <p className="text-center py-10 text-xs text-gray-400 font-medium italic">Nenhum manejo agendado para os próximos dias.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
