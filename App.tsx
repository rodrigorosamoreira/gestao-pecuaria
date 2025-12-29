
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [globalDailyCost, setGlobalDailyCost] = useState<number>(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('agro_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      const dataKey = `agro_data_${user.id}`;
      const savedData = localStorage.getItem(dataKey);
      
      if (savedData) {
        const parsed: FarmData = JSON.parse(savedData);
        setAnimals(parsed.animals || []);
        setTransactions(parsed.transactions || []);
        setInventory(parsed.inventory || []);
        setLots(parsed.lots || []);
        setHealthRecords(parsed.healthRecords || []);
        setTasks(parsed.tasks || []);
        setGlobalDailyCost(parsed.globalDailyCost || 0);
      } else {
        setAnimals([]);
        setTransactions([]);
        setInventory([]);
        setLots([{ id: '1', name: 'Engorda 2024', description: 'Animais para abate' }]);
        setHealthRecords([]);
        setTasks([]);
        setGlobalDailyCost(0);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const dataKey = `agro_data_${user.id}`;
      const dataToSave: FarmData = {
        animals,
        transactions,
        inventory,
        lots,
        healthRecords,
        tasks,
        globalDailyCost
      };
      localStorage.setItem(dataKey, JSON.stringify(dataToSave));
    }
  }, [user, animals, transactions, inventory, lots, healthRecords, tasks, globalDailyCost]);

  const handleLogin = (newUser: User) => {
    localStorage.setItem('agro_session', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('agro_session');
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleAddAnimal = (newAnimal: Animal) => {
    setAnimals(prev => [...prev, newAnimal]);
    
    if (newAnimal.purchaseValue && newAnimal.purchaseValue > 0) {
      const buyTransaction: Transaction = {
        id: `buy-${Date.now()}`,
        date: newAnimal.entryDate || new Date().toISOString().split('T')[0],
        description: `Compra Animal: ${newAnimal.earTag} (${newAnimal.breed})`,
        amount: newAnimal.purchaseValue,
        type: TransactionType.EXPENSE,
        category: 'Compra de Animais'
      };
      setTransactions(prev => [...prev, buyTransaction]);
    }
  };

  const handleAddBatch = (newAnimals: Animal[], totalCost: number) => {
    setAnimals(prev => [...prev, ...newAnimals]);
    
    if (totalCost > 0) {
      const first = newAnimals[0];
      const buyTransaction: Transaction = {
        id: `batch-buy-${Date.now()}`,
        date: first.entryDate || new Date().toISOString().split('T')[0],
        description: `Compra Carga: ${newAnimals.length} animais (Peso Médio: ${first.weightKg}kg)`,
        amount: totalCost,
        type: TransactionType.EXPENSE,
        category: 'Compra de Animais'
      };
      setTransactions(prev => [...prev, buyTransaction]);
    }
  };

  const handleUpdateAnimal = (updatedAnimal: Animal) => setAnimals(prev => prev.map(a => a.id === updatedAnimal.id ? updatedAnimal : a));
  
  const handleDeleteAnimal = (id: string) => {
    setAnimals(prev => prev.filter(a => a.id !== id));
    setHealthRecords(prev => prev.filter(r => r.animalId !== id));
  };

  const handleSellAnimal = (id: string, date: string, value: number, finalWeight: number) => {
      const animal = animals.find(a => a.id === id);
      if (!animal) return;
      
      const lot = lots.find(l => l.id === animal.lotId);
      const dailyCost = lot?.dailyCost || globalDailyCost;
      const entryDate = animal.entryDate ? new Date(animal.entryDate) : new Date();
      const saleDate = new Date(date);
      
      entryDate.setUTCHours(0,0,0,0);
      saleDate.setUTCHours(0,0,0,0);
      
      const days = Math.max(0, Math.ceil((saleDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)));
      const totalMaintenanceCost = days * dailyCost;
      const purchaseVal = animal.purchaseValue || 0;
      const netProfit = value - purchaseVal - totalMaintenanceCost;

      setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.SOLD, weightKg: finalWeight } : a));
      
      const newTransactions: Transaction[] = [];
      newTransactions.push({ 
        id: `sale-in-${Date.now()}`, 
        date, 
        description: `Venda Animal: ${animal.earTag} | Lucro Liq Est: R$ ${netProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 
        amount: value, 
        type: TransactionType.INCOME, 
        category: 'Vendas' 
      });

      if (totalMaintenanceCost > 0) {
        newTransactions.push({
          id: `maint-ex-${Date.now()}`,
          date,
          description: `Custo Estadia: ${animal.earTag} (${days} dias x R$ ${dailyCost.toFixed(2)})`,
          amount: totalMaintenanceCost,
          type: TransactionType.EXPENSE,
          category: 'Custo de Produção'
        });
      }

      setTransactions(prev => [...prev, ...newTransactions]);
  };

  const handleSellLot = (lotId: string, date: string, avgWeight: number, priceMode: 'head' | 'arroba', priceValue: number) => {
      const lotAnimals = animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
      if (lotAnimals.length === 0) return;
      
      const lot = lots.find(l => l.id === lotId);
      const dailyCost = lot?.dailyCost || globalDailyCost;
      const saleDate = new Date(date);
      saleDate.setUTCHours(0,0,0,0);
      
      let totalPurchaseVal = 0;
      let totalStayCost = 0;
      let totalRevenue = 0;
      const headcount = lotAnimals.length;

      // Cálculo da Receita Total do Lote
      if (priceMode === 'head') {
        totalRevenue = headcount * priceValue;
      } else {
        totalRevenue = headcount * (avgWeight / 30) * priceValue;
      }
      
      lotAnimals.forEach(animal => {
          totalPurchaseVal += (animal.purchaseValue || 0);
          const entryDate = animal.entryDate ? new Date(animal.entryDate) : new Date();
          entryDate.setUTCHours(0,0,0,0);
          const days = Math.max(0, Math.ceil((saleDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)));
          totalStayCost += (days * dailyCost);
      });
      
      const netProfit = totalRevenue - totalPurchaseVal - totalStayCost;

      // Atualiza status e peso final de todos os animais do lote
      setAnimals(prev => prev.map(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE ? { ...a, status: AnimalStatus.SOLD, weightKg: avgWeight } : a));
      
      const newTransactions: Transaction[] = [];
      newTransactions.push({ 
        id: `lot-sale-${Date.now()}`, 
        date, 
        description: `Venda Lote: ${lot?.name} (${headcount} cab. @ ${avgWeight}kg) | Lucro Liq: R$ ${netProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 
        amount: totalRevenue, 
        type: TransactionType.INCOME, 
        category: 'Vendas' 
      });

      if (totalStayCost > 0) {
        newTransactions.push({
          id: `lot-maint-${Date.now()}`,
          date,
          description: `Custo Estadia Acumulado Lote: ${lot?.name} (Até ${date})`,
          amount: totalStayCost,
          type: TransactionType.EXPENSE,
          category: 'Custo de Produção'
        });
      }

      setTransactions(prev => [...prev, ...newTransactions]);
  };

  const handleAnimalDeath = (id: string, date: string, cause: string) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;

    setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.DEAD, deathDate: date, deathCause: cause } : a));

    const lot = lots.find(l => l.id === animal.lotId);
    const dailyCost = lot?.dailyCost || globalDailyCost;
    const entryDate = animal.entryDate ? new Date(animal.entryDate) : new Date();
    const deathD = new Date(date);
    entryDate.setUTCHours(0,0,0,0);
    deathD.setUTCHours(0,0,0,0);
    const days = Math.max(0, Math.ceil((deathD.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)));
    const totalMaintenanceCost = days * dailyCost;

    if (totalMaintenanceCost > 0) {
      setTransactions(prev => [...prev, {
        id: `death-loss-${Date.now()}`,
        date,
        description: `Perda (Óbito): ${animal.earTag} | Estadia acumulada até morte`,
        amount: totalMaintenanceCost,
        type: TransactionType.EXPENSE,
        category: 'Perdas/Mortalidade'
      }]);
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard animals={animals} transactions={transactions} inventory={inventory} healthRecords={healthRecords} onChangeView={setCurrentView} />;
      case 'animals':
        return <AnimalManager 
          animals={animals} 
          lots={lots} 
          onAddAnimal={handleAddAnimal} 
          onAddBatch={handleAddBatch}
          onUpdateAnimal={handleUpdateAnimal} 
          onDeleteAnimal={handleDeleteAnimal} 
          onSellAnimal={handleSellAnimal} 
          onAnimalDeath={handleAnimalDeath} 
          onSellLot={handleSellLot}
          savedDailyCost={globalDailyCost} 
        />;
      case 'health':
        return <HealthManager animals={animals} healthRecords={healthRecords} onAddRecord={r => setHealthRecords(prev => [...prev, r])} onUpdateRecord={r => setHealthRecords(prev => prev.map(rec => rec.id === r.id ? r : rec))} />;
      case 'tasks':
        return <TaskManager tasks={tasks} onAddTask={t => setTasks(prev => [...prev, t])} onUpdateTask={t => setTasks(prev => prev.map(task => task.id === t.id ? t : task))} onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))} />;
      case 'lots':
        return <LotManager lots={lots} animals={animals} onAddLot={l => setLots(prev => [...prev, l])} onUpdateLot={l => setLots(prev => prev.map(lot => lot.id === l.id ? l : lot))} onSellLot={(id, date, total) => handleSellLot(id, date, 540, 'head', total / (animals.filter(a => a.lotId === id).length || 1))} />;
      case 'inventory':
        return <InventoryManager inventory={inventory} onAddStock={i => {
            setInventory(prev => [...prev, i]);
            if (i.unitCost * i.quantity > 0) {
              setTransactions(prev => [...prev, {
                id: `stock-buy-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `Compra Insumo: ${i.name} (${i.quantity} ${i.unit})`,
                amount: i.unitCost * i.quantity,
                type: TransactionType.EXPENSE,
                category: 'Insumos'
              }]);
            }
          }} onUpdateStock={i => setInventory(prev => prev.map(item => item.id === i.id ? i : item))} />;
      case 'finance':
        return <FinanceManager transactions={transactions} onAddTransaction={t => setTransactions(prev => [...prev, t])} />;
      case 'tools':
      case 'valor_diario':
      case 'suplementacao':
        return <ToolsCalculator initialTab={currentView === 'suplementacao' ? 'diet' : currentView === 'valor_diario' ? 'daily_value' : 'prediction'} onSaveDailyCost={(c, l) => l ? setLots(prev => prev.map(item => item.id === l ? { ...item, dailyCost: c } : item)) : setGlobalDailyCost(c)} lots={lots} />;
      default:
        return <Dashboard animals={animals} transactions={transactions} inventory={inventory} healthRecords={healthRecords} onChangeView={setCurrentView} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLogout={handleLogout} 
      user={user}
      animals={animals}
      inventory={inventory}
      healthRecords={healthRecords}
      tasks={tasks}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
