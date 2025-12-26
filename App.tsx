
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

  const handleAddAnimal = (newAnimal: Animal) => setAnimals(prev => [...prev, newAnimal]);
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
      const prodCost = days * dailyCost;
      const profit = value - (animal.purchaseValue || 0) - prodCost;

      setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.SOLD, weightKg: finalWeight } : a));
      const desc = `Venda: ${animal.earTag} | Bruto: R$ ${value.toLocaleString()} | Lucro Liq Est: R$ ${profit.toLocaleString()}`;
      setTransactions(prev => [...prev, { id: Date.now().toString(), date, description: desc, amount: value, type: TransactionType.INCOME, category: 'Vendas' }]);
  };

  const handleAnimalDeath = (id: string, date: string, cause: string) => {
    setAnimals(prev => prev.map(a => a.id === id ? { ...a, status: AnimalStatus.DEAD, deathDate: date, deathCause: cause } : a));
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard animals={animals} transactions={transactions} inventory={inventory} healthRecords={healthRecords} onChangeView={setCurrentView} />;
      case 'animals':
        return <AnimalManager animals={animals} lots={lots} onAddAnimal={handleAddAnimal} onUpdateAnimal={handleUpdateAnimal} onDeleteAnimal={handleDeleteAnimal} onSellAnimal={handleSellAnimal} onAnimalDeath={handleAnimalDeath} savedDailyCost={globalDailyCost} />;
      case 'health':
        return <HealthManager animals={animals} healthRecords={healthRecords} onAddRecord={r => setHealthRecords(prev => [...prev, r])} onUpdateRecord={r => setHealthRecords(prev => prev.map(rec => rec.id === r.id ? r : rec))} />;
      case 'tasks':
        return <TaskManager tasks={tasks} onAddTask={t => setTasks(prev => [...prev, t])} onUpdateTask={t => setTasks(prev => prev.map(task => task.id === t.id ? t : task))} onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))} />;
      case 'lots':
        return <LotManager lots={lots} animals={animals} onAddLot={l => setLots(prev => [...prev, l])} onUpdateLot={l => setLots(prev => prev.map(lot => lot.id === l.id ? l : lot))} />;
      case 'inventory':
        return <InventoryManager inventory={inventory} onAddStock={i => setInventory(prev => [...prev, i])} onUpdateStock={i => setInventory(prev => prev.map(item => item.id === i.id ? i : item))} />;
      case 'finance':
        return <FinanceManager transactions={transactions} onAddTransaction={t => setTransactions(prev => [...prev, t])} />;
      case 'tools':
        return <ToolsCalculator initialTab="prediction" onSaveDailyCost={(c, l) => l ? setLots(prev => prev.map(item => item.id === l ? { ...item, dailyCost: c } : item)) : setGlobalDailyCost(c)} lots={lots} />;
      case 'valor_diario':
        return <ToolsCalculator initialTab="daily_value" onSaveDailyCost={(c, l) => l ? setLots(prev => prev.map(item => item.id === l ? { ...item, dailyCost: c } : item)) : setGlobalDailyCost(c)} lots={lots} />;
      case 'suplementacao':
        return <ToolsCalculator initialTab="diet" onSaveDailyCost={(c, l) => l ? setLots(prev => prev.map(item => item.id === l ? { ...item, dailyCost: c } : item)) : setGlobalDailyCost(c)} lots={lots} />;
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
