
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnimalManager from './components/AnimalManager';
import FinanceManager from './components/FinanceManager';
import InventoryManager from './components/InventoryManager';
import LotManager from './components/LotManager';
import ToolsCalculator from './components/ToolsCalculator';
import HealthManager from './components/HealthManager';
import TaskManager from './components/TaskManager';
import { supabase } from './lib/supabase';
import { 
  Animal, 
  AnimalStatus, 
  Transaction, 
  TransactionType, 
  InventoryItem, 
  Lot, 
  User,
  FarmData,
  HealthRecord,
  Task
} from './types';
import { Database, Copy, CheckCircle, AlertTriangle, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [globalDailyCost, setGlobalDailyCost] = useState<number>(0);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          provider: 'email'
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          provider: 'email'
        });
      } else {
        setUser(null);
        setIsLoaded(false);
        setDbError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Data from Supabase
  useEffect(() => {
    if (user) {
      const fetchFarmData = async () => {
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            if (error.message.includes('public.user_data') || error.code === '42P01') {
              setDbError('missing_table');
            } else {
              console.error('Erro detalhado:', error.message);
            }
            return;
          }

          setDbError(null);
          if (data && data.data) {
            const parsed: FarmData = data.data;
            setAnimals(parsed.animals || []);
            setTransactions(parsed.transactions || []);
            setInventory(parsed.inventory || []);
            setLots(parsed.lots || []);
            setHealthRecords(parsed.healthRecords || []);
            setTasks(parsed.tasks || []);
            setGlobalDailyCost(parsed.globalDailyCost || 0);
          } else {
            setLots([{ id: '1', name: 'Engorda 2024', description: 'Animais para abate' }]);
          }
        } catch (err) {
          console.error('Falha crítica:', err);
        } finally {
          setIsLoaded(true);
        }
      };

      fetchFarmData();
    }
  }, [user]);

  // Sync Data to Supabase
  useEffect(() => {
    if (user && isLoaded && !dbError) {
      const syncData = async () => {
        setIsSyncing(true);
        try {
          const dataToSave: FarmData = {
            animals,
            transactions,
            inventory,
            lots,
            healthRecords,
            tasks,
            globalDailyCost
          };

          const { error } = await supabase
            .from('user_data')
            .upsert({ 
              user_id: user.id, 
              data: dataToSave,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (error) {
            if (error.message.includes('public.user_data')) setDbError('missing_table');
            console.error('Erro na sincronização:', error.message);
          }
        } catch (err) {
          console.error('Falha ao sincronizar:', err);
        } finally {
          setIsSyncing(false);
        }
      };

      const timer = setTimeout(() => syncData(), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoaded, dbError, animals, transactions, inventory, lots, healthRecords, tasks, globalDailyCost]);

  const handleLogin = (newUser: User) => setUser(newUser);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoaded(false);
    setCurrentView('dashboard');
  };

  const handleAddAnimal = (newAnimal: Animal) => {
    setAnimals(prev => [...prev, newAnimal]);
    if (newAnimal.purchaseValue && newAnimal.purchaseValue > 0) {
      setTransactions(prev => [...prev, {
        id: `buy-${Date.now()}`,
        date: newAnimal.entryDate || new Date().toISOString().split('T')[0],
        description: `Compra Animal: ${newAnimal.earTag} (${newAnimal.breed})`,
        amount: newAnimal.purchaseValue,
        type: TransactionType.EXPENSE,
        category: 'Compra de Animais'
      }]);
    }
  };

  const handleAddBatch = (newAnimals: Animal[], totalCost: number) => {
    setAnimals(prev => [...prev, ...newAnimals]);
    if (totalCost > 0) {
      setTransactions(prev => [...prev, {
        id: `batch-buy-${Date.now()}`,
        date: newAnimals[0].entryDate || new Date().toISOString().split('T')[0],
        description: `Compra Carga: ${newAnimals.length} animais`,
        amount: totalCost,
        type: TransactionType.EXPENSE,
        category: 'Compra de Animais'
      }]);
    }
  };

  const handleUpdateAnimal = (updatedAnimal: Animal) => setAnimals(prev => prev.map(a => a.id === updatedAnimal.id ? updatedAnimal : a));
  const handleDeleteAnimal = (id: string) => {
    setAnimals(prev => prev.filter(a => a.id !== id));
    setHealthRecords(prev => prev.filter(r => r.animalId !== id));
  };

  const handleSellAnimal = (id: string, date: string, value: number, finalWeight: number) => {
    setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.SOLD, weightKg: finalWeight } : a));
    setTransactions(prev => [...prev, { 
      id: `sale-${Date.now()}`, 
      date, 
      description: `Venda Animal`, 
      amount: value, 
      type: TransactionType.INCOME, 
      category: 'Vendas' 
    }]);
  };

  const handleSellLot = (lotId: string, date: string, avgWeight: number, priceMode: 'head' | 'arroba', priceValue: number) => {
    const lotAnimals = animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
    if (lotAnimals.length === 0) return;
    const totalRevenue = priceMode === 'head' ? lotAnimals.length * priceValue : lotAnimals.length * (avgWeight / 30) * priceValue;
    setAnimals(prev => prev.map(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE ? { ...a, status: AnimalStatus.SOLD, weightKg: avgWeight } : a));
    setTransactions(prev => [...prev, { id: `lot-sale-${Date.now()}`, date, description: `Venda Lote`, amount: totalRevenue, type: TransactionType.INCOME, category: 'Vendas' }]);
  };

  const handleAnimalDeath = (id: string, date: string, cause: string) => {
    setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.DEAD, deathDate: date, deathCause: cause } : a));
  };

  const sqlSetupScript = `
-- 1. Crie a tabela de dados do usuário
create table public.user_data (
  user_id uuid references auth.users not null primary key,
  data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilite o RLS (Row Level Security)
alter table public.user_data enable row level security;

-- 3. Crie a política de acesso (apenas o dono vê seus dados)
create policy "Usuários acessam apenas seus próprios dados"
  on public.user_data
  for all
  using (auth.uid() = user_id);
`.trim();

  if (!user) return <Login onLogin={handleLogin} />;

  if (dbError === 'missing_table') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-2xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-emerald-50 scale-in">
          <div className="p-10 bg-emerald-600 text-white flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-3xl"><Database size={48} /></div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Configuração Necessária</h2>
              <p className="text-emerald-100 font-bold uppercase text-[10px] tracking-widest mt-1">Banco de Dados Supabase Detectado mas não configurado</p>
            </div>
          </div>
          <div className="p-10 space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="text-amber-600 shrink-0" size={24} />
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                A tabela <code className="bg-amber-100 px-1.5 py-0.5 rounded font-black text-amber-900">user_data</code> não foi encontrada. 
                Copie o script abaixo e execute-o no <strong>SQL Editor</strong> do seu painel Supabase para ativar o salvamento automático.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => { navigator.clipboard.writeText(sqlSetupScript); alert('Copiado!'); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
                >
                  <Copy size={14} /> Copiar SQL
                </button>
              </div>
              <div className="bg-gray-900 rounded-3xl p-8 pt-14 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 bg-gray-800/50 px-6 py-2 flex items-center gap-2 border-b border-gray-700">
                  <Terminal size={14} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Supabase SQL Editor</span>
                </div>
                <pre className="text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed custom-scrollbar">
                  {sqlSetupScript}
                </pre>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <CheckCircle size={20} /> Já executei o SQL, recarregar sistema
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard animals={animals} transactions={transactions} inventory={inventory} healthRecords={healthRecords} onChangeView={setCurrentView} />;
      case 'animals': return <AnimalManager animals={animals} lots={lots} onAddAnimal={handleAddAnimal} onAddBatch={handleAddBatch} onUpdateAnimal={handleUpdateAnimal} onDeleteAnimal={handleDeleteAnimal} onSellAnimal={handleSellAnimal} onAnimalDeath={handleAnimalDeath} onSellLot={handleSellLot} savedDailyCost={globalDailyCost} />;
      case 'health': return <HealthManager animals={animals} healthRecords={healthRecords} onAddRecord={r => setHealthRecords(prev => [...prev, r])} onUpdateRecord={r => setHealthRecords(prev => prev.map(rec => rec.id === r.id ? r : rec))} />;
      case 'tasks': return <TaskManager tasks={tasks} onAddTask={t => setTasks(prev => [...prev, t])} onUpdateTask={t => setTasks(prev => prev.map(task => task.id === t.id ? t : task))} onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))} />;
      case 'lots': return <LotManager lots={lots} animals={animals} onAddLot={l => setLots(prev => [...prev, l])} onUpdateLot={l => setLots(prev => prev.map(lot => lot.id === l.id ? l : lot))} onSellLot={(id, date, total) => handleSellLot(id, date, 540, 'head', total / (animals.filter(a => a.lotId === id).length || 1))} />;
      case 'inventory': return <InventoryManager inventory={inventory} onAddStock={i => setInventory(prev => [...prev, i])} onUpdateStock={i => setInventory(prev => prev.map(item => item.id === i.id ? i : item))} />;
      case 'finance': return <FinanceManager transactions={transactions} onAddTransaction={t => setTransactions(prev => [...prev, t])} />;
      case 'tools':
      case 'valor_diario':
      case 'suplementacao':
        return <ToolsCalculator initialTab={currentView === 'suplementacao' ? 'diet' : currentView === 'valor_diario' ? 'daily_value' : 'prediction'} onSaveDailyCost={(c, l) => l ? setLots(prev => prev.map(item => item.id === l ? { ...item, dailyCost: c } : item)) : setGlobalDailyCost(c)} lots={lots} />;
      default: return <Dashboard animals={animals} transactions={transactions} inventory={inventory} healthRecords={healthRecords} onChangeView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} user={user} animals={animals} inventory={inventory} healthRecords={healthRecords} tasks={tasks}>
      {isSyncing && <div className="fixed bottom-4 right-4 bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50"><Loader2 size={12} className="animate-spin" /> SALVANDO...</div>}
      {!isLoaded && <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center"><div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4"><Loader2 size={40} className="animate-spin text-emerald-600" /><p className="font-black text-gray-800 uppercase tracking-widest text-xs">Carregando Fazenda...</p></div></div>}
      {renderContent()}
    </Layout>
  );
};

const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default App;
