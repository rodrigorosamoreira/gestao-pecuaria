
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
  Task,
  Farm
} from './types';
import { Database, Copy, CheckCircle, AlertTriangle, Tractor, X, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');

  const activeFarm = farms.find(f => f.id === activeFarmId);
  const farmData = activeFarm?.data || {
    animals: [],
    transactions: [],
    inventory: [],
    lots: [],
    healthRecords: [],
    tasks: [],
    globalDailyCost: 0
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: String(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário'),
          email: session.user.email || '',
          provider: 'email'
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: String(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário'),
          email: session.user.email || '',
          provider: 'email'
        });
      } else {
        setUser(null);
        setIsLoaded(false);
        setFarms([]);
        setActiveFarmId(null);
        setDbError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchFarms = async () => {
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            if (error.code === '42P01') setDbError('missing_table');
            else setDbError(String(error.message || 'Erro ao carregar dados'));
            return;
          }

          setFarms(data || []);
          if (data && data.length > 0) {
            const savedActiveId = localStorage.getItem(`activeFarm_${user.id}`);
            if (savedActiveId && data.some(f => f.id === savedActiveId)) {
              setActiveFarmId(savedActiveId);
            } else {
              setActiveFarmId(data[0].id);
            }
          }
          setDbError(null);
        } catch (err: any) {
          console.error('Falha crítica:', err);
          setDbError(String(err?.message || 'Erro de conexão inesperado'));
        } finally {
          setIsLoaded(true);
        }
      };

      fetchFarms();
    }
  }, [user]);

  useEffect(() => {
    if (user && isLoaded && !dbError && activeFarmId && activeFarm) {
      const syncData = async () => {
        setIsSyncing(true);
        try {
          const { error } = await supabase
            .from('user_data')
            .update({ 
              data: activeFarm.data,
              updated_at: new Date().toISOString()
            })
            .eq('id', activeFarmId);

          if (error) console.error('Erro na sincronização:', error.message);
        } catch (err) {
          console.error('Falha ao sincronizar:', err);
        } finally {
          setIsSyncing(false);
        }
      };

      const timer = setTimeout(() => syncData(), 2000);
      return () => clearTimeout(timer);
    }
  }, [farms, activeFarmId]);

  const handleCreateFarm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFarmName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_data')
        .insert({
          user_id: user.id,
          name: newFarmName,
          data: {
            animals: [],
            transactions: [],
            inventory: [],
            lots: [],
            healthRecords: [],
            tasks: [],
            globalDailyCost: 0
          }
        })
        .select()
        .single();

      if (error) throw error;
      setFarms(prev => [...prev, data]);
      setActiveFarmId(data.id);
      setIsCreatingFarm(false);
      setNewFarmName('');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar fazenda: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleDeleteFarm = async (id: string) => {
    const farmToDelete = farms.find(f => f.id === id);
    if (!farmToDelete || !user) return;

    const confirmMsg = `⚠️ EXCLUIR FAZENDA: "${farmToDelete.name.toUpperCase()}"?\n\nEsta ação é IRREVERSÍVEL. Todos os dados de animais, finanças e estoque desta fazenda serão apagados para sempre.`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro Supabase na exclusão:', error);
        throw new Error(error.message);
      }

      const updatedFarms = farms.filter(f => f.id !== id);
      setFarms(updatedFarms);

      if (activeFarmId === id) {
        if (updatedFarms.length > 0) {
          const nextId = updatedFarms[0].id;
          setActiveFarmId(nextId);
          localStorage.setItem(`activeFarm_${user.id}`, nextId);
        } else {
          setActiveFarmId(null);
          localStorage.removeItem(`activeFarm_${user.id}`);
        }
      }
      
      alert(`Fazenda "${farmToDelete.name}" removida com sucesso.`);
    } catch (err: any) {
      console.error('Falha completa na exclusão:', err);
      alert(`ERRO AO EXCLUIR: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const updateActiveFarmData = (updater: (prev: FarmData) => FarmData) => {
    if (!activeFarmId) return;
    setFarms(prev => prev.map(f => f.id === activeFarmId ? { ...f, data: updater(f.data) } : f));
  };

  const handleSelectFarm = (id: string) => {
    setActiveFarmId(id);
    if (user) localStorage.setItem(`activeFarm_${user.id}`, id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoaded(false);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (!activeFarm) return null;
    switch (currentView) {
      case 'dashboard': return <Dashboard animals={farmData.animals} transactions={farmData.transactions} inventory={farmData.inventory} healthRecords={farmData.healthRecords} onChangeView={setCurrentView} />;
      case 'animals': return (
        <AnimalManager 
          animals={farmData.animals} 
          lots={farmData.lots} 
          onAddAnimal={a => updateActiveFarmData(d => ({ ...d, animals: [...d.animals, a], transactions: a.purchaseValue ? [...d.transactions, { id: `buy-${Date.now()}`, date: a.entryDate || new Date().toISOString().split('T')[0], description: `Compra: ${a.earTag}`, amount: a.purchaseValue, type: TransactionType.EXPENSE, category: 'Compra Animais' }] : d.transactions }))} 
          onAddBatch={(ans, cost) => updateActiveFarmData(d => ({ ...d, animals: [...d.animals, ...ans], transactions: cost > 0 ? [...d.transactions, { id: `bt-${Date.now()}`, date: ans[0].entryDate || new Date().toISOString().split('T')[0], description: `Lote: ${ans.length} cab.`, amount: cost, type: TransactionType.EXPENSE, category: 'Compra Animais' }] : d.transactions }))}
          onUpdateAnimal={a => updateActiveFarmData(d => ({ ...d, animals: d.animals.map(old => old.id === a.id ? a : old) }))} 
          onDeleteAnimal={id => updateActiveFarmData(d => ({ ...d, animals: d.animals.filter(a => a.id !== id), healthRecords: d.healthRecords.filter(r => r.animalId !== id) }))}
          onSellAnimal={(id, date, val, w) => updateActiveFarmData(d => ({ ...d, animals: d.animals.map(a => a.id === id ? { ...a, status: AnimalStatus.SOLD, weightKg: w } : a), transactions: [...d.transactions, { id: `s-${Date.now()}`, date, description: 'Venda Individual', amount: val, type: TransactionType.INCOME, category: 'Vendas' }] }))}
          onAnimalDeath={(id, date, cause) => updateActiveFarmData(d => ({ ...d, animals: d.animals.map(a => a.id === id ? { ...a, status: AnimalStatus.DEAD, deathDate: date, deathCause: cause } : a) }))}
          onSellLot={(lotId, date, avgW, mode, val) => {
            const lotAns = farmData.animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
            const lot = farmData.lots.find(l => l.id === lotId);
            const daily = lot?.dailyCost || farmData.globalDailyCost;
            let totalStay = 0;
            let totalBuy = 0;
            lotAns.forEach(a => {
              totalBuy += (a.purchaseValue || 0);
              const days = Math.max(0, Math.ceil((new Date(date).getTime() - new Date(a.entryDate || date).getTime()) / (1000 * 3600 * 24)));
              totalStay += (days * daily);
            });
            const rev = mode === 'head' ? lotAns.length * val : lotAns.length * (avgW / 30) * val;
            updateActiveFarmData(d => ({
              ...d,
              animals: d.animals.map(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE ? { ...a, status: AnimalStatus.SOLD, weightKg: avgW } : a),
              transactions: [
                ...d.transactions,
                { id: `ls-${Date.now()}`, date, description: `Venda Lote: ${lot?.name} (${lotAns.length} cab.)`, amount: rev, type: TransactionType.INCOME, category: 'Vendas' },
                { id: `lm-${Date.now()}`, date, description: `Custo Estadia Lote: ${lot?.name}`, amount: totalStay, type: TransactionType.EXPENSE, category: 'Produção' }
              ]
            }));
          }}
          savedDailyCost={farmData.globalDailyCost} 
        />
      );
      case 'health': return <HealthManager animals={farmData.animals} healthRecords={farmData.healthRecords} onAddRecord={r => updateActiveFarmData(d => ({ ...d, healthRecords: [...d.healthRecords, r] }))} onUpdateRecord={r => updateActiveFarmData(d => ({ ...d, healthRecords: d.healthRecords.map(old => old.id === r.id ? r : old) }))} />;
      case 'tasks': return <TaskManager tasks={farmData.tasks} onAddTask={t => updateActiveFarmData(d => ({ ...d, tasks: [...d.tasks, t] }))} onUpdateTask={t => updateActiveFarmData(d => ({ ...d, tasks: d.tasks.map(old => old.id === t.id ? t : old) }))} onDeleteTask={id => updateActiveFarmData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))} />;
      case 'lots': return <LotManager lots={farmData.lots} animals={farmData.animals} onAddLot={l => updateActiveFarmData(d => ({ ...d, lots: [...d.lots, l] }))} onUpdateLot={l => updateActiveFarmData(d => ({ ...d, lots: d.lots.map(old => old.id === l.id ? l : old) }))} onSellLot={(id, date, total) => alert('Utilize a venda por lote no Rebanho para cálculo de lucro')} />;
      case 'inventory': return <InventoryManager inventory={farmData.inventory} onAddStock={i => updateActiveFarmData(d => ({ ...d, inventory: [...d.inventory, i] }))} onUpdateStock={i => updateActiveFarmData(d => ({ ...d, inventory: d.inventory.map(old => old.id === i.id ? i : old) }))} />;
      case 'finance': return <FinanceManager transactions={farmData.transactions} onAddTransaction={t => updateActiveFarmData(d => ({ ...d, transactions: [...d.transactions, t] }))} />;
      case 'valor_diario':
      case 'suplementacao':
      case 'tools':
        return (
          <ToolsCalculator 
            initialTab={currentView === 'suplementacao' ? 'diet' : currentView === 'valor_diario' ? 'daily_value' : 'prediction'} 
            onSaveDailyCost={(cost, lId) => lId 
              ? updateActiveFarmData(d => ({ ...d, lots: d.lots.map(l => l.id === lId ? { ...l, dailyCost: cost } : l) }))
              : updateActiveFarmData(d => ({ ...d, globalDailyCost: cost }))
            } 
            lots={farmData.lots} 
          />
        );
      default: return <Dashboard animals={farmData.animals} transactions={farmData.transactions} inventory={farmData.inventory} healthRecords={farmData.healthRecords} onChangeView={setCurrentView} />;
    }
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLogout={handleLogout} 
      user={user} 
      animals={farmData.animals} 
      inventory={farmData.inventory} 
      healthRecords={farmData.healthRecords} 
      tasks={farmData.tasks}
      farms={farms}
      activeFarmId={activeFarmId}
      onSelectFarm={handleSelectFarm}
      onDeleteFarm={handleDeleteFarm}
      onCreateFarm={() => setIsCreatingFarm(true)}
    >
      {isSyncing && <div className="fixed bottom-4 right-4 bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">Sincronizando...</div>}
      {!isLoaded && <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center font-black uppercase tracking-widest text-xs">Acessando Banco...</div>}
      
      {isCreatingFarm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Nova Unidade</h3>
                 <button onClick={() => setIsCreatingFarm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>
              <form onSubmit={handleCreateFarm} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Fazenda</label>
                    <input type="text" className="w-full border border-gray-100 rounded-2xl px-6 py-4 font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={newFarmName} onChange={e => setNewFarmName(e.target.value)} required autoFocus />
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Cadastrar e Abrir</button>
              </form>
           </div>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};

export default App;
